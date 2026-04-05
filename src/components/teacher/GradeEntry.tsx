import { useState, useEffect } from "react";
import { Save, AlertCircle, Lock, Info } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import { fetchCourses } from "../../redux/slices/courseSlice";
import { fetchUsers } from "../../redux/slices/userSlice";
import api from "../../services/api"; // Đã thêm import api chuẩn của hệ thống

interface GradeEntryProps {
  teacherId: string | number;
}

export default function GradeEntry({ teacherId }: GradeEntryProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { classes } = useSelector((state: RootState) => state.courses);
  const { users } = useSelector((state: RootState) => state.users);

  const teacherClasses = classes.filter(
    (c) => String(c.teacherId) === String(teacherId),
  );
  const [selectedClass, setSelectedClass] = useState(
    teacherClasses[0]?.id || "",
  );
  const [selectedSemester, setSelectedSemester] = useState(""); // Sẽ được tự động gán
  const [grades, setGrades] = useState<
    Record<string, { midterm: number; final: number }>
  >({});
  const [unpaidStudents, setUnpaidStudents] = useState<Record<string, boolean>>(
    {},
  ); // State lưu nợ học phí
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Khởi tạo lớp học mặc định
  useEffect(() => {
    if (!selectedClass && teacherClasses.length > 0) {
      setSelectedClass(teacherClasses[0].id);
    }
  }, [teacherClasses, selectedClass]);

  const currentClass = teacherClasses.find(
    (c) => String(c.id) === String(selectedClass),
  );

  // --- TÍNH NĂNG 1: KHÓA CỨNG HỌC KỲ THEO MÔN HỌC ---
  useEffect(() => {
    if (currentClass) {
      // Tự động tìm học kỳ của môn (Nếu API chưa trả về, tạm gán Học kỳ 1 - 2024 làm mốc)
      const sem =
        (currentClass as any).semester?.name ||
        (currentClass as any).semester ||
        "Học kỳ 1 - 2024";
      setSelectedSemester(sem);
    }
  }, [currentClass]);

  // --- TÍNH NĂNG 2: LẤY DANH SÁCH NỢ HỌC PHÍ ---
  useEffect(() => {
    const fetchDebts = async () => {
      try {
        const res = await api.get("/invoices");
        const debts: Record<string, boolean> = {};
        res.data.forEach((inv: any) => {
          if (
            inv.status === "Unpaid" ||
            inv.status === "CHUA_NOP" ||
            inv.status === "PENDING"
          ) {
            debts[String(inv.studentId || inv.userId)] = true; // Đánh dấu ID sinh viên nợ tiền
          }
        });
        setUnpaidStudents(debts);
      } catch (error) {
        console.warn(
          "Không thể gọi API hóa đơn, bỏ qua kiểm tra công nợ.",
          error,
        );
      }
    };
    fetchDebts();
  }, []);

  // Lấy danh sách điểm
  useEffect(() => {
    const fetchGrades = async () => {
      if (!selectedClass) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/grades?courseId=${selectedClass}`);
        const data = response.data || [];
        const gradesMap: Record<string, { midterm: number; final: number }> =
          {};
        data.forEach((g: any) => {
          gradesMap[String(g.studentId)] = {
            midterm: g.midterm,
            final: g.final,
          };
        });
        setGrades(gradesMap);
      } catch (error) {
        console.error("Failed to fetch grades:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGrades();
  }, [selectedClass]);

  // Lấy danh sách sinh viên an toàn
  let rawStudents =
    currentClass?.students || (currentClass as any)?.enrolledStudents || [];
  if (typeof rawStudents === "string") {
    try {
      rawStudents = JSON.parse(rawStudents);
    } catch (e) {
      rawStudents = [];
    }
  }
  const studentIds = rawStudents.map((s: any) => String(s.id || s));
  const classStudents = users.filter((u: any) =>
    studentIds.includes(String(u.id)),
  );

  const lockedCount = classStudents.filter(
    (s) => unpaidStudents[String(s.id)],
  ).length;

  const handleGradeChange = (
    studentId: string | number,
    type: "midterm" | "final",
    value: string,
  ) => {
    // Không cho phép đổi điểm nếu đang nợ học phí (Bảo mật kép tránh hack UI)
    if (unpaidStudents[String(studentId)]) return;

    const numValue = parseFloat(value) || 0;
    const strStudentId = String(studentId);
    setGrades((prev) => ({
      ...prev,
      [strStudentId]: {
        ...(prev[strStudentId] || { midterm: 0, final: 0 }),
        [type]: numValue,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setIsSaving(true);
    try {
      // Chỉ gửi điểm của những sinh viên KHÔNG nợ học phí lên Server
      const gradesArray = Object.entries(grades)
        .filter(([studentId]) => !unpaidStudents[studentId])
        .map(([studentId, grade]) => ({
          studentId: Number(studentId),
          midterm: grade.midterm,
          final: grade.final,
        }));

      await api.post(`/grades`, {
        courseId: selectedClass,
        semester: selectedSemester,
        grades: gradesArray,
      });

      alert("Đã lưu bảng điểm thành công!");
    } catch (error) {
      console.error("Failed to save grades:", error);
      alert("Lỗi khi lưu bảng điểm.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Nhập điểm sinh viên
          </h1>
          <p className="text-slate-500">
            Quản lý điểm quá trình và điểm thi kết thúc môn
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 transition-all"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Save size={18} />
          )}
          {isSaving ? "Đang lưu..." : "Lưu bảng điểm"}
        </button>
      </div>

      {lockedCount > 0 && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm font-medium border border-red-100 animate-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p>
            Có <strong className="text-red-700 text-base">{lockedCount}</strong>{" "}
            sinh viên bị khóa tính năng nhập điểm do chưa hoàn thành nghĩa vụ
            học phí. Bạn không thể nhập hay chỉnh sửa điểm của các sinh viên
            này.
          </p>
        </div>
      )}

      <div className="card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">
            Chọn lớp học
          </label>
          <select
            className="input-field"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {teacherClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-2 relative">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-1">
            Học kỳ <Lock size={12} className="text-slate-400" />
          </label>
          {/* Ô CHỌN HỌC KỲ BỊ KHÓA CỨNG */}
          <select
            className="input-field bg-slate-100/50 cursor-not-allowed opacity-80 border-slate-200 text-slate-500"
            value={selectedSemester}
            disabled
          >
            <option value={selectedSemester}>{selectedSemester}</option>
          </select>
          <p className="text-[10px] text-slate-400 absolute -bottom-4 right-1">
            Tự động gán theo môn học
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sinh viên
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                Điểm quá trình (40%)
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                Điểm thi (60%)
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                Tổng kết
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  Đang tải bảng điểm...
                </td>
              </tr>
            ) : classStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-slate-500 border-2 border-dashed border-slate-100 m-4 rounded-xl"
                >
                  Chưa có sinh viên nào đăng ký lớp học này.
                </td>
              </tr>
            ) : (
              classStudents.map((student) => {
                const strId = String(student.id);
                const hasDebt = unpaidStudents[strId] === true; // KIỂM TRA CÔNG NỢ
                const studentGrade = grades[strId] || { midterm: 0, final: 0 };
                const total = (
                  studentGrade.midterm * 0.4 +
                  studentGrade.final * 0.6
                ).toFixed(1);

                return (
                  <tr
                    key={student.id}
                    className={`transition-colors ${hasDebt ? "bg-red-50/20" : "hover:bg-slate-50/50"}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            student.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`
                          }
                          alt=""
                          className={`w-8 h-8 rounded-full border border-slate-200 ${hasDebt ? "grayscale opacity-60" : ""}`}
                        />
                        <div>
                          <p
                            className={`font-bold ${hasDebt ? "text-slate-500" : "text-slate-800"}`}
                          >
                            {student.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-400 font-mono">
                              {student.studentId || student.username}
                            </p>
                            {/* NHÃN BÁO NỢ HỌC PHÍ */}
                            {hasDebt && (
                              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-red-600 bg-red-100 px-1.5 py-0.5 rounded shadow-sm">
                                <Lock size={10} /> Nợ học phí
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative inline-block">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          disabled={hasDebt}
                          className={`w-20 px-2 py-1.5 border rounded-lg text-center font-bold outline-none transition-all ${
                            hasDebt
                              ? "bg-slate-100/50 text-slate-400 border-slate-200 cursor-not-allowed select-none"
                              : "border-slate-200 text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20"
                          }`}
                          value={studentGrade.midterm}
                          onChange={(e) =>
                            handleGradeChange(
                              student.id,
                              "midterm",
                              e.target.value,
                            )
                          }
                        />
                        {hasDebt && (
                          <Lock
                            size={12}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400/50"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative inline-block">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          disabled={hasDebt}
                          className={`w-20 px-2 py-1.5 border rounded-lg text-center font-bold outline-none transition-all ${
                            hasDebt
                              ? "bg-slate-100/50 text-slate-400 border-slate-200 cursor-not-allowed select-none"
                              : "border-slate-200 text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20"
                          }`}
                          value={studentGrade.final}
                          onChange={(e) =>
                            handleGradeChange(
                              student.id,
                              "final",
                              e.target.value,
                            )
                          }
                        />
                        {hasDebt && (
                          <Lock
                            size={12}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400/50"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`font-bold text-lg ${
                          hasDebt
                            ? "text-slate-400"
                            : parseFloat(total) >= 5.0
                              ? "text-emerald-600"
                              : "text-red-600"
                        }`}
                      >
                        {hasDebt ? "-" : total}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
        <Info size={20} className="shrink-0" />
        <p className="text-sm font-medium">
          Lưu ý: Điểm sau khi lưu sẽ không thể tự ý chỉnh sửa. Vui lòng kiểm tra
          kỹ trước khi xác nhận. Sinh viên nợ học phí sẽ bị khóa nhập điểm.
        </p>
      </div>
    </div>
  );
}
