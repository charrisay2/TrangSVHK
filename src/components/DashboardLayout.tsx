import { ReactNode, useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  Wallet,
  User as UserIcon,
  LogOut,
  Search,
  Menu,
  X,
  ChevronRight,
  Users,
  BookOpen,
  CheckSquare,
  FileText,
  Upload,
  Settings,
  Megaphone,
} from "lucide-react";
import { Module } from "../App";
import { User, UserRole } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface DashboardLayoutProps {
  children: ReactNode;
  user: User;
  activeModule: Module;
  setActiveModule: (module: Module) => void;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
}

export default function DashboardLayout({
  children,
  user,
  activeModule,
  setActiveModule,
  onLogout,
  onSwitchRole,
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);

  const getNavItems = () => {
    const common = [{ id: "home", label: "Tổng quan", icon: LayoutDashboard }];

    if (user.role === "ADMIN") {
      return [
        ...common,
        { id: "users", label: "Quản lý người dùng", icon: Users },
        { id: "schedule-mgmt", label: "Quản lý lịch học", icon: Calendar },
        { id: "notifications", label: "Tạo thông báo", icon: Megaphone },
        { id: "profile", label: "Hồ sơ", icon: UserIcon },
      ];
    }

    if (user.role === "TEACHER") {
      return [
        ...common,
        { id: "classes", label: "Lớp học của tôi", icon: BookOpen },
        { id: "attendance", label: "Điểm danh", icon: CheckSquare },
        { id: "grade-entry", label: "Nhập điểm", icon: FileText },
        { id: "resources", label: "Tài liệu", icon: Upload },
        { id: "profile", label: "Hồ sơ", icon: UserIcon },
      ];
    }

    return [
      ...common,
      { id: "schedule", label: "Thời khóa biểu", icon: Calendar },
      { id: "course-registration", label: "Đăng ký học phần", icon: BookOpen },
      { id: "grades", label: "Kết quả học tập", icon: GraduationCap },
      { id: "finance", label: "Học phí", icon: Wallet },
      { id: "profile", label: "Hồ sơ", icon: UserIcon },
    ];
  };

  const navItems = getNavItems();

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6">
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
          <GraduationCap size={24} />
        </div>
        <div className={!isSidebarOpen ? "hidden" : ""}>
          <h1 className="font-bold text-xl tracking-tight">EduPortal</h1>
          <p className="text-[10px] uppercase tracking-widest text-blue-200 font-bold">
            {user.role} System
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveModule(item.id as Module);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-white text-primary shadow-sm font-semibold"
                  : "text-blue-100 hover:bg-blue-800/50"
              }`}
            >
              <Icon
                size={20}
                className={
                  isActive
                    ? "text-primary"
                    : "text-blue-200 group-hover:text-white"
                }
              />
              <span className={!isSidebarOpen ? "hidden" : "block"}>
                {item.label}
              </span>
              {isActive && isSidebarOpen && (
                <ChevronRight size={16} className="ml-auto" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 mt-auto">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-blue-100 hover:bg-red-500/20 hover:text-red-200 transition-all group"
        >
          <LogOut
            size={20}
            className="text-blue-200 group-hover:text-red-200"
          />
          <span className={!isSidebarOpen ? "hidden" : "block"}>Đăng xuất</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-bg-main overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-primary text-white transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 w-64 bg-primary text-white z-50 md:hidden"
            >
              <SidebarContent />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-6 right-4 text-white/50 hover:text-white"
              >
                <X size={24} />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 w-64">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 relative">
            {/* Role Switcher for Demo */}
            <div className="relative">
              <button
                onClick={() => setIsRoleSwitcherOpen(!isRoleSwitcherOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
              >
                <Settings size={16} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-700 hidden lg:block">
                  Chuyển vai trò
                </span>
              </button>

              <AnimatePresence>
                {isRoleSwitcherOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50"
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase px-3 py-2">
                      Chọn vai trò Demo
                    </p>
                    {(["ADMIN", "TEACHER", "STUDENT"] as UserRole[]).map(
                      (role) => (
                        <button
                          key={role}
                          onClick={() => {
                            onSwitchRole(role);
                            setIsRoleSwitcherOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            user.role === role
                              ? "bg-primary text-white"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          {role}
                        </button>
                      ),
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* QUẢ CHUÔNG ĐÃ BỊ XÓA HOÀN TOÀN Ở ĐÂY */}

            <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>

            <button
              onClick={() => setActiveModule("profile")}
              className="flex items-center gap-3 p-1 pl-2 hover:bg-slate-100 rounded-full transition-colors group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-none mb-1">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
                  {user.studentId || user.teacherId || "ADMIN"}
                </p>
              </div>
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-9 h-9 rounded-full border border-slate-200"
              />
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
