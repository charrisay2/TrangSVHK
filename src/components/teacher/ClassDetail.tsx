import { useState, useEffect } from "react";
import { ArrowLeft, Users, Clock, MapPin, Search } from "lucide-react";
import { Class } from "../../types";
import api from "../../services/api";

interface ClassDetailProps {
  course: Class;
  onBack: () => void;
}

export default function ClassDetail({ course, onBack }: ClassDetailProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "students">(
    "overview",
  );
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (activeTab === "students") {
      fetchStudents();
    }
  }, [activeTab, course.id]);

  // ĐÃ FIX: Thuật toán "BẤT TỬ" - Tránh sập app khi Giảng viên bị chặn quyền API
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      let rawData: any[] = [];

      // 1. Cố gắng lấy chi tiết môn học từ API
      try {
        const courseRes = await api.get(`/courses/${course.id}`);
        rawData =
          courseRes.data.students ||
          courseRes.data.enrolledStudents ||
          courseRes.data.enrollments ||
          [];
      } catch (err) {
        console.warn("Không thể gọi API chi tiết môn học, dùng data dự phòng");
      }

      // Xử lý chuỗi JSON nếu có
      if (typeof rawData === "string") {
        try {
          rawData = JSON.parse(rawData);
        } catch (e) {
          rawData = [];
        }
      }

      // Lấy fallback nếu API trả về mảng rỗng nhưng Redux lại có data (Từ Sĩ số = 1)
      if (
        rawData.length === 0 &&
        course.students &&
        course.students.length > 0
      ) {
        rawData =
          typeof course.students === "string"
            ? JSON.parse(course.students)
            : course.students;
      }

      // 2. Định dạng lại mảng (Nếu ko có tên thật, ít nhất phải hiện được ID)
      let formattedStudents = rawData.map((item: any) => {
        const nestedUser =
          item.User || item.user || item.Student || item.student;
        if (nestedUser && nestedUser.name) {
          return { ...nestedUser, id: nestedUser.id || item.studentId };
        }
        if (item.name) return item;

        // Nếu chỉ là cục Đăng ký (Enrollment) hoặc chỉ là con số
        const extractId = item.studentId || item.userId || item.id || item;
        return {
          id: extractId,
          name: `Sinh viên ID: ${extractId}`, // Hiện ID thay vì Unknown để biết data không mất
          email: "Đang tải thông tin...",
          status: "ACTIVE",
        };
      });

      // 3. Cố gắng gọi API /users để đắp tên thật vào (Nếu bị 403 Forbidden thì bỏ qua, ko làm sập app)
      try {
        const usersRes = await api.get("/users");
        const allUsers = usersRes.data || [];

        if (allUsers.length > 0) {
          formattedStudents = formattedStudents.map((fs: any) => {
            const realUser = allUsers.find(
              (u: any) => String(u.id) === String(fs.id),
            );
            if (realUser) {
              return { ...fs, ...realUser }; // Ghi đè tên, email thật
            }
            return fs;
          });
        }
      } catch (userErr) {
        console.warn(
          "LƯU Ý: Backend đang chặn Giảng viên gọi API /users. Hệ thống sẽ hiển thị mã ID.",
        );
      }

      setStudents(formattedStudents);
    } catch (error) {
      console.error("Lỗi nghiêm trọng:", error);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.id).includes(searchQuery),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{course.name}</h1>
          <p className="text-slate-500 font-mono text-sm">{course.code}</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === "students"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Danh sách sinh viên
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Thông tin lớp học
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Mã môn học
                  </p>
                  <p className="font-medium text-slate-800">{course.code}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Số tín chỉ
                  </p>
                  <p className="font-medium text-slate-800">
                    {course.credits || 3}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Lịch học
                  </p>
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <Clock size={16} className="text-primary" />
                    {course.schedule}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Phòng học
                  </p>
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <MapPin size={16} className="text-primary" />
                    {(course as any).room?.name || "Chưa xếp phòng"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6 bg-primary text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-100">Sĩ số</p>
                  <p className="text-3xl font-bold">
                    {students.length > 0
                      ? students.length
                      : course.students?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "students" && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              Danh sách sinh viên ({students.length})
            </h3>
            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm kiếm sinh viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-500">
              Đang tải danh sách...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
              Không tìm thấy sinh viên nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      MSSV
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Họ và tên
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr
                      key={student.id || index}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 font-mono text-sm text-slate-600">
                        {student.studentId ||
                          student.username ||
                          `SV${1000 + Number(student.id || index)}`}
                      </td>
                      <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                        <img
                          src={
                            student.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`
                          }
                          alt=""
                          className="w-8 h-8 rounded-full bg-slate-200"
                        />
                        {student.name || "Đang tải tên..."}
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        {student.email || "Đang tải thông tin..."}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {student.status === "ACTIVE"
                            ? "Đang học"
                            : student.status || "Đang học"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
