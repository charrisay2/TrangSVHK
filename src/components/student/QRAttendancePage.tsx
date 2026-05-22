import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import api from '../../services/api';
import { CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  courseId: number;
  date: string;
}

export default function QRAttendancePage({ courseId, date }: Props) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xử lý điểm danh...');

  useEffect(() => {
    const markAttendance = async () => {
      try {
        const response = await api.post('/attendance/qr-scan', { courseId, date });
        setStatus('success');
        setMessage(response.data.message || 'Điểm danh thành công!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Lỗi khi điểm danh. Vui lòng thử lại sau.');
      }
    };

    if (user?.role === 'STUDENT') {
      markAttendance();
    } else {
      setStatus('error');
      setMessage('URL không hợp lệ hoặc bạn không phải sinh viên.');
    }
  }, [courseId, date, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-6"
      >
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-xl font-bold text-slate-800">Đang xử lý...</h2>
            <p className="text-slate-500">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-800">Thành công!</h2>
            <p className="text-slate-600 font-medium">{message}</p>
            <p className="text-sm text-slate-400">Bạn có thể đóng trang này hoặc quay về trang chủ.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="btn-primary w-full mt-4"
            >
              Về trang chủ
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-20 h-20 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-800">Thất bại</h2>
            <p className="text-rose-600 font-medium">{message}</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl mt-4 w-full"
            >
              Về trang chủ
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
