import { useState, useEffect } from "react";
import {
  CheckSquare,
  Search,
  Calendar as CalendarIcon,
  Save,
  Check,
  X,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import { fetchCourses } from "../../redux/slices/courseSlice";
import { fetchUsers } from "../../redux/slices/userSlice";
import api from "../../services/api";
import { toast } from "sonner";
interface AttendanceProps {
  teacherId: string | number;
}

export default function Attendance({ teacherId }: AttendanceProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { classes } = useSelector((state: RootState) => state.courses);
  const { users } = useSelector((state: RootState) => state.users);

  const teacherClasses = classes.filter(
    (c) => String(c.teacherId) === String(teacherId),
  );
  const [selectedClass, setSelectedClass] = useState(
    teacherClasses[0]?.id || "",
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<
    Record<string, "Present" | "Absent" | "Late">
  >({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedClass && teacherClasses.length > 0) {
      setSelectedClass(teacherClasses[0].id);
    }
  }, [teacherClasses, selectedClass]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedClass || !date) return;
      setIsLoading(true);
      try {
        const response = await api.get(
          `/attendance/course/${selectedClass}?date=${date}`,
        );
        const records = response.data;
        const newAttendance: Record<string, "Present" | "Absent" | "Late"> = {};
        records.forEach((r: any) => {
          newAttendance[String(r.studentId)] = r.status;
        });
        setAttendance(newAttendance);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedClass, date]);

  const currentClass = teacherClasses.find(
    (c) => String(c.id) === String(selectedClass),
  );

  // Xử lý an toàn danh sách sinh viên
  let rawStudents = currentClass?.students || [];
  if (typeof rawStudents === "string") {
    try {
      rawStudents = JSON.parse(rawStudents);
    } catch (e) {
      rawStudents = [];
    }
  }
  const studentIds = rawStudents.map((s: any) => String(s.id || s));
  const classStudents = users.filter((u) => studentIds.includes(String(u.id)));

  // --- THUẬT TOÁN "GÁC CỔNG" BẢO VỆ NGÀY ĐIỂM DANH ---
  const getExpectedDays = (scheduleStr?: string) => {
    if (!scheduleStr) return null;
    const daysMap: Record<string, number> = {
      "Chủ Nhật": 0,
      "Thứ Hai": 1,
      "Thứ Ba": 2,
      "Thứ Tư": 3,
      "Thứ Năm": 4,
      "Thứ Sáu": 5,
      "Thứ Bảy": 6,
    };
    const expected = [];
    for (const [dayName, dayIndex] of Object.entries(daysMap)) {
      if (scheduleStr.includes(dayName)) {
        expected.push(dayIndex);
      }
    }
    return expected.length > 0 ? expected : null;
  };

  const expectedDays = currentClass
    ? getExpectedDays(currentClass.schedule)
    : null;
  const selectedDateObj = new Date(date);
  const selectedDayOfWeek = selectedDateObj.getDay();

  // Ngày hợp lệ nếu trùng với lịch học (hoặc nếu môn học đó chưa xếp lịch)
  const isDateValid = expectedDays
    ? expectedDays.includes(selectedDayOfWeek)
    : true;
  // ----------------------------------------------------

  const handleStatusChange = (
    studentId: string | number,
    status: "Present" | "Absent" | "Late",
  ) => {
    setAttendance((prev) => ({ ...prev, [String(studentId)]: status }));
  };

  const handleSave = async () => {
    if (!selectedClass || !date || !isDateValid) return;
    setIsLoading(true);
    try {
      await api.post("/attendance", {
        courseId: selectedClass,
        date,
        records: attendance,
      });
      toast.success("Đã lưu điểm danh thành công!");

    } catch (error) {
       toast.error("Lỗi khi lưu điểm danh");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Điểm danh sinh viên
          </h1>
          <p className="text-slate-500">Ghi nhận chuyên cần cho buổi học</p>
        </div>
        {/* Nút lưu sẽ bị mờ và khóa lại nếu chọn sai ngày */}
        <button
          onClick={handleSave}
          disabled={isLoading || !isDateValid}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Save size={18} />
          )}
          Lưu điểm danh
        </button>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
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
                {c.name} ({c.code}) - {c.schedule}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label
            className={`text-xs font-bold uppercase ml-1 ${!isDateValid ? "text-red-500" : "text-slate-400"}`}
          >
            Ngày học
          </label>
          <div className="relative">
            <CalendarIcon
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${!isDateValid ? "text-red-400" : "text-slate-400"}`}
              size={18}
            />
            <input
              type="date"
              className={`input-field pl-10 transition-colors ${!isDateValid ? "border-red-500 focus:ring-red-200 bg-red-50 text-red-700" : ""}`}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {/* Cảnh báo màu đỏ xuất hiện khi chọn sai lịch */}
          {!isDateValid && currentClass && (
            <p className="text-xs text-red-500 mt-1.5 ml-1 font-semibold flex items-center gap-1 animate-in slide-in-from-top-1">
              <AlertCircle size={14} />
              Ngày không hợp lệ! Môn này học vào{" "}
              {currentClass.schedule?.split("(")[0].trim()}.
            </p>
          )}
        </div>
      </div>

      <div
        className={`card overflow-hidden transition-all ${!isDateValid ? "opacity-50 pointer-events-none" : ""}`}
      >
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sinh viên
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-6 py-12 text-center text-slate-500 border-2 border-dashed border-slate-100 rounded-xl"
                >
                  Chưa có sinh viên nào đăng ký lớp học này.
                </td>
              </tr>
            ) : (
              classStudents.map((student) => {
                const status = attendance[student.id] || "Present";
                return (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            student.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`
                          }
                          alt=""
                          className="w-8 h-8 rounded-full border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-800">
                            {student.name}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            {student.studentId || student.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            handleStatusChange(student.id, "Present")
                          }
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            status === "Present"
                              ? "bg-emerald-500 text-white shadow-md"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          <Check size={14} /> Có mặt
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(student.id, "Absent")
                          }
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            status === "Absent"
                              ? "bg-red-500 text-white shadow-md"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          <X size={14} /> Vắng
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, "Late")}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            status === "Late"
                              ? "bg-amber-500 text-white shadow-md"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          <Clock size={14} /> Muộn
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
