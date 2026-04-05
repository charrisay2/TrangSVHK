import { FC, useState, useEffect, useRef, useMemo } from "react";
import { Menu, Bell, Search, Megaphone } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import { fetchCourses } from "../../redux/slices/courseSlice";
import { io, Socket } from "socket.io-client";
import api from "../../services/api";
import { motion, AnimatePresence } from "motion/react";
import { Module } from "../../App";

interface Notification {
  id: number;
  title?: string;
  message: string;
  type: string;
  targetRole: string;
  targetUserId?: number;
  isRead: boolean;
  createdAt: string;
}

interface NavbarProps {
  toggleSidebar: () => void;
  setActiveModule: (module: Module) => void;
}

const Navbar: FC<NavbarProps> = ({ toggleSidebar, setActiveModule }) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // State quản lý thanh tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Đóng thanh tìm kiếm khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Danh sách Menu động dựa trên Role của User
  const searchableModules = useMemo(() => {
    if (!user) return [];

    const common = [
      { id: "home", label: "Tổng quan hệ thống" },
      { id: "profile", label: "Hồ sơ cá nhân của tôi" },
    ];

    if (user.role === "ADMIN") {
      return [
        ...common,
        { id: "staff-mgmt", label: "Quản lý Giảng viên & Admin" },
        { id: "student-mgmt", label: "Quản lý Sinh viên" },
        { id: "curriculum-mgmt", label: "Quản lý chương trình đào tạo" },
        { id: "schedule-mgmt", label: "Quản lý lịch học" },
        { id: "notifications", label: "Tạo thông báo hệ thống" },
      ];
    }

    if (user.role === "TEACHER") {
      return [
        ...common,
        { id: "classes", label: "Lớp học của tôi" },
        { id: "attendance", label: "Điểm danh sinh viên" },
        { id: "grade-entry", label: "Nhập điểm môn học" },
        { id: "resources", label: "Tải lên tài liệu giảng dạy" },
      ];
    }

    if (user.role === "STUDENT") {
      return [
        ...common,
        { id: "schedule", label: "Lịch học (Thời khóa biểu)" },
        { id: "course-registration", label: "Đăng ký học phần mới" },
        { id: "grades", label: "Xem kết quả học tập / Điểm số" },
        { id: "finance", label: "Xem và đóng Học phí" },
      ];
    }

    return common;
  }, [user]);

  // Lọc kết quả khi gõ chữ (ĐÃ FIX: Chỉ hiện tối đa 3 kết quả)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return searchableModules.slice(0, 3); // Lấy tối đa 3 ô mặc định khi chưa gõ gì
    }
    return searchableModules
      .filter((m) => m.label.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 3); // Cắt mảng, chỉ lấy đúng 3 kết quả đầu tiên
  }, [searchTerm, searchableModules]);

  // Thuật toán cách ly quyền xem thông báo tuyệt đối 100%
  const checkIsForMe = (notif: any) => {
    if (!user) return false;

    const role = String(user.role).toUpperCase();
    const targetRole = String(notif.targetRole).toUpperCase();
    const targetId = notif.targetUserId ? String(notif.targetUserId) : null;
    const myId = String(user.id);

    const isFeeNotif =
      notif.type === "FEE_REMINDER" ||
      notif.message?.toLowerCase().includes("hóa đơn") ||
      notif.message?.toLowerCase().includes("học phí") ||
      notif.title?.toLowerCase().includes("học phí");

    if (role !== "STUDENT" && isFeeNotif) return false;
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
    if (!user) return;

    const fetchNotifs = async () => {
      try {
        const res = await api.get("/notifications");
        const readBroadcasts = JSON.parse(
          localStorage.getItem(`read_notifs_${user.id}`) || "[]",
        );

        const myNotifs = res.data.filter((n: any) => checkIsForMe(n));

        const markedNotifs = myNotifs.map((n: Notification) => {
          if (n.type === "BROADCAST" && readBroadcasts.includes(n.id)) {
            return { ...n, isRead: true };
          }
          return n;
        });

        const sortedNotifs = markedNotifs.sort(
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

    newSocket.on("notification", (newNotif: any) => {
      if (checkIsForMe(newNotif)) {
        setNotifications((prev) => [newNotif, ...prev]);
        if (newNotif.type === "CLASS_UPDATE") {
          dispatch(fetchCourses());
        }
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: number) => {
    if (!user) return;
    try {
      const notif = notifications.find((n) => n.id === id);
      if (notif?.type === "BROADCAST") {
        const readBroadcasts = JSON.parse(
          localStorage.getItem(`read_notifs_${user.id}`) || "[]",
        );
        if (!readBroadcasts.includes(id)) {
          readBroadcasts.push(id);
          localStorage.setItem(
            `read_notifs_${user.id}`,
            JSON.stringify(readBroadcasts),
          );
        }
      } else {
        await api.put(`/notifications/${id}/read`);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu size={24} />
        </button>

        {/* TÍNH NĂNG TÌM KIẾM ĐƯỢC NÂNG CẤP */}
        <div className="hidden md:block relative" ref={searchRef}>
          <div
            className={`flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl w-72 transition-all ${isSearchOpen ? "ring-2 ring-primary/20 bg-white border border-primary/20 shadow-sm" : ""}`}
          >
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tính năng nhanh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 font-medium text-slate-700"
            />
          </div>

          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50"
              >
                <div className="p-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2 mb-1">
                    Gợi ý chức năng
                  </p>
                  {searchResults.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-sm text-slate-500 font-medium">
                        Không tìm thấy kết quả phù hợp
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {searchResults.map((module) => (
                        <button
                          key={module.id}
                          onClick={() => {
                            setActiveModule(module.id as Module);
                            setIsSearchOpen(false);
                            setSearchTerm("");
                          }}
                          className="w-full text-left flex items-center justify-between px-3 py-2.5 hover:bg-blue-50 rounded-lg transition-colors group"
                        >
                          <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">
                            {module.label}
                          </span>
                          <div className="bg-white p-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                            <Search size={14} className="text-primary" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* QUẢ CHUÔNG THÔNG BÁO VỚI BỘ LỌC ĐÃ ĐƯỢC FIX */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
              >
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800 text-sm">
                    Thông báo
                  </h3>
                  {user?.role === "ADMIN" && (
                    <button
                      onClick={() => {
                        setIsNotifOpen(false);
                        setActiveModule("notifications");
                      }}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                    >
                      <Megaphone size={12} /> Tạo thông báo
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      Không có thông báo nào
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.isRead ? "bg-blue-50/50" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!notif.isRead ? "bg-blue-500" : "bg-transparent"}`}
                          ></div>
                          <div>
                            {notif.title && (
                              <p
                                className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${!notif.isRead ? "text-blue-600" : "text-slate-400"}`}
                              >
                                {notif.title}
                              </p>
                            )}
                            <p
                              className={`text-sm ${!notif.isRead ? "font-semibold text-slate-800" : "text-slate-600"}`}
                            >
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(notif.createdAt).toLocaleString(
                                "vi-VN",
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
