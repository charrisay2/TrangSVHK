import { useState, useMemo, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format } from "date-fns";
import { parse } from "date-fns";
import { startOfWeek } from "date-fns";
import { getDay } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User as UserIcon,
} from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { fetchCourses } from "../redux/slices/courseSlice";
import { fetchUsers } from "../redux/slices/userSlice";
import { Class } from "../types";

const locales = {
  vi: vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Helper to generate dates for multiple weeks based on mock string like "Thứ Hai (07:30 - 09:30)"
const getEventsForCurrentWeek = (classes: Class[], users: any[]) => {
  const events: any[] = [];
  // Lấy mốc thời gian là tuần hiện tại để bắt đầu rải lịch
  const semesterStartDate = new Date();

  const dayMap: { [key: string]: number } = {
    "Thứ Hai": 1,
    "Thứ Ba": 2,
    "Thứ Tư": 3,
    "Thứ Năm": 4,
    "Thứ Sáu": 5,
    "Thứ Bảy": 6,
    "Chủ Nhật": 0,
  };

  classes.forEach((cls) => {
    const teacher = users.find((u) => u.id === cls.teacherId);

    // Parse schedule string
    const match = cls.schedule.match(
      /(Thứ [^\(]+)\s*\(([\d:]+)\s*-\s*([\d:]+)\)/,
    );
    if (match) {
      const dayStr = match[1].trim();
      const startTimeStr = match[2].trim();
      const endTimeStr = match[3].trim();

      const targetDay = dayMap[dayStr];
      if (targetDay !== undefined) {
        // Lấy số tuần từ database, nếu không có thì mặc định là 10 tuần
        const numberOfWeeks = cls.weeks || 10;

        const [startHour, startMin] = startTimeStr.split(":").map(Number);
        const [endHour, endMin] = endTimeStr.split(":").map(Number);

        // Lặp qua số tuần để tạo event cho từng tuần
        for (let i = 0; i < numberOfWeeks; i++) {
          // Tính toán ngày cho tuần đầu tiên
          const currentDayOfWeek = semesterStartDate.getDay();
          const diff = targetDay - currentDayOfWeek;

          // Tính ngày cho event của tuần thứ i (cộng thêm i * 7 ngày)
          const eventDate = new Date(semesterStartDate);
          eventDate.setDate(semesterStartDate.getDate() + diff + i * 7);

          const start = new Date(eventDate);
          start.setHours(startHour, startMin, 0);

          const end = new Date(eventDate);
          end.setHours(endHour, endMin, 0);

          const statuses = ["UPCOMING", "COMPLETED", "CANCELLED"];
          const status = statuses[Math.floor(Math.random() * statuses.length)];

          events.push({
            // Tạo ID duy nhất cho mỗi event bằng cách nối thêm index tuần
            id: `${cls.id}_week_${i}`,
            title: cls.name,
            start,
            end,
            room: cls.room,
            teacher: teacher?.name || "Unknown",
            status,
            code: cls.code,
          });
        }
      }
    }
  });

  return events;
};

export default function Schedule() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { classes } = useSelector((state: RootState) => state.courses);
  const { users } = useSelector((state: RootState) => state.users);

  const [view, setView] = useState<any>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchUsers());
  }, [dispatch]);

  const studentClasses = useMemo(() => {
    if (!user) return [];
    return classes.filter((c) =>
      c.students?.some((id) => String(id) === String(user.id)),
    );
  }, [classes, user]);

  const events = useMemo(
    () => getEventsForCurrentWeek(studentClasses, users),
    [studentClasses, users],
  );

  const eventStyleGetter = (event: any) => {
    return {
      style: {
        backgroundColor: "#3b82f6", // primary blue
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  const CustomEvent = ({ event }: any) => {
    return (
      <div
        data-tooltip-id="calendar-tooltip"
        data-tooltip-html={`
          <div class="p-2">
            <h4 class="font-bold text-sm mb-2">${event.title} (${event.code})</h4>
            <div class="flex items-center gap-2 text-xs mb-1"><span class="font-semibold">Giảng viên:</span> ${event.teacher}</div>
            <div class="flex items-center gap-2 text-xs mb-1"><span class="font-semibold">Phòng:</span> ${event.room?.name || "Chưa xếp phòng"}</div>
            <div class="flex items-center gap-2 text-xs"><span class="font-semibold">Thời gian:</span> ${format(event.start, "HH:mm")} - ${format(event.end, "HH:mm")}</div>
          </div>
        `}
        className="h-full w-full p-1 text-xs font-medium truncate"
      >
        <div className="font-bold">{event.title}</div>
        <div className="text-[10px] opacity-90">
          {event.room?.name || "Chưa xếp phòng"}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Thời khóa biểu</h1>
          <p className="text-slate-500">Lịch học chi tiết trong tuần của bạn</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="btn-primary flex items-center gap-2">
            <CalendarIcon size={18} />
            Học kỳ 1 - 2024
          </button>
        </div>
      </div>

      <div className="card p-6 h-[700px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          components={{
            event: CustomEvent,
          }}
          messages={{
            next: "Tiếp",
            previous: "Trước",
            today: "Hôm nay",
            month: "Tháng",
            week: "Tuần",
            day: "Ngày",
            agenda: "Lịch trình",
          }}
          culture="vi"
        />
      </div>

      <Tooltip
        id="calendar-tooltip"
        place="top"
        className="z-50 !bg-slate-800 !text-white !rounded-xl !shadow-xl !p-0"
      />
    </div>
  );
}
