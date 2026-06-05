import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

export default function StudentWarningDialog() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [currentWarningIndex, setCurrentWarningIndex] = useState(0);

  useEffect(() => {
    if (user?.role !== 'STUDENT') return;

    const checkWarnings = async () => {
      try {
        const res = await api.get('/warnings/student');
        const activeWarnings = res.data;

        if (activeWarnings.length > 0) {
          // Check localStorage to see if we showed it today
          const lastShownStr = localStorage.getItem('last_warning_shown_date');
          const today = new Date().toDateString();

          if (lastShownStr !== today) {
            setWarnings(activeWarnings);
            setShowWarning(true);
            localStorage.setItem('last_warning_shown_date', today);
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải cảnh báo:', error);
      }
    };

    // Delay a bit to prevent UI block on login
    const timer = setTimeout(checkWarnings, 1500);
    return () => clearTimeout(timer);
  }, [user]);

  const handleNextOrClose = () => {
    if (currentWarningIndex < warnings.length - 1) {
      setCurrentWarningIndex(prev => prev + 1);
    } else {
      setShowWarning(false);
    }
  };

  if (!showWarning || warnings.length === 0) return null;

  const warning = warnings[currentWarningIndex];

  return (
    <AnimatePresence>
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-orange-500"></div>
            <div className="p-8 pb-6">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle className="text-rose-600" size={32} />
              </div>
              
              <h2 className="text-2xl font-black text-slate-800 text-center mb-2">Thông báo Học vụ</h2>
              <p className="text-slate-500 text-center mb-6 font-medium">Hệ thống ghi nhận bạn có cảnh báo cần lưu ý</p>
              
              <div className="bg-rose-50/50 border border-rose-100 p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wider ${
                      warning.severity === 'SUSPENSION' ? 'bg-rose-200 text-rose-800' :
                      warning.severity === 'WARNING' ? 'bg-amber-200 text-amber-800' :
                      'bg-indigo-200 text-indigo-800'
                  }`}>
                    {warning.severity === 'SUSPENSION' ? 'ĐÌNH CHỈ' : warning.severity === 'WARNING' ? 'CẢNH CÁO' : 'LƯU Ý'}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{new Date(warning.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed">{warning.reason}</p>
              </div>
            </div>
            
            <div className="p-6 pt-0 mt-4 flex flex-col gap-3">
              <button 
                onClick={handleNextOrClose}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-200 transition-colors"
              >
                {currentWarningIndex < warnings.length - 1 ? 'Xem thông báo tiếp theo' : 'Tôi đã đọc và hiểu'}
              </button>
              {warnings.length > 1 && (
                <p className="text-center text-xs font-bold text-slate-400">Thông báo {currentWarningIndex + 1} / {warnings.length}</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
