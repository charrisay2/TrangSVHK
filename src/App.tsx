/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, RootState, AppDispatch } from "./redux/store";
import { fetchCurrentUser } from "./redux/slices/authSlice";
import { Toaster } from "sonner";
import Login from "./components/Login";
import MainLayout from "./layouts/MainLayout";
import Home from "./components/Home";
import UserManagement from "./components/admin/UserManagement";
import ScheduleManagement from "./components/admin/ScheduleManagement";
import NotificationManagement from "./components/admin/NotificationManagement";
import MyClasses from "./components/teacher/MyClasses";
import Attendance from "./components/teacher/Attendance";
import GradeEntry from "./components/teacher/GradeEntry";
import ResourceUpload from "./components/teacher/ResourceUpload";
import Schedule from "./components/Schedule";
import Grades from "./components/Grades";
import Finance from "./components/Finance";
import CourseRegistration from "./components/student/CourseRegistration";
import Profile from "./components/Profile";
import CurriculumManagement from "./components/admin/CurriculumManagement";
import SmartRequests from "./components/shared/SmartRequests";
import DataImport from "./components/admin/DataImport";
import WarningCenter from "./components/admin/WarningCenter";
import ExamManagement from "./components/teacher/ExamManagement";
import StudentExams from "./components/student/StudentExams";
import QRAttendancePage from "./components/student/QRAttendancePage";
import ChangePasswordModal from "./components/ChangePasswordModal"; // Giữ lại từ file 2
import CurriculumView from "./components/student/CurriculumView";     // Giữ lại từ file 2
import { User, UserRole } from "./types";

export type Module =
  | "home"
  | "users"
  | "staff-mgmt"
  | "student-mgmt"
  | "schedule-mgmt"
  | "notifications"
  | "classes"
  | "attendance"
  | "grade-entry"
  | "resources"
  | "schedule"
  | "grades"
  | "finance"
  | "course-registration"
  | "profile"
  | "requests"
  | "import-data"
  | "warnings"
  | "exam-mgmt"
  | "student-exams"
  | "curriculum-mgmt"
  | "curriculum-view"; // Hợp nhất đầy đủ các module type

function AppContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isInitialized } = useSelector((state: RootState) => state.auth);
  
  // Giữ nguyên logic khởi tạo activeModule linh hoạt từ URL (Query Param) của file 1
  const [activeModule, setActiveModule] = useState<Module>(() => {
    const params = new URLSearchParams(window.location.search);
    const mod = params.get("module") as Module;
    if (mod) return mod;
    return "home";
  });

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg-main">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Đang tải hệ thống...</p>
        </div>
      </div>
    );
  }

  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const isQRAttendance = pathname === '/student/qr-attendance';

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Login onLogin={() => {}} />
        </motion.div>
      ) : isQRAttendance ? (
        <motion.div
          key="qr-attendance"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
           <QRAttendancePage 
             courseId={Number(searchParams.get('courseId'))} 
             date={searchParams.get('date') || ''} 
           />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-screen"
        >
          <MainLayout
            activeModule={activeModule}
            setActiveModule={setActiveModule}
          >
            {activeModule === "home" && <Home user={user} />}
            {activeModule === "staff-mgmt" && <UserManagement type="STAFF" />}
            {activeModule === "student-mgmt" && <UserManagement type="STUDENT" />}
            {activeModule === "curriculum-mgmt" && <CurriculumManagement />}
            {activeModule === "schedule-mgmt" && <ScheduleManagement />}
            {activeModule === "notifications" && <NotificationManagement />}
            
            {/* Các module quản trị & chung */}
            {activeModule === "import-data" && <DataImport />}
            {activeModule === "warnings" && <WarningCenter />}
            {activeModule === "requests" && <SmartRequests />}
            
            {/* Module giảng viên */}
            {activeModule === "classes" && <MyClasses teacherId={user.id} />}
            {activeModule === "attendance" && <Attendance teacherId={user.id} />}
            {activeModule === "grade-entry" && <GradeEntry teacherId={user.id} />}
            {activeModule === "resources" && <ResourceUpload teacherId={user.id} />}
            {activeModule === "exam-mgmt" && <ExamManagement />}
            
            {/* Module sinh viên */}
            {activeModule === "schedule" && <Schedule />}
            {activeModule === "curriculum-view" && <CurriculumView />} {/* Giữ lại module xem khung chương trình từ file 2 */}
            {activeModule === "grades" && <Grades />}
            {activeModule === "finance" && <Finance />}
            {activeModule === "course-registration" && <CourseRegistration studentId={user.id} />}
            {activeModule === "student-exams" && <StudentExams />}
            
            {activeModule === "profile" && <Profile user={user} />}
          </MainLayout>
          
          {/* Giữ lại Modal kiểm tra đổi mật khẩu bắt buộc cho người dùng từ file 2 */}
          <ChangePasswordModal isOpen={!!user.mustChangePassword} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Toaster position="top-right" richColors />
      <AppContent />
    </Provider>
  );
}