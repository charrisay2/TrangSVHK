import { useState, useEffect } from "react";
import {
Calendar as CalendarIcon,
Save,
Check,
X,
Clock,
AlertCircle,
QrCode,
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";

import { fetchCourses } from "../../redux/slices/courseSlice";
import { fetchUsers } from "../../redux/slices/userSlice";

import { toast } from "sonner";
import api from "../../services/api";

import { QRCodeSVG } from "qrcode.react";

interface AttendanceProps {
teacherId: string | number;
}




export default function Attendance({
teacherId,
}: AttendanceProps) {
const dispatch = useDispatch<AppDispatch>();

const { classes } = useSelector(
(state: RootState) => state.courses
);

const { users } = useSelector(
(state: RootState) => state.users
);

const [showQR, setShowQR] = useState(false);

const teacherClasses = classes.filter(
(c) => String(c.teacherId) === String(teacherId)
);

const [selectedClass, setSelectedClass] = useState<any>(
teacherClasses[0]?.id || ""
);

const [date, setDate] = useState(
new Date().toISOString().split("T")[0]
);

const [attendance, setAttendance] = useState<
Record<string, "Present" | "Absent" | "Late">

> ({});

const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
dispatch(fetchCourses());
dispatch(fetchUsers());
}, [dispatch]);

useEffect(() => {
if (!selectedClass && teacherClasses.length > 0) {
setSelectedClass(teacherClasses[0].id);
}
}, [teacherClasses, selectedClass]);

useEffect(() => {
const fetchAttendance = async () => {
if (!selectedClass || !date) return;


  setIsLoading(true);

  try {
    const response = await api.get(
      `/attendance/course/${selectedClass}?date=${date}`
    );

    const records = response.data;

    const newAttendance: Record<
      string,
      "Present" | "Absent" | "Late"
    > = {};

    records.forEach((r: any) => {
      newAttendance[String(r.studentId)] = r.status;
    });

    setAttendance(newAttendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
  } finally {
    setIsLoading(false);
  }
};

fetchAttendance();

// Polling khi mở QR
let interval: any;

if (showQR) {
  interval = setInterval(fetchAttendance, 5000);
}

return () => {
  if (interval) clearInterval(interval);
};


}, [selectedClass, date, showQR]);

const currentClass = teacherClasses.find(
(c) => String(c.id) === String(selectedClass)
);

// Xử lý students an toàn
let rawStudents: any = currentClass?.students || [];

if (typeof rawStudents === "string") {
try {
rawStudents = JSON.parse(rawStudents);
} catch {
rawStudents = [];
}
}

const studentIds = rawStudents.map((s: any) =>
String(s.id || s)
);

const classStudents = users.filter((u) =>
studentIds.includes(String(u.id))
);

// Kiểm tra ngày học hợp lệ
const getExpectedDays = (scheduleStr?: string) => {
if (!scheduleStr) return null;


const daysMap: Record<string, number> = {
  "Chủ Nhật": 0,
  "Thứ Hai": 1,
  "Thứ Ba": 2,
  "Thứ Tư": 3,
  "Thứ Năm": 4,
  "Thứ Sáu": 5,
  "Thứ Bảy": 6,
};

const expected: number[] = [];

for (const [dayName, dayIndex] of Object.entries(daysMap)) {
  if (scheduleStr.includes(dayName)) {
    expected.push(dayIndex);
  }
}

return expected.length > 0 ? expected : null;


};

const expectedDays = currentClass
? getExpectedDays(currentClass.schedule)
: null;

const selectedDateObj = new Date(date);

const selectedDayOfWeek = selectedDateObj.getDay();

const isDateValid = expectedDays
? expectedDays.includes(selectedDayOfWeek)
: true;
const today = new Date();
today.setHours(0, 0, 0, 0);

const selectedDateOnly = new Date(date);
selectedDateOnly.setHours(0, 0, 0, 0);

const isPastDate = selectedDateOnly < today;

const canEditAttendance =
  isDateValid && !isPastDate;
const handleStatusChange = (
studentId: string | number,
status: "Present" | "Absent" | "Late"
) => {
setAttendance((prev) => ({
...prev,
[String(studentId)]: status,
}));
};

// SAVE ATTENDANCE
const handleSave = async () => {
if (!selectedClass || !date || !isDateValid) return;


setIsLoading(true);

// mặc định tất cả sinh viên là Vắng
const finalAttendance: Record<
  string,
  "Present" | "Absent" | "Late"
> = {};

classStudents.forEach((student) => {
  finalAttendance[String(student.id)] =
    attendance[String(student.id)] || "Absent";
});

try {
  await api.post("/attendance", {
    courseId: selectedClass,
    date,
    records: finalAttendance,
  });

  // cập nhật UI
  setAttendance(finalAttendance);

  toast.success("Đã lưu điểm danh thành công!");
} catch (error) {
  toast.error("Lỗi khi lưu điểm danh");
} finally {
  setIsLoading(false);
}


};

const qrUrl =
typeof window !== "undefined"
? `${window.location.origin}/student/qr-attendance?courseId=${selectedClass}&date=${date}`
: "";

return ( <div className="space-y-6">
{/* QR MODAL */}
{showQR && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"> <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center relative">
<button
onClick={() => setShowQR(false)}
className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
> <X size={24} /> </button>


        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Quét mã điểm danh
        </h2>

        <p className="text-slate-500 mb-6 font-medium bg-slate-50 p-2 rounded-lg">
          {currentClass?.name} - {date}
        </p>

        <div className="flex justify-center mb-6 bg-white p-4 border-2 border-slate-100 rounded-xl">
          <QRCodeSVG
            value={qrUrl}
            size={240}
            className="mx-auto"
          />
        </div>

        <p className="text-sm text-slate-500 mb-4 items-center flex justify-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>

            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>

          Đang chờ sinh viên quét mã...
        </p>

        <button
          onClick={() => setShowQR(false)}
          className="btn-primary w-full py-3"
        >
          Đóng
        </button>
      </div>
    </div>
  )}

  {/* HEADER */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-slate-800">
        Điểm danh sinh viên
      </h1>

      <p className="text-slate-500">
        Ghi nhận chuyên cần cho buổi học hôm nay
      </p>
    </div>

    <div className="flex items-center gap-3">
      <button
        onClick={() => setShowQR(true)}
        disabled={!canEditAttendance}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all"
      >
        <QrCode size={18} />
        Mã QR Điểm Danh
      </button>

     <button
  onClick={handleSave}
  disabled={isLoading || !canEditAttendance}
  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
>
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <Save size={18} />
        )}

        Lưu điểm danh
      </button>
    </div>
  </div>
  {isPastDate && (
  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
    <AlertCircle size={14} />
    Buổi học đã qua, không thể chỉnh sửa hoặc điểm danh.
  </p>
)}

  {/* FILTER */}
  <div className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 uppercase ml-1">
        Chọn lớp học
      </label>

      <select
        className="input-field"
        value={selectedClass}
        onChange={(e) =>
          setSelectedClass(Number(e.target.value))
        }
      >
        {teacherClasses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.code})
          </option>
        ))}
      </select>
    </div>

    <div className="space-y-2">
      <label
        className={`text-xs font-bold uppercase ml-1 ${
          !isDateValid
            ? "text-red-500"
            : "text-slate-400"
        }`}
      >
        Ngày học
      </label>

      <div className="relative">
        <CalendarIcon
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${
            !isDateValid
              ? "text-red-400"
              : "text-slate-400"
          }`}
          size={18}
        />

        <input
          type="date"
          className={`input-field pl-10 ${
            !isDateValid
              ? "border-red-500 bg-red-50 text-red-700"
              : ""
          }`}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {!isDateValid && currentClass && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={14} />
          Ngày không hợp lệ với lịch học.
        </p>
      )}
    </div>
  </div>

  {/* TABLE */}
  <div
    className={`card overflow-hidden ${
      !isDateValid
        ? "opacity-50 pointer-events-none"
        : ""
    }`}
  >
    <table className="w-full text-left">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200">
          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Sinh viên
          </th>

          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
            Trạng thái
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100">
        {classStudents.length === 0 ? (
          <tr>
            <td
              colSpan={2}
              className="px-6 py-8 text-center text-slate-500"
            >
              Chưa có sinh viên nào đăng ký lớp học này.
            </td>
          </tr>
        ) : (
          classStudents.map((student) => {
            // MẶC ĐỊNH = ABSENT
            const status =
              attendance[String(student.id)] ||
              "Absent";

            return (
              <tr
                key={student.id}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatar}
                      alt=""
                      className="w-8 h-8 rounded-full border border-slate-200"
                    />

                    <div>
                      <p className="font-bold text-slate-800">
                        {student.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        {student.studentId ||
                          student.username}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() =>
                        handleStatusChange(
                          student.id,
                          "Present"
                        )
                      }
                      disabled={!canEditAttendance}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        status === "Present"
                          ? "bg-emerald-500 text-white shadow-md"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      <Check size={14} />
                      Có mặt
                    </button>

                    <button
                      onClick={() =>
                        handleStatusChange(
                          student.id,
                          "Absent"
                        )
                      }
                      disabled={!canEditAttendance}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        status === "Absent"
                          ? "bg-red-500 text-white shadow-md"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      <X size={14} />
                      Vắng
                    </button>

                    <button
                      onClick={() =>
                        handleStatusChange(
                          student.id,
                          "Late"
                        )
                      }
                      disabled={!canEditAttendance}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        status === "Late"
                          ? "bg-amber-500 text-white shadow-md"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      <Clock size={14} />
                      Muộn
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
</div>


);
}
