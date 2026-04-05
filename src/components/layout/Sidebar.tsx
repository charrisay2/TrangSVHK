import { FC, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { logout } from "../../redux/slices/authSlice";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  ClipboardCheck,
  FileText,
  Upload,
  Clock,
  GraduationCap,
  Wallet,
  UserCircle,
  LogOut,
  Menu,
  X,
  Megaphone,
} from "lucide-react";
import { useState } from "react";
import { Module } from "../../App";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeModule: Module;
  setActiveModule: (module: Module) => void;
}

const Sidebar: FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  activeModule,
  setActiveModule,
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  const menuItems = [
    {
      id: "home",
      label: "Tổng quan",
      icon: LayoutDashboard,
      roles: ["ADMIN", "TEACHER", "STUDENT"],
    },
    {
      id: "users",
      label: "Quản lý người dùng",
      icon: Users,
      roles: ["ADMIN"],
      subItems: [
        { id: "staff-mgmt", label: "Giảng viên & Admin" },
        { id: "student-mgmt", label: "Sinh viên" },
      ],
    },
    {
      id: "curriculum-mgmt",
      label: "Quản lý chương trình đào tạo",
      icon: BookOpen,
      roles: ["ADMIN"],
    },
    {
      id: "schedule-mgmt",
      label: "Quản lý lịch học",
      icon: Calendar,
      roles: ["ADMIN"],
    },
    {
      id: "notifications",
      label: "Tạo thông báo",
      icon: Megaphone,
      roles: ["ADMIN"],
    },
    {
      id: "classes",
      label: "Lớp học của tôi",
      icon: BookOpen,
      roles: ["TEACHER"],
    },
    {
      id: "attendance",
      label: "Điểm danh",
      icon: ClipboardCheck,
      roles: ["TEACHER"],
    },
    {
      id: "grade-entry",
      label: "Nhập điểm",
      icon: FileText,
      roles: ["TEACHER"],
    },
    {
      id: "course-registration",
      label: "Đăng ký học phần",
      icon: BookOpen,
      roles: ["STUDENT"],
    },
    { id: "schedule", label: "Lịch học", icon: Clock, roles: ["STUDENT"] },
    {
      id: "grades",
      label: "Kết quả học tập",
      icon: GraduationCap,
      roles: ["STUDENT"],
    },
    { id: "finance", label: "Học phí", icon: Wallet, roles: ["STUDENT"] },
    {
      id: "profile",
      label: "Hồ sơ cá nhân",
      icon: UserCircle,
      roles: ["ADMIN", "TEACHER", "STUDENT"],
    },
  ];

  const filteredMenu = menuItems.filter(
    (item) => user && item.roles.includes(user.role),
  );
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["users"]);

  const toggleMenu = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id],
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-30 h-screen w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static
      `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-center w-full">
            <img
              src="/logo_hk.jpg"
              alt="Vietnam Aviation Academy"
              className="h-10 w-auto object-contain mix-blend-multiply transition-transform hover:scale-105 cursor-pointer"
            />
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 absolute right-2"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="mb-6 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${user?.name}&background=random`
                }
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-slate-800 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {user?.role.toLowerCase()}
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {filteredMenu.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeModule === item.id ||
                (item.subItems &&
                  item.subItems.some((sub) => sub.id === activeModule));
              const isExpanded = expandedMenus.includes(item.id);

              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (item.subItems) {
                        toggleMenu(item.id);
                      } else {
                        setActiveModule(item.id as Module);
                        setIsOpen(false);
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all
                      ${
                        isActive && !item.subItems
                          ? "bg-primary text-white shadow-md shadow-blue-500/20"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={20}
                        className={
                          isActive && !item.subItems
                            ? "text-white"
                            : "text-slate-400"
                        }
                      />
                      {item.label}
                    </div>
                    {item.subItems && (
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </button>

                  {item.subItems && isExpanded && (
                    <div className="mt-1 ml-4 pl-4 border-l border-slate-200 space-y-1">
                      {item.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => {
                            setActiveModule(subItem.id as Module);
                            setIsOpen(false);
                          }}
                          className={`
                            w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${
                              activeModule === subItem.id
                                ? "bg-primary/10 text-primary"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            }
                          `}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-100 bg-white">
          <button
            onClick={() => {
              // ĐÃ FIX: Chỉnh về trang chủ trước khi xóa tài khoản
              setActiveModule("home");
              dispatch(logout());
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
