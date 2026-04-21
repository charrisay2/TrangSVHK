/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, RootState } from "./redux/store";
import { Toaster } from "sonner"; // <-- ĐÃ THÊM IMPORT TOASTER Ở ĐÂY
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
  | "curriculum-mgmt";

function AppContent() {
  const user = useSelector((state: RootState) => state.auth.user);

  const [activeModule, setActiveModule] = useState<Module>(() => {
    const params = new URLSearchParams(window.location.search);
    const mod = params.get("module") as Module;
    if (mod) return mod;
    return "home";
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg-main">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Đang tải hệ thống...</p>
        </div>
      </div>
    );
  }

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
            {activeModule === "student-mgmt" && (
              <UserManagement type="STUDENT" />
            )}
            {activeModule === "curriculum-mgmt" && <CurriculumManagement />}
            {activeModule === "schedule-mgmt" && <ScheduleManagement />}
            {activeModule === "notifications" && <NotificationManagement />}
            {activeModule === "classes" && <MyClasses teacherId={user.id} />}
            {activeModule === "attendance" && (
              <Attendance teacherId={user.id} />
            )}
            {activeModule === "grade-entry" && (
              <GradeEntry teacherId={user.id} />
            )}
            {activeModule === "resources" && (
              <ResourceUpload teacherId={user.id} />
            )}
            {activeModule === "schedule" && <Schedule />}
            {activeModule === "grades" && <Grades />}
            {activeModule === "finance" && <Finance />}
            {activeModule === "course-registration" && (
              <CourseRegistration studentId={user.id} />
            )}
            {activeModule === "profile" && <Profile user={user} />}
          </MainLayout>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      {/* ĐÃ FIX: Gắn Toaster vào đây để thông báo xuất hiện góc trên bên phải, có màu sắc rõ ràng */}
      <Toaster position="top-right" richColors />
      <AppContent />
    </Provider>
  );
}
