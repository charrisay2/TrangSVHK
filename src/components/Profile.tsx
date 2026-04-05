import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Building,
  Calendar,
  Edit2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { User } from "../types";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { useEffect, useMemo, useState } from "react";
import { fetchGrades } from "../redux/slices/gradeSlice";
import { fetchCourses } from "../redux/slices/courseSlice";
import api from "../services/api";

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { grades } = useSelector(
    (state: RootState) => state.grades || { grades: [] },
  );

  const { classes: courses } = useSelector(
    (state: RootState) => state.courses || { classes: [] },
  );

  const [studentClasses, setStudentClasses] = useState<any[]>([]);

  useEffect(() => {
    if (user.role === "STUDENT") {
      dispatch(fetchGrades());
      dispatch(fetchCourses());

      api
        .get("/classes")
        .then((res) => setStudentClasses(res.data))
        .catch((err) => console.error("Lỗi tải danh sách lớp:", err));
    }
  }, [dispatch, user.role]);

  const { studentGpa, totalCredits } = useMemo(() => {
    if (user.role !== "STUDENT") return { studentGpa: "0.00", totalCredits: 0 };
    if (!grades || grades.length === 0)
      return { studentGpa: "0.00", totalCredits: 0 };

    const myGrades = grades.filter(
      (g) => String(g.studentId) === String(user.id),
    );
    if (myGrades.length === 0) return { studentGpa: "0.00", totalCredits: 0 };

    let totalScore = 0;
    let creditsCount = 0;

    myGrades.forEach((g) => {
      // FIX: Đã ép kiểu (g as any).courseId để hết báo đỏ
      const course = courses.find(
        (c) => String(c.id) === String((g as any).courseId),
      );
      const credits = course?.credits || 3;

      const finalScore = Number(g.midterm) * 0.4 + Number(g.final) * 0.6;

      totalScore += finalScore * credits;
      creditsCount += credits;
    });

    if (creditsCount === 0) return { studentGpa: "0.00", totalCredits: 0 };
    return {
      studentGpa: (totalScore / creditsCount).toFixed(2),
      totalCredits: creditsCount,
    };
  }, [grades, courses, user.id, user.role]);

  const getSubtitle = () => {
    if (user.role === "ADMIN") return "Quản trị hệ thống";
    return `Mã số: ${user.username}`;
  };

  const getAcademicInfo = () => {
    if (user.role === "STUDENT") {
      if ((user as any).major?.name) return (user as any).major.name;
      if (user.majorId === 1) return "Công nghệ thông tin";
      if (user.majorId === 2) return "Kinh tế";
      return "Chưa cập nhật ngành";
    }
    if (user.role === "TEACHER")
      return (user as any).department?.name || "Khoa Công nghệ thông tin";
    return "Phòng Đào Tạo & Quản lý";
  };

  const getClassInfo = () => {
    if (user.role === "STUDENT") {
      if ((user as any).studentClass?.name)
        return (user as any).studentClass.name;

      if (user.classId && studentClasses.length > 0) {
        const foundClass = studentClasses.find(
          (c) => String(c.id) === String(user.classId),
        );
        if (foundClass) return foundClass.name;
      }
      return "Đang tải dữ liệu...";
    }
    return "";
  };

  const formatJoinDate = (dateStr: any) => {
    if (!dateStr) return new Date().toLocaleDateString("vi-VN");
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Hồ sơ người dùng
          </h1>
          <p className="text-slate-500">
            Thông tin cá nhân và tài khoản của bạn
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="card p-8 text-center">
            <div className="relative inline-block mb-4">
              <img
                src={
                  user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                }
                alt="Avatar"
                className="w-32 h-32 rounded-full border-4 border-white shadow-xl mx-auto"
              />
              <div className="absolute bottom-1 right-1 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center text-white">
                <ShieldCheck size={16} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
            <p className="text-primary font-semibold text-sm mb-6">
              {getSubtitle()}
            </p>

            <div className="flex items-center justify-center gap-2 mb-6">
              <span
                className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                  user.role === "ADMIN"
                    ? "bg-purple-50 text-purple-600 border-purple-100"
                    : user.role === "TEACHER"
                      ? "bg-blue-50 text-blue-600 border-blue-100"
                      : "bg-emerald-50 text-emerald-600 border-emerald-100"
                }`}
              >
                {user.role}
              </span>
            </div>

            {user.role === "STUDENT" && (
              <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Tín chỉ
                  </p>
                  <p className="font-bold text-slate-800 text-lg">
                    {totalCredits}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                    GPA
                  </p>
                  <p className="font-bold text-slate-800 text-lg">
                    {studentGpa}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-slate-800 mb-4">Thông tin liên hệ</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                  <Mail size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Email
                  </p>
                  <p className="text-slate-700 font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                  <Phone size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Số điện thoại
                  </p>
                  <p className="text-slate-700 font-medium">
                    {user.phone || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                  <MapPin size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Địa chỉ
                  </p>
                  <p className="text-slate-700 font-medium">
                    {user.address || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <BookOpen size={20} className="text-primary" />
              {user.role === "STUDENT"
                ? "Thông tin học vấn"
                : user.role === "TEACHER"
                  ? "Thông tin giảng dạy"
                  : "Thông tin quản trị"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <Building size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                      {user.role === "STUDENT"
                        ? "Ngành học"
                        : user.role === "TEACHER"
                          ? "Chuyên môn"
                          : "Bộ phận"}
                    </p>
                    <p className="text-slate-800 font-bold">
                      {getAcademicInfo()}
                    </p>
                  </div>
                </div>

                {user.role === "STUDENT" && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                        Lớp sinh hoạt
                      </p>
                      <p className="text-slate-800 font-bold">
                        {getClassInfo()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                      Ngày tham gia
                    </p>
                    <p className="text-slate-800 font-bold">
                      {formatJoinDate(user.joinDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                      Trạng thái tài khoản
                    </p>
                    <p className="text-emerald-600 font-bold">
                      {user.status === "ACTIVE"
                        ? "Đang hoạt động"
                        : user.status || "Đang hoạt động"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
