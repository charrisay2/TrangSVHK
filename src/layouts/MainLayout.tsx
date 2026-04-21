import { FC, ReactNode, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { Module } from "../App";
import AIChatBox from "../components/common/AIChatBox"; // ĐÃ THÊM: Import Chatbox AI

interface DashboardLayoutProps {
  children: ReactNode;
  activeModule: Module;
  setActiveModule: (module: Module) => void;
}

const DashboardLayout: FC<DashboardLayoutProps> = ({
  children,
  activeModule,
  setActiveModule,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-bg-main overflow-hidden relative">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          setActiveModule={setActiveModule}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
      <AIChatBox />
    </div>
  );
};

export default DashboardLayout;
