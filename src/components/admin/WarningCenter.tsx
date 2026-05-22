import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Play, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

interface WarningModel {
  id: number;
  student: {
    id: number;
    name: string;
    code: string;
    email: string;
    username: string;
  };
  type: string;
  severity: string;
  reason: string;
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: string;
}
export default function WarningCenter() {
  const [warnings, setWarnings] = useState<WarningModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  const fetchWarnings = async () => {
    try {
      const res = await api.get('/warnings');
      setWarnings(res.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách cảnh báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, []);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const res = await api.post('/warnings/evaluate');
      toast.success(res.data.message);
      fetchWarnings();
    } catch (error) {
      toast.error('Lỗi khi chạy quét hệ thống');
    } finally {
      setEvaluating(false);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await api.put(`/warnings/${id}`, { status: 'RESOLVED' });
      toast.success('Đã cập nhật trạng thái đã giải quyết');
      fetchWarnings();
    } catch (error) {
       toast.error('Lỗi cập nhật');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="text-rose-600"/> Trung tâm Kỷ luật & Cảnh báo Học vụ
          </h1>
          <p className="text-slate-500 mt-1">Quản lý các vi phạm và sinh viên đăng ký thiếu tín chỉ (Dưới 15 TC)</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const studentId = prompt('Nhập ID sinh viên:');
              const reason = prompt('Nhập lý do cảnh cáo cá nhân hóa:');
              if (studentId && reason) {
                api.post('/warnings', {
                  studentId: parseInt(studentId),
                  type: 'CUSTOM',
                  severity: 'WARNING',
                  reason
                }).then(() => {
                  toast.success('Đã gửi cảnh cáo cá nhân');
                  fetchWarnings();
                }).catch(() => toast.error('Lỗi khi gửi'));
              }
            }}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
          >
            + Gửi Cảnh cáo mới
          </button>
          <button 
            onClick={handleEvaluate}
            disabled={evaluating}
            className="btn-primary flex items-center gap-2 px-6 bg-rose-600 hover:bg-rose-700 shadow-rose-200 disabled:opacity-50"
          >
            {evaluating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play size={18} />
            )}
            Tự động đánh giá hệ thống
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-l-4 border-l-amber-500">
           <h3 className="text-slate-500 font-bold mb-2">Đăng ký dưới 15 Tín chỉ</h3>
           <p className="text-3xl font-black text-slate-800">
             {warnings.filter(w => w.type === 'LOW_CREDIT' && w.status === 'ACTIVE').length}
           </p>
        </div>
        <div className="card p-6 border-l-4 border-l-rose-500">
           <h3 className="text-slate-500 font-bold mb-2">Cảnh cáo Học vụ (&gt;30% Rớt)</h3>
           <p className="text-3xl font-black text-slate-800">
             {warnings.filter(w => w.type === 'ACADEMIC_POOR' && w.status === 'ACTIVE').length}
           </p>
        </div>
        <div className="card p-6 border-l-4 border-l-indigo-500">
           <h3 className="text-slate-500 font-bold mb-2">Vi phạm kỷ luật</h3>
           <p className="text-3xl font-black text-slate-800">
             {warnings.filter(w => w.type === 'VIOLATION' && w.status === 'ACTIVE').length}
           </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-700">Danh sách Cảnh báo</h3>
        </div>
        {loading ? (
           <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-rose-600 border-t-transparent animate-spin"/></div>
        ) : warnings.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center">
            <CheckCircle className="text-emerald-500 mb-2" size={48} opacity={0.5} />
            Hệ thống không ghi nhận cảnh báo nào.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {warnings.map((w) => (
              <div key={w.id} className={`p-4 flex flex-col md:flex-row justify-between gap-4 transition-colors ${w.status === 'RESOLVED' ? 'opacity-60 bg-slate-50 hover:bg-slate-50' : 'hover:bg-slate-50'}`}>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-slate-800">{w.student.name}</span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{w.student.username}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      w.severity === 'SUSPENSION' ? 'bg-rose-100 text-rose-700' :
                      w.severity === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {w.severity === 'SUSPENSION' ? 'ĐÌNH CHỈ' : w.severity === 'WARNING' ? 'CẢNH CÁO' : 'LƯU Ý'}
                    </span>
                    {w.status === 'RESOLVED' && <span className="bg-slate-200 text-slate-500 text-xs px-2 py-0.5 rounded-full font-bold">Đã xử lý</span>}
                  </div>
                  <p className="text-sm text-slate-600 mb-1"><span className="font-medium text-slate-700">Lý do:</span> {w.reason}</p>
                  <p className="text-xs text-slate-400">Ghi nhận lúc: {new Date(w.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                
                {w.status === 'ACTIVE' && (
                  <div className="flex items-center">
                    <button 
                      onClick={() => handleResolve(w.id)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      Đánh dấu đã giải quyết
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
