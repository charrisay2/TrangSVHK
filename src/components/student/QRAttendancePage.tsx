import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import api from "../../services/api";
import { CheckCircle, XCircle, MapPin, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  courseId: number;
  date: string;
}

// Calculate distance in meters using Haversine formula
function getDistanceFromLatLonInM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371000; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in m
}

export default function QRAttendancePage({ courseId, date }: Props) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "warning"
  >("loading");
  const [message, setMessage] = useState(
    "Đang lấy vị trí của bạn để điểm danh...",
  );
  const [attendanceId, setAttendanceId] = useState<number | null>(null);

  const classLocation = useRef<{ lat: number; lng: number } | null>(null);
  const watchId = useRef<number | null>(null);
  const violationTimer = useRef<any>(null);

  useEffect(() => {
    const markAttendanceAndTrack = async (lat: number, lng: number) => {
      try {
        setMessage("Đang xử lý điểm danh...");
        const response = await api.post("/attendance/qr-scan", {
          courseId,
          date,
          latitude: lat,
          longitude: lng,
        });

        setStatus("success");
        setMessage(response.data.message || "Điểm danh thành công!");
        setAttendanceId(response.data.attendanceId);
        classLocation.current = { lat, lng };

        // Start tracking
        startTracking(response.data.attendanceId);
      } catch (error: any) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Lỗi khi điểm danh. Vui lòng thử lại sau.",
        );
      }
    };

    const startTracking = (id: number) => {
      if (!("geolocation" in navigator)) return;

      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          if (!classLocation.current) return;

          const currentLat = position.coords.latitude;
          const currentLng = position.coords.longitude;
          const distance = getDistanceFromLatLonInM(
            classLocation.current.lat,
            classLocation.current.lng,
            currentLat,
            currentLng,
          );

          if (distance > 50) {
            handleViolationWarning(id);
          } else {
            handleReturnSafeZone();
          }
        },
        (error) => {
          console.error("Lỗi khi theo dõi vị trí:", error);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
      );
    };

    const handleViolationWarning = (id: number) => {
      if (status !== "warning") {
        setStatus("warning");
        setMessage(
          "Bạn đang rời khỏi khu vực lớp học. Vui lòng quay lại để tiếp tục tham gia buổi học.",
        );
        if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);

        // Timer for reporting violation if not returned after 30 seconds
        if (!violationTimer.current) {
          violationTimer.current = setTimeout(() => {
            reportViolation(id);
          }, 30000);
        }
      }
    };

    const handleReturnSafeZone = () => {
      if (status === "warning") {
        setStatus("success");
        setMessage(
          "Điểm danh thành công! Hệ thống đang tiếp tục theo dõi vị trí.",
        );
        if (violationTimer.current) {
          clearTimeout(violationTimer.current);
          violationTimer.current = null;
        }
      }
    };

    const reportViolation = async (id: number) => {
      try {
        await api.post("/attendance/location-violation", { attendanceId: id });
        setStatus("error");
        setMessage(
          "Bạn đã rời khỏi lớp học quá lâu. Hệ thống ghi nhận bạn vắng mặt sau điểm danh.",
        );
        if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      } catch (error) {
        console.error("Lỗi gửi báo cáo vi phạm", error);
      }
    };

    if (user?.role === "STUDENT") {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            markAttendanceAndTrack(
              position.coords.latitude,
              position.coords.longitude,
            );
          },
          (error) => {
            console.error(error);
            setStatus("error");
            setMessage(
              "Không thể lấy vị trí. Vui lòng cấp quyền truy cập vị trí để điểm danh.",
            );
          },
          { enableHighAccuracy: true },
        );
      } else {
        setStatus("error");
        setMessage("Trình duyệt của bạn không hỗ trợ định vị.");
      }
    } else {
      setStatus("error");
      setMessage("URL không hợp lệ hoặc bạn không phải sinh viên.");
    }

    return () => {
      if (watchId.current !== null)
        navigator.geolocation.clearWatch(watchId.current);
      if (violationTimer.current) clearTimeout(violationTimer.current);
    };
  }, [courseId, date, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className={`bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-6 border-t-4 ${
            status === "success"
              ? "border-emerald-500"
              : status === "warning"
                ? "border-amber-500"
                : status === "error"
                  ? "border-rose-500"
                  : "border-indigo-500"
          }`}
        >
          {status === "loading" && (
            <>
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <MapPin className="absolute inset-0 m-auto text-indigo-600 w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                Đang xử lý...
              </h2>
              <p className="text-slate-500">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto" />
              <h2 className="text-2xl font-bold text-slate-800">Thành công!</h2>
              <p className="text-slate-600 font-medium">{message}</p>
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-medium flex items-start gap-2 text-left">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                Vui lòng không đóng trang này và giữ thiết bị trong hội trường
                để hệ thống theo dõi vị trí lớp học.
              </div>
              <button
                onClick={() => (window.location.href = "/")}
                className="btn-primary w-full mt-4"
              >
                Về trang chủ
              </button>
            </>
          )}

          {status === "warning" && (
            <>
              <AlertTriangle className="w-20 h-20 text-amber-500 mx-auto animate-bounce" />
              <h2 className="text-2xl font-bold text-amber-600">CẢNH BÁO</h2>
              <p className="text-slate-800 font-bold">{message}</p>
              <p className="text-sm text-slate-500">
                Hệ thống sẽ ghi nhận bạn rời khỏi lớp nếu bạn không quay lại
                trong 30 giây.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-20 h-20 text-rose-500 mx-auto" />
              <h2 className="text-2xl font-bold text-slate-800">Thất bại</h2>
              <p className="text-rose-600 font-medium">{message}</p>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl mt-4 w-full"
              >
                Về trang chủ
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
