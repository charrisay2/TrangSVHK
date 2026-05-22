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

// --- Interfaces ---
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

// --- Sub-component: SubjectGroupCard (Kế thừa từ File A) ---
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
          className="p-2 bg-blue-50 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600 mt-4 bg-slate-50 p-2 rounded-lg">
        <Layers size={16} className="text-primary" />
        <span className="font-medium text-slate-700">
          Có <strong className="text-primary">{group.classes.length}</strong> ca học đang mở
        </span>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function CourseRegistration({ studentId }: CourseRegistrationProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { classes, isLoading } = useSelector((state: RootState) => state.courses);
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { users } = useSelector((state: RootState) => state.users);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubjectGroup, setSelectedSubjectGroup] = useState<SubjectGroup | null>(null);
  const [conflictInfo, setConflictInfo] = useState<{ newClass: Class; existingClass: Class } | null>(null);
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

  // 1. Logic Lấy danh sách đã đăng ký (File A)
  const registeredClasses = useMemo(() => {
    return classes.filter((c) =>
      c.students?.some((id) => String(id) === String(studentId))
    );
  }, [classes, studentId]);

  // 2. Logic Tính tổng tín chỉ (Bổ sung từ File B)
  const registeredCredits = useMemo(() => {
    return registeredClasses.reduce((total, c) => total + (c.credits || 3), 0);
  }, [registeredClasses]);

  // 3. Xử lý logic Schedule & Conflict (File A)
  const parseSchedule = (scheduleStr: string): ParsedSchedule | null => {
    try {
      const match = scheduleStr.match(/^(.+?) \((\d{2}):(\d{2}) - (\d{2}):(\d{2})\)$/);
      if (!match) return null;
      const [, day, startHour, startMin, endHour, endMin] = match;
      return {
        day,
        start: parseInt(startHour) * 60 + parseInt(startMin),
        end: parseInt(endHour) * 60 + parseInt(endMin),
      };
    } catch { return null; }
  };

  const checkConflict = (classA: Class, classB: Class): boolean => {
    const sA = parseSchedule(classA.schedule);
    const sB = parseSchedule(classB.schedule);
    if (!sA || !sB || sA.day !== sB.day) return false;
    return sA.start < sB.end && sB.start < sA.end;
  };

  // 4. Logic Lọc & Phân loại (Kết hợp Major của File A và Cohort của File B)
  const availableClasses = useMemo(() => {
    return classes.filter((c) => {
      const isRegistered = c.students?.some((id) => String(id) === String(studentId));
      const isOtherSchedule = registeredClasses.some((rc) => rc.code === c.code);
      return !isRegistered && !isOtherSchedule;
    });
  }, [classes, studentId, registeredClasses]);

  const filteredClasses = availableClasses.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const standardClasses = filteredClasses.filter(c => {
    const studentMajorId = authUser?.majorId;
    const studentCohort = authUser?.cohort || (authUser as any)?.studentClass?.cohort;
    // Khớp ngành VÀ khớp khóa (hoặc lớp)
    return Number(c.majorId) === Number(studentMajorId) && c.targetCohort === studentCohort;
  });

  const advancedClasses = filteredClasses.filter(c => {
    const studentCohort = authUser?.cohort || (authUser as any)?.studentClass?.cohort;
    // Khác khóa = Học vượt
    return c.targetCohort !== studentCohort;
  });

  // 5. Gom nhóm (Grouping Logic từ File A)
  const groupClasses = (list: Class[], isAdv: boolean): SubjectGroup[] => {
    const groups: Record<string, SubjectGroup> = {};
    list.forEach((c) => {
      if (!groups[c.code]) {
        groups[c.code] = { code: c.code, name: c.name, isAdvanced: isAdv, classes: [] };
      }
      groups[c.code].classes.push(c);
    });
    return Object.values(groups);
  };

  const handleRegister = async (classToRegister: Class) => {
    const conflict = registeredClasses.find(rc => checkConflict(rc, classToRegister));
    if (conflict) {
      setConflictInfo({ newClass: classToRegister, existingClass: conflict });
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận đăng ký",
      message: `Bạn muốn đăng ký môn ${classToRegister.name} (${classToRegister.schedule})?`,
      type: "info",
      action: async () => {
        const res = await dispatch(registerCourse(classToRegister.id));
        if (registerCourse.fulfilled.match(res)) {
          toast.success("Đăng ký thành công!");
          setSelectedSubjectGroup(null);
        } else toast.error("Lỗi: " + res.payload);
      }
    });
  };

  const handleUnregister = (c: Class) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hủy học phần",
      message: `Bạn có chắc chắn muốn hủy môn ${c.name}?`,
      type: "danger",
      action: async () => {
        const res = await dispatch(unregisterCourse(c.id));
        if (unregisterCourse.fulfilled.match(res)) toast.success("Đã hủy đăng ký!");
        else toast.error("Lỗi khi hủy!");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Tín chỉ (Bổ sung từ File B) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Đăng ký học phần</h1>
          <p className="text-slate-500">Kế hoạch học tập khóa {authUser?.cohort || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-xl shadow-sm border">
          <span className="text-sm font-medium text-slate-500">Tổng tín chỉ:</span>
          <span className={`text-lg font-bold ${registeredCredits >= 15 ? 'text-emerald-600' : 'text-amber-500'}`}>
            {registeredCredits} / 15+
          </span>
        </div>
      </div>

      {/* 2. Cảnh báo tín chỉ tối thiểu (Tính năng từ File B) */}
      {registeredCredits < 15 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl animate-in fade-in">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-500" />
            <p className="text-sm text-amber-800">
              Bạn cần đăng ký ít nhất <strong>15 tín chỉ</strong>. Hiện tại mới có {registeredCredits} tín.
            </p>
          </div>
        </div>
      )}

      {/* 3. Tìm kiếm & Danh sách môn học (Cấu trúc File A) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-8">
          <div className="card p-4 relative">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Tìm tên môn hoặc mã môn..." 
              className="input-field pl-10" 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          <section className="space-y-4">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <BookOpen size={20} className="text-primary" /> Môn học theo kế hoạch
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupClasses(standardClasses, false).map(g => (
                <SubjectGroupCard key={g.code} group={g} onViewClasses={setSelectedSubjectGroup} />
              ))}
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t">
            <h2 className="font-bold text-purple-800 flex items-center gap-2">
              <Plus size={20} /> Môn học đăng ký thêm / Học vượt
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupClasses(advancedClasses, true).map(g => (
                <SubjectGroupCard key={g.code} group={g} onViewClasses={setSelectedSubjectGroup} />
              ))}
            </div>
          </section>
        </div>

        {/* 4. Danh sách đã đăng ký (File B UI + File A Logic) */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-600" /> Đã chọn ({registeredClasses.length})
          </h2>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden divide-y">
            {registeredClasses.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-sm">Chưa đăng ký môn nào</p>
            ) : (
              registeredClasses.map((c) => (
                <div key={c.id} className="p-4 hover:bg-slate-50 relative group transition-colors">
                  <button 
                    onClick={() => handleUnregister(c)}
                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                  <h4 className="font-bold text-sm text-slate-800">{c.name}</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{c.code} • {c.credits || 3} tín chỉ</p>
                  <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <Calendar size={12}/> {c.schedule}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- Portals (Modals) --- */}
      {/* Modal Chọn Lịch (Từ File A - Cực kỳ quan trọng) */}
      {selectedSubjectGroup && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold">{selectedSubjectGroup.name}</h2>
                <p className="text-sm text-slate-500">Mã môn: {selectedSubjectGroup.code}</p>
              </div>
              <button onClick={() => setSelectedSubjectGroup(null)} className="p-2 hover:bg-slate-200 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              {selectedSubjectGroup.classes.map((c) => (
                <div key={c.id} className="border rounded-xl p-4 hover:border-primary flex flex-col md:flex-row gap-4 justify-between items-center transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded w-fit">
                      <Calendar size={16} /> {c.schedule}
                    </div>
                    <div className="text-sm text-slate-500 flex gap-4 mt-2">
                      <span className="flex items-center gap-1"><UserIcon size={14} /> {users.find(u => u.id === c.teacherId)?.name || 'GV'}</span>
                      <span className="flex items-center gap-1"><MapPin size={14} /> {(c as any).room?.name || "N/A"}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRegister(c)} className="btn-primary px-6 whitespace-nowrap">Đăng ký ca này</button>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Cảnh báo trùng lịch (File A + File B UI) */}
      {conflictInfo && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
              <AlertCircle className="text-red-600 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-bold text-red-900">Trùng lịch học!</h3>
                <p className="text-red-700 text-sm">Bạn không thể đăng ký vì bị trùng thời gian.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border">
                <p className="text-[10px] font-bold text-slate-400">MÔN MỚI</p>
                <p className="font-bold text-sm">{conflictInfo.newClass.name}</p>
                <p className="text-xs">{conflictInfo.newClass.schedule}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-[10px] font-bold text-red-400">TRÙNG VỚI MÔN ĐÃ ĐĂNG KÝ</p>
                <p className="font-bold text-sm text-red-900">{conflictInfo.existingClass.name}</p>
                <p className="text-xs text-red-700">{conflictInfo.existingClass.schedule}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 text-right">
              <button onClick={() => setConflictInfo(null)} className="btn-secondary">Đóng</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Xác nhận (Chung cho Đăng ký & Hủy) */}
      {confirmDialog?.isOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center animate-in zoom-in-95">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${confirmDialog.type === "danger" ? "bg-red-100 text-red-600" : "bg-blue-100 text-primary"}`}>
              <HelpCircle size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">{confirmDialog.title}</h3>
            <p className="text-slate-600 mb-6 text-sm">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog(null)} className="flex-1 px-4 py-2 bg-slate-100 rounded-xl font-bold">Hủy</button>
              <button 
                onClick={async () => { await confirmDialog.action(); setConfirmDialog(null); }}
                className={`flex-1 px-4 py-2 text-white rounded-xl font-bold ${confirmDialog.type === "danger" ? "bg-red-600" : "bg-primary"}`}
              >Xác nhận</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}