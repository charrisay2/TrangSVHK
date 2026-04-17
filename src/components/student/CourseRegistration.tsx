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

  // LẤY THÔNG TIN TỪ AUTH STATE ĐỂ TRÁNH LỖI UNDEFINED
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { users } = useSelector((state: RootState) => state.users);

  const studentClassId = authUser?.classId;
  const studentMajorId = authUser?.majorId;

  const [searchTerm, setSearchTerm] = useState("");
  const [conflictInfo, setConflictInfo] = useState<{
    newClass: Class;
    existingClass: Class;
  } | null>(null);
  const [selectedSubjectGroup, setSelectedSubjectGroup] =
    useState<SubjectGroup | null>(null);

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

  // FIX: SỬA LOGIC LỌC ĐỂ KHÔNG BỊ NHẢY HẾT VÀO HỌC VƯỢT
  const standardClasses = filteredAvailableClasses.filter((c) => {
    // nếu chưa có dữ liệu user → không hiển thị
    if (studentClassId == null || studentMajorId == null) return false;

    const sameMajor =
      c.majorId == null || Number(c.majorId) === Number(studentMajorId);

    const sameClass =
      c.classId == null || Number(c.classId) === Number(studentClassId);

    return sameMajor && sameClass;
  });

  const advancedClasses = filteredAvailableClasses.filter((c) => {
    if (studentClassId == null || studentMajorId == null) return false;

    const sameMajor =
      c.majorId == null || Number(c.majorId) === Number(studentMajorId);

    const differentClass =
      c.classId != null && Number(c.classId) !== Number(studentClassId);

    return sameMajor && differentClass;
  });

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
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
              <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-full shrink-0">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900">
                    Trùng lịch học!
                  </h3>
                  <p className="text-red-700 text-sm mt-1">
                    Không thể đăng ký học phần này.
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-xs font-bold text-slate-400">LỊCH MỚI</p>
                  <p className="font-bold">{conflictInfo.newClass.name}</p>
                  <p className="text-sm">{conflictInfo.newClass.schedule}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <p className="text-xs font-bold text-red-400">TRÙNG VỚI</p>
                  <p className="font-bold text-red-900">
                    {conflictInfo.existingClass.name}
                  </p>
                  <p className="text-sm text-red-700">
                    {conflictInfo.existingClass.schedule}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t flex justify-end">
                <button
                  onClick={() => setConflictInfo(null)}
                  className="btn-secondary"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal Xác nhận */}
      {confirmDialog?.isOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center">
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${confirmDialog.type === "danger" ? "bg-red-100 text-red-600" : "bg-blue-100 text-primary"}`}
              >
                <HelpCircle size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">{confirmDialog.title}</h3>
              <p className="text-slate-600 mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    await confirmDialog.action();
                    setConfirmDialog(null);
                  }}
                  className={`flex-1 px-4 py-2 text-white rounded-xl font-bold ${confirmDialog.type === "danger" ? "bg-red-600" : "bg-primary"}`}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal Chọn Lịch */}
      {selectedSubjectGroup &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-bold">
                    {selectedSubjectGroup.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Mã môn: {selectedSubjectGroup.code}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSubjectGroup(null)}
                  className="p-2 rounded-full bg-white shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                {selectedSubjectGroup.classes.map((c) => (
                  <div
                    key={c.id}
                    className="border rounded-xl p-4 hover:border-primary flex flex-col md:flex-row gap-4 justify-between items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">
                        <Calendar size={16} /> {c.schedule}
                      </div>
                      <div className="text-sm text-slate-500 flex gap-4">
                        <span className="flex items-center gap-1">
                          <UserIcon size={14} /> {getTeacherName(c.teacherId)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> {(c as any).room?.name || "N/A"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRegister(c)}
                      className="btn-primary px-6"
                    >
                      Chọn ca này
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Đăng ký học phần
          </h1>
          <p className="text-slate-500">Kế hoạch học tập cho ngành của bạn</p>
        </div>
        <div className="text-right text-xs text-slate-400">
          Lớp của bạn:{" "}
          <span className="font-bold text-slate-600">
            {studentClassId || "N/A"}
          </span>{" "}
          | Ngành:{" "}
          <span className="font-bold text-slate-600">
            {studentMajorId || "N/A"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-8">
          <div className="card p-4 relative">
            <Search
              className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm môn học..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <BookOpen size={20} className="text-primary" /> Môn học theo kế
              hoạch
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedStandard.map((group) => (
                <SubjectGroupCard
                  key={group.code}
                  group={group}
                  onViewClasses={setSelectedSubjectGroup}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h2 className="font-bold text-purple-800 flex items-center gap-2">
              <BookOpen size={20} /> Môn học đăng ký thêm / Học vượt
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedAdvanced.map((group) => (
                <SubjectGroupCard
                  key={group.code}
                  group={group}
                  onViewClasses={setSelectedSubjectGroup}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-600" /> Đã đăng ký
          </h2>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden divide-y">
            {registeredClasses.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-sm">
                Chưa có môn nào
              </p>
            ) : (
              registeredClasses.map((c) => (
                <div
                  key={c.id}
                  className="p-4 hover:bg-slate-50 relative group"
                >
                  <button
                    onClick={() => handleUnregister(c)}
                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                  <h4 className="font-bold text-sm">{c.name}</h4>
                  <div className="flex gap-2 my-1">
                    <span className="text-[10px] text-slate-400">{c.code}</span>
                    {studentMajorId != null &&
                      studentClassId != null &&
                      c.classId != null &&
                      Number(c.majorId) === Number(studentMajorId) &&
                      Number(c.classId) !== Number(studentClassId) && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-1 py-0.5 rounded">
                          Học vượt
                        </span>
                      )}
                  </div>
                  <div className="text-xs text-emerald-600 font-medium">
                    {c.schedule}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
