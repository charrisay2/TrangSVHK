import {
  Calendar,
  GraduationCap,
  Wallet,
  Bell,
  ArrowRight,
  Clock,
  MapPin,
  Users,
  BookOpen,
} from "lucide-react";
import { User } from "../types";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { useEffect, useMemo, useState } from "react";
import { fetchCourses } from "../redux/slices/courseSlice";
import { fetchUsers } from "../redux/slices/userSlice";
import { fetchInvoices } from "../redux/slices/invoiceSlice";
import { fetchGrades } from "../redux/slices/gradeSlice";
import api from "../services/api";
import { io, Socket } from "socket.io-client";

interface Notification {
  id: number;
  message: string;
  type: string;
  targetRole: string;
  targetUserId?: string | number | null;
  isRead: boolean;
  createdAt: string;
}

interface HomeProps {
  user: User;
}

export default function Home({ user }: HomeProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { classes } = useSelector((state: RootState) => state.courses);
  const { users } = useSelector((state: RootState) => state.users);
  const { invoices } = useSelector((state: RootState) => state.invoices);
  const { grades } = useSelector(
    (state: RootState) => state.grades || { grades: [] },
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  // Bức tường thép chặn rác
  const checkIsForMe = (notif: any) => {
    if (!user) return false;

    const role = String(user.role).toUpperCase();
    const targetRole = String(notif.targetRole).toUpperCase();
    const targetId = notif.targetUserId ? String(notif.targetUserId) : null;
    const myId = String(user.id);

    // Bức tường thép: Admin và Giảng viên KHÔNG BAO GIỜ nhận thông báo học phí
    const isFeeNotif =
      notif.type === "FEE_REMINDER" ||
      notif.message.toLowerCase().includes("hóa đơn") ||
      notif.message.toLowerCase().includes("học phí");

    if (role !== "STUDENT" && isFeeNotif) {
      return false;
    }

    if (role === "ADMIN") return targetRole === "ADMIN" || targetRole === "ALL";

    if (role === "TEACHER") {
      if (targetRole === "STUDENT" || targetRole === "ADMIN") return false;
      if (targetId) return targetId === myId;
      return targetRole === "TEACHER" || targetRole === "ALL";
    }

    if (role === "STUDENT") {
      if (targetRole === "ADMIN" || targetRole === "TEACHER") return false;
      if (targetId) return targetId === myId;
      return targetRole === "STUDENT" || targetRole === "ALL";
    }

    return false;
  };

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchUsers());

    if (user.role === "STUDENT") {
      dispatch(fetchInvoices());
      dispatch(fetchGrades());

      const fetchAttendance = async () => {
        try {
          const res = await api.get(`/attendance/student/${user.id}`);
          setAttendanceRecords(res.data);
        } catch (error) {
          console.error("Failed to fetch attendance", error);
        }
      };
      fetchAttendance();
    }

    const fetchNotifs = async () => {
      try {
        const res = await api.get("/notifications");
        const myNotifs = res.data.filter((n: any) => checkIsForMe(n));
        const sortedNotifs = myNotifs.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setNotifications(sortedNotifs);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };
    fetchNotifs();

    const newSocket = io(
      (import.meta as any).env.VITE_API_URL || "http://localhost:3000",
    );
    setSocket(newSocket);

    const handleNewNotification = (newNotification: Notification) => {
      if (checkIsForMe(newNotification)) {
        setNotifications((prev) => [newNotification, ...prev]);
      }
    };

    newSocket.on("notification", handleNewNotification);

    return () => {
      newSocket.off("notification", handleNewNotification);
      newSocket.disconnect();
    };
  }, [dispatch, user]);

  const studentGpa = useMemo(() => {
    if (!grades || grades.length === 0) return "0.00";

    const myGrades = grades.filter(
      (g) => String(g.studentId) === String(user.id),
    );
    if (myGrades.length === 0) return "0.00";

    let totalScore = 0;
    let totalCredits = 0;

    myGrades.forEach((g) => {
      const course = classes.find(
        (c) => String(c.id) === String((g as any).courseId),
      );
      const credits = course?.credits || 3;

      const finalScore = Number(g.midterm) * 0.4 + Number(g.final) * 0.6;

      totalScore += finalScore * credits;
      totalCredits += credits;
    });

    if (totalCredits === 0) return "0.00";
    return (totalScore / totalCredits).toFixed(2);
  }, [grades, classes, user.id]);

  const attendancePercentage = useMemo(() => {
    if (attendanceRecords.length === 0) return 0;
    const presentCount = attendanceRecords.filter(
      (r) => r.status === "Present" || r.status === "Late",
    ).length;
    return Math.round((presentCount / attendanceRecords.length) * 100);
  }, [attendanceRecords]);

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const todayDayName = new Date()
    .toLocaleDateString("vi-VN", { weekday: "long" })
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const renderAdminDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">
              {users.filter((u) => u.role === "STUDENT").length}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Tổng số sinh viên
            </p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">
              {users.filter((u) => u.role === "TEACHER").length}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Tổng số giảng viên
            </p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">
              {classes.length}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Lớp học đang hoạt động
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Hoạt động gần đây
          </h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <p className="text-sm text-slate-600">
                  Người dùng <span className="font-bold">SV202400{i}</span> vừa
                  đăng nhập hệ thống.
                </p>
                <span className="text-[10px] text-slate-400 ml-auto">
                  5 phút trước
                </span>
              </div>
            ))}
          </div>
        </section>
        {/* ĐÃ KHÔI PHỤC: Khung thông báo cho Admin */}
        <section className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Thông báo hệ thống
          </h2>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                Không có thông báo nào
              </div>
            ) : (
              notifications.slice(0, 5).map((ann) => (
                <div
                  key={ann.id}
                  className="p-3 border-l-4 border-primary bg-slate-50 rounded-r-lg"
                >
                  <p className="text-sm font-bold text-slate-800">
                    {ann.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(ann.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );

  const teacherTodaySchedule = useMemo(() => {
    return classes
      .filter((c) => {
        const isMyClass = c.teacherId === user.id;
        const isToday = c.schedule.includes(todayDayName);
        return isMyClass && isToday;
      })
      .sort((a, b) => {
        const timeA = a.schedule.match(/\(([\d:]+)/)?.[1] || "";
        const timeB = b.schedule.match(/\(([\d:]+)/)?.[1] || "";
        return timeA.localeCompare(timeB);
      });
  }, [classes, user.id, todayDayName]);

  const renderTeacherDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-6">
          <p className="text-xs text-slate-400 font-bold uppercase mb-1">
            Lớp học học kỳ này
          </p>
          <p className="text-3xl font-bold text-slate-800">
            {classes.filter((c) => c.teacherId === user.id).length}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-xs text-slate-400 font-bold uppercase mb-1">
            Tổng số sinh viên
          </p>
          <p className="text-3xl font-bold text-slate-800">
            {classes
              .filter((c) => String(c.teacherId) === String(user.id))
              .reduce((acc, curr) => acc + (curr.students?.length || 0), 0)}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-xs text-slate-400 font-bold uppercase mb-1">
            Giờ giảng dạy/tuần
          </p>
          <p className="text-3xl font-bold text-slate-800">12</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Lịch dạy hôm nay ({todayDayName})
          </h2>
          {teacherTodaySchedule.length > 0 ? (
            <div className="space-y-4">
              {teacherTodaySchedule.map((c) => (
                <div
                  key={c.id}
                  className="card p-5 hover:border-primary/30 transition-all group cursor-pointer border-l-4 border-l-primary"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-blue-50 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase">
                      {c.code}
                    </span>
                    <Clock
                      size={16}
                      className="text-slate-300 group-hover:text-primary transition-colors"
                    />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">
                    {c.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{c.schedule.split("(")[1].replace(")", "")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{c.room?.name || "Chưa xếp phòng"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center bg-slate-50 border-dashed">
              <p className="text-slate-500">
                Hôm nay bạn không có lịch dạy nào.
              </p>
            </div>
          )}
        </section>

        {/* ĐÃ KHÔI PHỤC: Khung thông báo cho Giảng viên */}
        <section className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Bell size={20} className="text-primary" />
            Thông báo
          </h2>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                Không có thông báo nào
              </div>
            ) : (
              notifications.slice(0, 5).map((ann) => (
                <div
                  key={ann.id}
                  className="card p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-blue-100 text-blue-700">
                      {ann.type === "BROADCAST"
                        ? "Hệ thống"
                        : ann.type === "CLASS_UPDATE"
                          ? "Lớp học"
                          : "Thông báo"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(ann.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1 line-clamp-2">
                    {ann.message}
                  </h3>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );

  const studentTodaySchedule = useMemo(() => {
    return classes
      .filter((c) => {
        const isRegistered = c.students?.some(
          (id) => String(id) === String(user.id),
        );
        const isToday = c.schedule.includes(todayDayName);
        return isRegistered && isToday;
      })
      .sort((a, b) => {
        const timeA = a.schedule.match(/\(([\d:]+)/)?.[1] || "";
        const timeB = b.schedule.match(/\(([\d:]+)/)?.[1] || "";
        return timeA.localeCompare(timeB);
      });
  }, [classes, user.id, todayDayName]);

  const renderStudentDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={20} className="text-primary" />
                Lịch học hôm nay ({todayDayName})
              </h2>
              <button className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                Xem tất cả <ArrowRight size={14} />
              </button>
            </div>
            {studentTodaySchedule.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentTodaySchedule.map((c) => (
                  <div
                    key={c.id}
                    className="card p-5 hover:border-primary/30 transition-all group border-l-4 border-l-primary"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2">
                        <span className="bg-blue-50 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase">
                          {c.code}
                        </span>
                        {(user.cohort || (user as any).studentClass?.cohort) !==
                          c.targetCohort && (
                          <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-1 rounded uppercase">
                            Học vượt
                          </span>
                        )}
                      </div>
                      <Clock
                        size={16}
                        className="text-slate-300 group-hover:text-primary transition-colors"
                      />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">
                      {c.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{c.schedule.split("(")[1].replace(")", "")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{c.room?.name || "Chưa xếp phòng"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center bg-slate-50 border-dashed">
                <p className="text-slate-500">
                  Hôm nay bạn không có lịch học nào.
                </p>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <GraduationCap size={24} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{studentGpa}</p>
              <p className="text-xs text-slate-500 font-medium">GPA Hiện tại</p>
            </div>
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-3">
                <Calendar size={24} />
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {attendancePercentage}%
              </p>
              <p className="text-xs text-slate-500 font-medium">Chuyên cần</p>
            </div>
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-3">
                <Wallet size={24} />
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(
                  invoices
                    .filter((i) => i.status === "Unpaid")
                    .reduce((sum, i) => sum + i.amount, 0),
                )}
              </p>
              <p className="text-xs text-slate-500 font-medium">Học phí nợ</p>
            </div>
          </div>
        </div>

        {/* ĐÃ KHÔI PHỤC: Khung thông báo cho Sinh viên */}
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Bell size={20} className="text-primary" />
              Thông báo
            </h2>
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  Không có thông báo nào
                </div>
              ) : (
                notifications.slice(0, 5).map((ann) => (
                  <div
                    key={ann.id}
                    className="card p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-blue-100 text-blue-700">
                        {ann.type === "BROADCAST"
                          ? "Hệ thống"
                          : ann.type === "CLASS_UPDATE"
                            ? "Lớp học"
                            : "Thông báo"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(ann.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1 line-clamp-2">
                      {ann.message}
                    </h3>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Chào mừng trở lại, {user.name}!
          </h1>
          <p className="text-slate-500 font-medium">{today}</p>
        </div>
      </div>

      {user.role === "ADMIN" && renderAdminDashboard()}
      {user.role === "TEACHER" && renderTeacherDashboard()}
      {user.role === "STUDENT" && renderStudentDashboard()}
    </div>
  );
}
