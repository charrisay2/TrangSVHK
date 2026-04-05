import { useState, useEffect, FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  UserPlus,
  Edit2,
  Filter,
  X,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../redux/slices/userSlice";
import { User, UserRole, Department, StudentClass } from "../../types";
import api from "../../services/api";
import { toast } from "sonner"; // ĐÃ THÊM TOAST

export default function UserManagement({
  type,
}: {
  type: "STAFF" | "STUDENT";
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { users, isLoading, error } = useSelector(
    (state: RootState) => state.users,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [cohortFilter, setCohortFilter] = useState<string>("ALL");
  const [majorFilter, setMajorFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | string | null>(
    null,
  );

  // ĐÃ THÊM: Modal Custom Xác Nhận
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    type: "danger" | "info";
  } | null>(null);

  // Form state
  const [newUser, setNewUser] = useState<Partial<User> & { password?: string }>(
    {
      role: type === "STUDENT" ? "STUDENT" : "TEACHER",
      name: "",
      username: "",
      email: "",
      password: "",
      status: "ACTIVE",
      classId: undefined,
      departmentId: undefined,
      majorId: undefined,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
    },
  );

  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [majors, setMajors] = useState<any[]>([]);

  useEffect(() => {
    dispatch(fetchUsers());
    fetchDepartmentsAndClasses();
  }, [dispatch]);

  const fetchDepartmentsAndClasses = async () => {
    try {
      const [deptRes, classRes, majorRes] = await Promise.all([
        api.get("/departments"),
        api.get("/classes"),
        api.get("/majors"),
      ]);
      setDepartments(deptRes.data);
      setClasses(classRes.data);
      setMajors(majorRes.data);
    } catch (error) {
      console.error("Error fetching departments or classes:", error);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (type === "STAFF" && u.role === "STUDENT") return false;
    if (type === "STUDENT" && u.role !== "STUDENT") return false;

    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

    let matchesCohort = true;
    let matchesMajor = true;

    if (type === "STUDENT") {
      const studentClass = classes.find((c) => c.id === u.classId);
      if (cohortFilter !== "ALL") {
        matchesCohort = studentClass?.cohort === cohortFilter;
      }
      if (majorFilter !== "ALL") {
        matchesMajor = studentClass?.majorId === Number(majorFilter);
      }
    }

    return matchesSearch && matchesRole && matchesCohort && matchesMajor;
  });

  const uniqueCohorts = Array.from(
    new Set(classes.map((c) => c.cohort)),
  ).filter(Boolean);

  const handleDelete = async (id: string | number) => {
    // THAY THẾ window.confirm
    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa",
      message:
        "Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.",
      type: "danger",
      action: async () => {
        await dispatch(deleteUser(Number(id)));
        toast.success("Xóa người dùng thành công!");
      },
    });
  };

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();

    if (!newUser.username || !newUser.name || !newUser.email) {
      toast.warning("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (isEditModalOpen && editingUserId) {
      const resultAction = await dispatch(
        updateUser({ id: Number(editingUserId), data: newUser }),
      );
      if (updateUser.fulfilled.match(resultAction)) {
        setIsEditModalOpen(false);
        setEditingUserId(null);
        setNewUser({
          role: type === "STUDENT" ? "STUDENT" : "TEACHER",
          name: "",
          username: "",
          email: "",
          password: "",
          majorId: undefined,
          classId: undefined,
          departmentId: undefined,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
        });
        toast.success("Cập nhật người dùng thành công!");
      } else {
        toast.error("Cập nhật người dùng thất bại: " + resultAction.payload);
      }
    } else {
      if (!newUser.password) {
        toast.warning("Vui lòng nhập mật khẩu");
        return;
      }
      const resultAction = await dispatch(createUser(newUser));

      if (createUser.fulfilled.match(resultAction)) {
        setIsAddModalOpen(false);
        setNewUser({
          role: type === "STUDENT" ? "STUDENT" : "TEACHER",
          name: "",
          username: "",
          email: "",
          password: "",
          majorId: undefined,
          classId: undefined,
          departmentId: undefined,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
        });
        toast.success("Thêm người dùng thành công!");
      } else {
        toast.error("Thêm người dùng thất bại: " + resultAction.payload);
      }
    }
  };

  const openEditModal = (user: User) => {
    let formattedJoinDate = "";
    const userJoinDate = (user as any).joinDate;

    if (userJoinDate) {
      formattedJoinDate = userJoinDate.toString().includes("T")
        ? userJoinDate.toString().split("T")[0]
        : userJoinDate;
    }

    setNewUser({
      ...user,
      password: "",
      joinDate: formattedJoinDate,
    });
    setEditingUserId(user.id);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Modal Custom Xác Nhận */}
      {confirmDialog?.isOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div
                  className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    confirmDialog.type === "danger"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-primary"
                  }`}
                >
                  {confirmDialog.type === "danger" ? (
                    <AlertCircle size={32} />
                  ) : (
                    <HelpCircle size={32} />
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {confirmDialog.title}
                </h3>
                <p className="text-slate-600 mb-6">{confirmDialog.message}</p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={async () => {
                      await confirmDialog.action();
                      setConfirmDialog(null);
                    }}
                    className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl transition-colors ${
                      confirmDialog.type === "danger"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-primary hover:bg-blue-700"
                    }`}
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {type === "STAFF"
              ? "Quản lý Giảng viên & Admin"
              : "Quản lý Sinh viên"}
          </h1>
          <p className="text-slate-500">
            {type === "STAFF"
              ? "Quản lý tài khoản nhân sự trong hệ thống"
              : "Quản lý tài khoản sinh viên theo khóa và ngành"}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} />
          Thêm {type === "STAFF" ? "nhân sự" : "sinh viên"}
        </button>
      </div>

      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">
                {isEditModalOpen
                  ? "Cập nhật người dùng"
                  : "Thêm người dùng mới"}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                  setEditingUserId(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Vai trò
                  </label>
                  <select
                    className="input-field disabled:bg-slate-100 disabled:text-slate-500"
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        role: e.target.value as UserRole,
                      })
                    }
                    disabled={isEditModalOpen || type === "STUDENT"}
                  >
                    {type === "STUDENT" ? (
                      <option value="STUDENT">Sinh viên</option>
                    ) : (
                      <>
                        <option value="TEACHER">Giảng viên</option>
                        <option value="ADMIN">Quản trị viên</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Họ và tên
                  </label>
                  <input
                    required
                    type="text"
                    className="input-field disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="Nhập họ tên"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    disabled={isEditModalOpen}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Tên đăng nhập
                  </label>
                  <input
                    required
                    type="text"
                    className="input-field disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="username"
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                    disabled={isEditModalOpen}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Mật khẩu {isEditModalOpen && "(Để trống nếu không đổi)"}
                  </label>
                  <input
                    required={!isEditModalOpen}
                    type="password"
                    className="input-field"
                    placeholder="******"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    className="input-field"
                    placeholder="email@example.com"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="0912345678"
                    value={newUser.phone || ""}
                    onChange={(e) =>
                      setNewUser({ ...newUser, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Nhập địa chỉ"
                    value={newUser.address || ""}
                    onChange={(e) =>
                      setNewUser({ ...newUser, address: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Ngày tham gia
                  </label>
                  <input
                    type="date"
                    className="input-field disabled:bg-slate-100 disabled:text-slate-500"
                    value={newUser.joinDate || ""}
                    onChange={(e) =>
                      setNewUser({ ...newUser, joinDate: e.target.value })
                    }
                    disabled={isEditModalOpen}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Trạng thái
                  </label>
                  <select
                    className="input-field"
                    value={newUser.status || "ACTIVE"}
                    onChange={(e) =>
                      setNewUser({ ...newUser, status: e.target.value as any })
                    }
                  >
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="RESERVED">Bảo lưu</option>
                    <option value="GRADUATED">Đã tốt nghiệp/Nghỉ việc</option>
                  </select>
                </div>
              </div>

              {newUser.role === "STUDENT" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Lớp sinh hoạt
                    </label>
                    <select
                      className="input-field"
                      value={newUser.classId || ""}
                      onChange={(e) => {
                        const classId = Number(e.target.value);
                        const selectedClass = classes.find(
                          (c) => c.id === classId,
                        );
                        setNewUser({
                          ...newUser,
                          classId,
                          majorId: selectedClass?.majorId || newUser.majorId,
                        });
                      }}
                    >
                      <option value="">Chọn lớp</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Ngành
                    </label>
                    <select
                      className="input-field"
                      value={newUser.majorId || ""}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          majorId: Number(e.target.value),
                        })
                      }
                    >
                      <option value="">Chọn ngành</option>
                      {majors.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {newUser.role === "TEACHER" && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Khoa
                    </label>
                    <select
                      className="input-field"
                      value={newUser.departmentId || ""}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          departmentId: Number(e.target.value),
                        })
                      }
                    >
                      <option value="">Chọn khoa</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingUserId(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Check size={18} />
                  )}
                  {isEditModalOpen ? "Cập nhật" : "Lưu người dùng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={18} className="text-slate-400" />
          {type === "STAFF" ? (
            <select
              className="input-field py-2 w-auto"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="TEACHER">Giảng viên</option>
            </select>
          ) : (
            <>
              <select
                className="input-field py-2 w-auto"
                value={cohortFilter}
                onChange={(e) => setCohortFilter(e.target.value)}
              >
                <option value="ALL">Tất cả khóa</option>
                {uniqueCohorts.map((cohort) => (
                  <option key={cohort} value={cohort}>
                    Khóa {cohort}
                  </option>
                ))}
              </select>
              <select
                className="input-field py-2 w-auto"
                value={majorFilter}
                onChange={(e) => setMajorFilter(e.target.value)}
              >
                <option value="ALL">Tất cả ngành</option>
                {majors.map((major) => (
                  <option key={major.id} value={major.id}>
                    {major.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Mã định danh
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400">
                            @{u.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : u.role === "TEACHER"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {u.username}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : u.status === "RESERVED"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {u.status === "ACTIVE"
                          ? "Đang hoạt động"
                          : u.status === "RESERVED"
                            ? "Bảo lưu"
                            : "Đã tốt nghiệp/Nghỉ"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: "Xác nhận xóa",
                              message:
                                "Bạn có chắc chắn muốn xóa người dùng này?",
                              type: "danger",
                              action: async () => {
                                await dispatch(deleteUser(Number(u.id)));
                                toast.success("Xóa người dùng thành công!");
                              },
                            });
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <X size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-400 font-medium">
              Không tìm thấy người dùng nào
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
