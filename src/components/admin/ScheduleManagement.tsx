import { useState, FormEvent, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Edit2,
  Clock,
  MapPin,
  User as UserIcon,
  X,
  Check,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../redux/slices/courseSlice";
import { fetchUsers } from "../../redux/slices/userSlice";
import { Class, Room, Major, StudentClass, Semester } from "../../types";
import { toast } from "sonner";
import api from "../../services/api";

export default function ScheduleManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const { classes, isLoading } = useSelector(
    (state: RootState) => state.courses,
  );
  const { users } = useSelector((state: RootState) => state.users);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<number | string | null>(
    null,
  );

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isStudentClassModalOpen, setIsStudentClassModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editingStudentClassId, setEditingStudentClassId] = useState<
    number | null
  >(null);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomFloor, setNewRoomFloor] = useState("1");
  const [newRoomCapacity, setNewRoomCapacity] = useState(40);
  const [newRoomBuilding, setNewRoomBuilding] = useState("A1");
  const [newRoomStatus, setNewRoomStatus] = useState<"ACTIVE" | "CLOSED">(
    "ACTIVE",
  );
  const [newStudentClassCohort, setNewStudentClassCohort] = useState("K20");
  const [newStudentClassMajorId, setNewStudentClassMajorId] = useState<
    number | ""
  >("");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [studentClasses, setStudentClasses] = useState<StudentClass[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchUsers());
    fetchData();
  }, [dispatch]);

  const fetchData = async () => {
    try {
      const [roomRes, majorRes, classRes, semesterRes, subjectRes] =
        await Promise.all([
          api.get("/rooms"),
          api.get("/majors"),
          api.get("/classes"),
          api.get("/semesters"),
          api.get("/subjects"),
        ]);
      setRooms(roomRes.data);
      setMajors(majorRes.data);
      setStudentClasses(classRes.data);
      setSemesters(semesterRes.data);
      setSubjects(subjectRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);

  const [newClass, setNewClass] = useState<Partial<Class>>({
    name: "",
    code: "",
    teacherId: undefined,
    roomId: undefined,
    schedule: "",
    majorId: undefined,
    classId: undefined,
    semesterId: undefined,
    credits: 3,
    totalPeriods: 45,
    weeks: 10,
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "">("");

  useEffect(() => {
    if (selectedSubjectId) {
      const subject = subjects.find((s) => s.id === Number(selectedSubjectId));
      if (subject) {
        setNewClass((prev) => ({
          ...prev,
          name: subject.name,
          code: subject.code,
          credits: subject.credits,
          totalPeriods: subject.totalPeriods,
          weeks: subject.weeks,
        }));
      }
    }
  }, [selectedSubjectId, subjects]);

  const [selectedDay, setSelectedDay] = useState("Thứ Hai");
  const [selectedSlot, setSelectedSlot] = useState("07:00 - 10:30");

  const fetchAvailableResources = async () => {
    try {
      const scheduleString = `${selectedDay} (${selectedSlot})`;
      const res = await api.get("/courses/available-resources", {
        params: {
          schedule: scheduleString,
          semesterId: newClass.semesterId,
          excludeCourseId: editingClassId || undefined,
          majorId: newClass.majorId || undefined,
        },
      });
      setAvailableRooms(res.data.rooms);
      setAvailableTeachers(res.data.teachers);
    } catch (error) {
      console.error("Error fetching available resources:", error);
    }
  };

  useEffect(() => {
    if (newClass.semesterId && selectedDay && selectedSlot) {
      fetchAvailableResources();
    }
  }, [
    newClass.semesterId,
    selectedDay,
    selectedSlot,
    newClass.majorId,
    isEditModalOpen,
    isAddModalOpen,
  ]);

  const timeSlots = ["07:00 - 10:30", "12:00 - 15:30", "16:25 - 20:00"];

  const daysOfWeek = [
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
    "Chủ Nhật",
  ];

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddRoom = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const roomName = `${newRoomBuilding}.${newRoomFloor}${newRoomNumber}`;
      if (editingRoomId) {
        await api.put(`/rooms/${editingRoomId}`, {
          name: roomName,
          capacity: newRoomCapacity,
          building: newRoomBuilding,
          status: newRoomStatus,
        });
        setEditingRoomId(null);
      } else {
        await api.post("/rooms", {
          name: roomName,
          capacity: newRoomCapacity,
          building: newRoomBuilding,
          status: newRoomStatus,
        });
      }
      setNewRoomNumber("");
      setNewRoomFloor("1");
      setNewRoomCapacity(40);
      setNewRoomBuilding("A1");
      setNewRoomStatus("ACTIVE");
      fetchData();
    } catch (error) {
      toast.error("Lỗi khi lưu phòng học");
    }
  };

  const handleAddStudentClass = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudentClassId) {
        await api.put(`/classes/${editingStudentClassId}`, {
          cohort: newStudentClassCohort,
          majorId: newStudentClassMajorId,
        });
        setEditingStudentClassId(null);
      } else {
        await api.post("/classes", {
          cohort: newStudentClassCohort,
          majorId: newStudentClassMajorId,
        });
      }
      setNewStudentClassCohort("K20");
      setNewStudentClassMajorId("");
      fetchData();
    } catch (error) {
      toast.error("Lỗi khi lưu lớp sinh viên");
    }
  };

  const handleAddClass = async (e: FormEvent) => {
    e.preventDefault();
    const scheduleString = `${selectedDay} (${selectedSlot})`;

    if (isEditModalOpen && editingClassId) {
      const resultAction = await dispatch(
        updateCourse({
          id: editingClassId,
          data: { ...newClass, schedule: scheduleString },
        }),
      );
      if (updateCourse.fulfilled.match(resultAction)) {
        setIsEditModalOpen(false);
        setEditingClassId(null);
        setSelectedSubjectId("");
        setNewClass({
          name: "",
          code: "",
          teacherId: undefined,
          roomId: undefined,
          schedule: "",
          majorId: undefined,
          classId: undefined,
          semesterId: undefined,
          credits: 3,
          totalPeriods: 45,
          weeks: 10,
        });
        toast.success("Cập nhật lịch học thành công!");
      } else {
        toast.error("Cập nhật lịch học thất bại: " + resultAction.payload);
      }
    } else {
      const finalTeacherId = newClass.teacherId
        ? Number(newClass.teacherId)
        : availableTeachers[0]?.id
          ? Number(availableTeachers[0].id)
          : undefined;

      if (!finalTeacherId) {
        toast.error(
          "Vui lòng chọn giảng viên. Nếu danh sách trống, hãy thử chọn khung giờ hoặc học kỳ khác.",
        );
        return;
      }

      const classToAdd: Partial<Class> = {
        name: newClass.name || "",
        code: newClass.code || "",
        teacherId: finalTeacherId,
        roomId: newClass.roomId ? Number(newClass.roomId) : undefined,
        schedule: scheduleString,
        majorId: newClass.majorId ? Number(newClass.majorId) : undefined,
        classId: newClass.classId ? Number(newClass.classId) : undefined,
        semesterId: newClass.semesterId
          ? Number(newClass.semesterId)
          : undefined,
        credits: newClass.credits ? Number(newClass.credits) : 3,
        totalPeriods: newClass.totalPeriods
          ? Number(newClass.totalPeriods)
          : 45,
        weeks: newClass.weeks ? Number(newClass.weeks) : 10,
      };

      const resultAction = await dispatch(createCourse(classToAdd));
      if (createCourse.fulfilled.match(resultAction)) {
        setIsAddModalOpen(false);
        setSelectedSubjectId("");
        setNewClass({
          name: "",
          code: "",
          teacherId: undefined,
          roomId: undefined,
          schedule: "",
          majorId: undefined,
          classId: undefined,
          semesterId: undefined,
          credits: 3,
          totalPeriods: 45,
          weeks: 10,
        });
        toast.success("Thêm lịch học thành công!");
      } else {
        toast.error("Thêm lịch học thất bại: " + resultAction.payload);
      }
    }
  };

  const openEditModal = (c: Class) => {
    setNewClass(c);
    setEditingClassId(c.id);

    const match = c.schedule.match(/(Thứ [^\(]+)\s*\(([\d:]+\s*-\s*[\d:]+)\)/);
    if (match) {
      setSelectedDay(match[1].trim());
      setSelectedSlot(match[2].trim());
    }

    const subject = subjects.find(
      (s) => s.code === c.code && s.majorId === c.majorId,
    );
    if (subject) {
      setSelectedSubjectId(subject.id);
    } else {
      setSelectedSubjectId("");
    }

    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Quản lý lịch học
          </h1>
          <p className="text-slate-500">
            Thiết lập và điều chỉnh thời khóa biểu cho các lớp học
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsRoomModalOpen(true)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <MapPin size={18} />
            Phòng học
          </button>
          <button
            onClick={() => setIsStudentClassModalOpen(true)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <UserIcon size={18} />
            Lớp sinh viên
          </button>
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setSelectedSubjectId("");
              setNewClass({
                name: "",
                code: "",
                teacherId: undefined,
                roomId: undefined,
                schedule: "",
                majorId: undefined,
                classId: undefined,
                semesterId: undefined,
                credits: 3,
                totalPeriods: 45,
                weeks: 10,
              });
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Thêm lịch học mới
          </button>
        </div>
      </div>

      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {isEditModalOpen ? "Cập nhật lịch học" : "Thêm lịch học mới"}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                  setEditingClassId(null);
                  setSelectedSubjectId("");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddClass} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Học kỳ (Thời gian thực tế)
                </label>
                <select
                  className="input-field"
                  value={newClass.semesterId || ""}
                  onChange={(e) =>
                    setNewClass({
                      ...newClass,
                      semesterId: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  required
                >
                  <option value="">Chọn học kỳ</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Ngành học
                  </label>
                  <select
                    className="input-field"
                    value={newClass.majorId || ""}
                    onChange={(e) => {
                      setNewClass({
                        ...newClass,
                        majorId: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      });
                      setSelectedSubjectId("");
                    }}
                    required
                  >
                    <option value="">Chọn ngành học</option>
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Môn học (Từ CT Khung)
                  </label>
                  <select
                    className="input-field"
                    value={selectedSubjectId}
                    onChange={(e) =>
                      setSelectedSubjectId(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    required
                    disabled={!newClass.majorId}
                  >
                    <option value="">Chọn môn học</option>
                    {subjects
                      .filter((s) => s.majorId === newClass.majorId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} - {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Tên môn học
                  </label>
                  <input
                    type="text"
                    className="input-field bg-slate-50"
                    value={newClass.name}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Mã môn
                  </label>
                  <input
                    type="text"
                    className="input-field bg-slate-50"
                    value={newClass.code}
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Số tín chỉ
                  </label>
                  <input
                    type="number"
                    className="input-field bg-slate-50"
                    value={newClass.credits}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Tổng số tiết
                  </label>
                  <input
                    type="number"
                    className="input-field bg-slate-50"
                    value={newClass.totalPeriods || 45}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Số tuần
                  </label>
                  <input
                    type="number"
                    className="input-field bg-slate-50"
                    value={newClass.weeks || 10}
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Ngày học
                  </label>
                  <select
                    required
                    className="input-field"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                  >
                    {daysOfWeek.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Khung giờ
                  </label>
                  <select
                    required
                    className="input-field"
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Phòng học (Trống)
                  </label>
                  <select
                    className="input-field"
                    value={newClass.roomId || ""}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        roomId: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    required
                    disabled={!newClass.semesterId}
                  >
                    <option value="">Chọn phòng học</option>
                    {availableRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.building})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Lớp học mục tiêu
                  </label>
                  <select
                    className="input-field"
                    value={newClass.classId || ""}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        classId: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  >
                    <option value="">Chọn lớp học</option>
                    {studentClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Giảng viên phụ trách (Rảnh)
                </label>
                <select
                  required
                  className="input-field"
                  value={newClass.teacherId || ""}
                  onChange={(e) =>
                    setNewClass({
                      ...newClass,
                      teacherId: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  disabled={!newClass.semesterId}
                >
                  <option value="">-- Chọn giảng viên --</option>
                  {availableTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingClassId(null);
                    setSelectedSubjectId("");
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
                  {isEditModalOpen ? "Cập nhật" : "Lưu lịch học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên môn hoặc mã lớp..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-1 lg:col-span-2 py-12 text-center text-slate-500">
            <div className="flex justify-center items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Đang tải dữ liệu...
            </div>
          </div>
        ) : (
          filteredClasses.map((c) => {
            const teacher = users.find((u) => u.id === c.teacherId);
            return (
              <div
                key={c.id}
                className="card p-6 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
                      <CalendarIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-primary transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        {c.code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock size={16} className="text-primary" />
                      <span>{c.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={16} className="text-primary" />
                      <span>{(c as any).room?.name || "Chưa xếp phòng"}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <UserIcon size={16} className="text-primary" />
                      <span>GV: {teacher?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CalendarIcon size={16} className="text-primary" />
                      <span>{c.students?.length || 0} Sinh viên</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!isLoading && filteredClasses.length === 0 && (
        <div className="py-12 text-center card bg-slate-50 border-dashed">
          <p className="text-slate-400 font-medium">
            Không tìm thấy lịch học nào
          </p>
        </div>
      )}

      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingRoomId ? "Cập nhật phòng học" : "Quản lý phòng học"}
              </h2>
              <button
                onClick={() => {
                  setIsRoomModalOpen(false);
                  setEditingRoomId(null);
                  setNewRoomNumber("");
                  setNewRoomFloor("1");
                  setNewRoomCapacity(40);
                  setNewRoomBuilding("A1");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <form onSubmit={handleAddRoom} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Tòa nhà
                    </label>
                    <select
                      className="input-field"
                      value={newRoomBuilding}
                      onChange={(e) => setNewRoomBuilding(e.target.value)}
                      required
                    >
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="A3">A3</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Tầng
                    </label>
                    <select
                      className="input-field"
                      value={newRoomFloor}
                      onChange={(e) => setNewRoomFloor(e.target.value)}
                      required
                    >
                      <option value="1">Tầng 1</option>
                      <option value="2">Tầng 2</option>
                      <option value="3">Tầng 3</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Số phòng
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={newRoomNumber}
                      onChange={(e) => setNewRoomNumber(e.target.value)}
                      placeholder="VD: 01"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Sức chứa
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Trạng thái
                  </label>
                  <select
                    className="input-field"
                    value={newRoomStatus}
                    onChange={(e) =>
                      setNewRoomStatus(e.target.value as "ACTIVE" | "CLOSED")
                    }
                    required
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="CLOSED">Không hoạt động</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary flex-1">
                    {editingRoomId ? "Cập nhật phòng học" : "Thêm phòng học"}
                  </button>
                  {editingRoomId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRoomId(null);
                        setNewRoomNumber("");
                        setNewRoomFloor("1");
                        setNewRoomCapacity(40);
                        setNewRoomBuilding("A1");
                        setNewRoomStatus("ACTIVE");
                      }}
                      className="btn-secondary"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {room.name}
                      </p>
                      {/* FIX: Đã thêm ép kiểu (room as any).status ở đây */}
                      <p className="text-xs text-slate-500">
                        Tòa {room.building} - Sức chứa: {room.capacity} -{" "}
                        {(room as any).status === "ACTIVE"
                          ? "Hoạt động"
                          : "Không hoạt động"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingRoomId(room.id);
                        setNewRoomBuilding(room.building || "A1");
                        // FIX: Đã thêm ép kiểu (room as any).status ở đây
                        setNewRoomStatus((room as any).status || "ACTIVE");

                        const parts = room.name.split(".");
                        if (parts.length === 2 && parts[1].length >= 2) {
                          setNewRoomFloor(parts[1][0]);
                          setNewRoomNumber(parts[1].substring(1));
                        } else {
                          setNewRoomFloor("1");
                          setNewRoomNumber(room.name);
                        }
                        setNewRoomCapacity(room.capacity);
                      }}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                      title="Sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isStudentClassModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingStudentClassId
                  ? "Cập nhật lớp sinh viên"
                  : "Quản lý lớp sinh viên"}
              </h2>
              <button
                onClick={() => {
                  setIsStudentClassModalOpen(false);
                  setEditingStudentClassId(null);
                  setNewStudentClassCohort("K20");
                  setNewStudentClassMajorId("");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <form onSubmit={handleAddStudentClass} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Khóa
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={newStudentClassCohort}
                      onChange={(e) => setNewStudentClassCohort(e.target.value)}
                      placeholder="VD: K20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Ngành học
                    </label>
                    <select
                      className="input-field"
                      value={newStudentClassMajorId}
                      onChange={(e) =>
                        setNewStudentClassMajorId(Number(e.target.value))
                      }
                      required
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
                {newStudentClassMajorId && (
                  <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                    Mã lớp dự kiến:{" "}
                    <strong>
                      {newStudentClassCohort}
                      {
                        majors.find((m) => m.id === newStudentClassMajorId)
                          ?.code
                      }
                      ...
                    </strong>
                  </div>
                )}
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary flex-1">
                    {editingStudentClassId
                      ? "Cập nhật lớp sinh viên"
                      : "Thêm lớp sinh viên"}
                  </button>
                  {editingStudentClassId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStudentClassId(null);
                        setNewStudentClassCohort("K20");
                        setNewStudentClassMajorId("");
                      }}
                      className="btn-secondary"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {studentClasses.map((sc) => (
                  <div
                    key={sc.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{sc.name}</p>
                      <p className="text-xs text-slate-500">
                        {sc.code} -{" "}
                        {majors.find((m) => m.id === sc.majorId)?.name}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingStudentClassId(sc.id);
                        setNewStudentClassCohort(sc.cohort);
                        setNewStudentClassMajorId(sc.majorId);
                      }}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                      title="Sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
