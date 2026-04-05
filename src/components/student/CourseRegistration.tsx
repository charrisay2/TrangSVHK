import { useState, FC, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  X,
  MapPin,
  User as UserIcon,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Class } from "../../types";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import {
  fetchCourses,
  registerCourse,
  unregisterCourse,
} from "../../redux/slices/courseSlice";
import { fetchUsers } from "../../redux/slices/userSlice";
import { toast } from "sonner";

interface CourseRegistrationProps {
  studentId: string | number;
}

interface ParsedSchedule {
  day: string;
  start: number;
  end: number;
}

interface SubjectGroup {
  code: string;
  name: string;
  isAdvanced: boolean;
  classes: Class[];
}

const SubjectGroupCard: FC<{
  group: SubjectGroup;
  onViewClasses: (g: SubjectGroup) => void;
}> = ({ group, onViewClasses }) => {
  return (
    <div
      className="card p-5 hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary group cursor-pointer"
      onClick={() => onViewClasses(group)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-slate-800 group-hover:text-primary transition-colors">
            {group.name}
          </h3>
          <div className="flex gap-2 mt-1">
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded inline-block">
              {group.code}
            </span>
            {group.isAdvanced && (
              <span className="text-xs font-bold bg-purple-100 text-purple-600 px-2 py-1 rounded inline-block">
                Học vượt
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewClasses(group);
          }}
          className="p-2 bg-blue-50 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
          title="Xem các lớp đang mở"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600 mt-4 bg-slate-50 p-2 rounded-lg">
        <Layers size={16} className="text-primary" />
        <span className="font-medium text-slate-700">
          Có <strong className="text-primary">{group.classes.length}</strong>{" "}
          lịch học đang mở
        </span>
      </div>
    </div>
  );
};

export default function CourseRegistration({
  studentId,
}: CourseRegistrationProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { classes, isLoading } = useSelector(
    (state: RootState) => state.courses,
  );
  const { users } = useSelector((state: RootState) => state.users);

  const [searchTerm, setSearchTerm] = useState("");
  const [conflictInfo, setConflictInfo] = useState<{
    newClass: Class;
    existingClass: Class;
  } | null>(null);
  const [selectedSubjectGroup, setSelectedSubjectGroup] =
    useState<SubjectGroup | null>(null);

  // ĐÃ THÊM: State quản lý hộp thoại Xác nhận thay cho window.confirm mặc định
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    type: "danger" | "info";
  } | null>(null);

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchUsers());
  }, [dispatch]);

  const currentUser = users.find((u) => String(u.id) === String(studentId));

  const registeredClasses = useMemo(() => {
    return classes.filter((c) =>
      c.students?.some((id) => String(id) === String(studentId)),
    );
  }, [classes, studentId]);

  const availableClasses = useMemo(() => {
    return classes.filter((c) => {
      const isAlreadyRegistered = c.students?.some(
        (id) => String(id) === String(studentId),
      );
      if (isAlreadyRegistered) return false;

      const isRegisteredOtherSchedule = registeredClasses.some(
        (rc) => rc.code === c.code,
      );
      if (isRegisteredOtherSchedule) return false;

      return true;
    });
  }, [classes, studentId, registeredClasses]);

  const parseSchedule = (scheduleStr: string): ParsedSchedule | null => {
    try {
      const match = scheduleStr.match(
        /^(.+?) \((\d{2}):(\d{2}) - (\d{2}):(\d{2})\)$/,
      );
      if (!match) return null;
      const [, day, startHour, startMin, endHour, endMin] = match;
      const start = parseInt(startHour) * 60 + parseInt(startMin);
      const end = parseInt(endHour) * 60 + parseInt(endMin);
      return { day, start, end };
    } catch (e) {
      return null;
    }
  };

  const checkConflict = (classA: Class, classB: Class): boolean => {
    const scheduleA = parseSchedule(classA.schedule);
    const scheduleB = parseSchedule(classB.schedule);
    if (!scheduleA || !scheduleB) return false;
    if (scheduleA.day !== scheduleB.day) return false;
    return scheduleA.start < scheduleB.end && scheduleB.start < scheduleA.end;
  };

  // ĐÃ FIX: Sử dụng custom Dialog thay cho window.confirm()
  const handleRegister = async (classToRegister: Class) => {
    const conflictingClass = registeredClasses.find((registered) =>
      checkConflict(registered, classToRegister),
    );

    if (conflictingClass) {
      setConflictInfo({
        newClass: classToRegister,
        existingClass: conflictingClass,
      });
      return;
    }

    // Mở hộp thoại xác nhận tuỳ chỉnh
    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận đăng ký",
      message: `Bạn có muốn đăng ký lịch học: ${classToRegister.schedule}?`,
      type: "info",
      action: async () => {
        const resultAction = await dispatch(registerCourse(classToRegister.id));
        if (registerCourse.fulfilled.match(resultAction)) {
          toast.success("Đăng ký học phần thành công!");
          setSelectedSubjectGroup(null);
        } else {
          toast.error("Đăng ký thất bại: " + resultAction.payload);
        }
      },
    });
  };

  const handleUnregister = async (classToUnregister: Class) => {
    // Mở hộp thoại xác nhận tuỳ chỉnh
    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận hủy môn",
      message: `Bạn có chắc chắn muốn hủy đăng ký môn "${classToUnregister.name}"?`,
      type: "danger",
      action: async () => {
        const resultAction = await dispatch(
          unregisterCourse(classToUnregister.id),
        );
        if (unregisterCourse.fulfilled.match(resultAction)) {
          toast.success("Hủy đăng ký thành công!");
        } else {
          toast.error("Hủy đăng ký thất bại: " + resultAction.payload);
        }
      },
    });
  };

  const getTeacherName = (teacherId: string | number) => {
    const teacher = users.find((u) => u.id === teacherId);
    return teacher?.name;
  };

  const groupClasses = (
    classList: Class[],
    checkAdvanced: (c: Class) => boolean,
  ): SubjectGroup[] => {
    const groups: Record<string, SubjectGroup> = {};
    classList.forEach((c) => {
      if (!groups[c.code]) {
        groups[c.code] = {
          code: c.code,
          name: c.name,
          isAdvanced: checkAdvanced(c),
          classes: [],
        };
      }
      groups[c.code].classes.push(c);
    });
    return Object.values(groups);
  };

  const filteredAvailableClasses = availableClasses.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const studentClassId = currentUser?.classId;
  const studentMajorId = currentUser?.majorId;

  const standardClasses = filteredAvailableClasses.filter(
    (c) =>
      Number(c.majorId) === Number(studentMajorId) &&
      (!c.classId || Number(c.classId) === Number(studentClassId)),
  );

  const advancedClasses = filteredAvailableClasses.filter(
    (c) =>
      Number(c.majorId) !== Number(studentMajorId) ||
      (c.classId && Number(c.classId) !== Number(studentClassId)),
  );

  const groupedStandard = groupClasses(standardClasses, () => false);
  const groupedAdvanced = groupClasses(advancedClasses, () => true);

  if (isLoading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modal Cảnh báo trùng lịch */}
      {conflictInfo &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-full shrink-0">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900">
                    Trùng lịch học!
                  </h3>
                  <p className="text-red-700 text-sm mt-1">
                    Không thể đăng ký học phần này do trùng thời gian với lịch
                    học hiện tại.
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Lịch muốn đăng ký
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800">
                      {conflictInfo.newClass.name}
                    </p>
                    <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                      <Calendar size={14} />
                      {conflictInfo.newClass.schedule}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-bold">
                    TRÙNG VỚI
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Môn đã đăng ký
                  </p>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <p className="font-bold text-red-900">
                      {conflictInfo.existingClass.name}
                    </p>
                    <p className="text-sm text-red-700 mt-1 flex items-center gap-2">
                      <Calendar size={14} />
                      {conflictInfo.existingClass.schedule}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setConflictInfo(null)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Đã hiểu, đóng lại
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ĐÃ THÊM: Modal Custom Xác Nhận Đăng ký/Hủy */}
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

      {/* Modal Chọn Lịch Học Chi Tiết */}
      {selectedSubjectGroup &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {selectedSubjectGroup.name}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    Mã môn: {selectedSubjectGroup.code}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSubjectGroup(null)}
                  className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <p className="text-sm font-bold text-slate-700 mb-2">
                  Vui lòng chọn một lịch học phù hợp:
                </p>
                {selectedSubjectGroup.classes.map((c) => (
                  <div
                    key={c.id}
                    className="border border-slate-200 rounded-xl p-4 hover:border-primary hover:shadow-md transition-all flex flex-col md:flex-row gap-4 justify-between md:items-center"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-emerald-600 font-bold bg-emerald-50 w-fit px-3 py-1.5 rounded-lg">
                        <Calendar size={18} />
                        {c.schedule}
                      </div>
                      <div className="flex items-center gap-6 text-sm text-slate-600 ml-1">
                        <div className="flex items-center gap-2">
                          <UserIcon size={16} className="text-slate-400" />
                          <span>
                            {getTeacherName(c.teacherId) || "Đang cập nhật"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-slate-400" />
                          <span>
                            {(c as any).room?.name || "Chưa xếp phòng"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRegister(c)}
                      className="btn-primary shrink-0 py-2 px-6 shadow-md shadow-primary/20"
                    >
                      Đăng ký ca này
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Đăng ký học phần</h1>
        <p className="text-slate-500">
          Đăng ký các môn học cho học kỳ tới và kiểm tra trùng lịch
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-8">
          <div className="card p-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm kiếm môn học theo tên hoặc mã..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <BookOpen size={20} className="text-primary" />
              Môn học theo kế hoạch ({groupedStandard.length})
            </h2>

            {groupedStandard.length === 0 ? (
              <div className="card p-8 text-center border-dashed">
                <p className="text-slate-400">
                  Không tìm thấy môn học nào phù hợp
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedStandard.map((group) => (
                  <SubjectGroupCard
                    key={group.code}
                    group={group}
                    onViewClasses={setSelectedSubjectGroup}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <div className="bg-purple-100 p-1 rounded-md">
                <BookOpen size={16} className="text-purple-600" />
              </div>
              <span className="text-purple-900">
                Môn học đăng ký thêm / Học vượt
              </span>
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold">
                {groupedAdvanced.length}
              </span>
            </h2>

            {groupedAdvanced.length === 0 ? (
              <div className="card p-8 text-center border-dashed bg-purple-50/50 border-purple-100">
                <p className="text-slate-400">
                  Không tìm thấy môn học vượt nào phù hợp
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedAdvanced.map((group) => (
                  <SubjectGroupCard
                    key={group.code}
                    group={group}
                    onViewClasses={setSelectedSubjectGroup}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-600" />
            Lớp đã đăng ký ({registeredClasses.length})
          </h2>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {registeredClasses.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-400 text-sm">
                  Bạn chưa đăng ký môn học nào
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {registeredClasses.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 hover:bg-slate-50 transition-colors relative group"
                  >
                    <button
                      onClick={() => handleUnregister(c)}
                      className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Hủy đăng ký"
                    >
                      <X size={16} />
                    </button>

                    <h4 className="font-bold text-slate-800 text-sm mb-1">
                      {c.name}
                    </h4>
                    <div className="flex gap-2 mb-2">
                      <span className="text-xs text-slate-500">{c.code}</span>
                      {(Number(c.majorId) !== Number(studentMajorId) ||
                        (c.classId &&
                          Number(c.classId) !== Number(studentClassId))) && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                          Học vượt
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit">
                      <Calendar size={12} />
                      <span className="font-medium">{c.schedule}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-start gap-2 text-xs text-slate-500">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p>
                  Hệ thống sẽ tự động kiểm tra trùng lịch khi bạn đăng ký môn
                  mới.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
