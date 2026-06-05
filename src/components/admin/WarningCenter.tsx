import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Play, CheckCircle, X, Send } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

interface WarningModel {
  id: number;
  student: { id: number; name: string; username: string; email: string };
  type: string;
  severity: string;
  reason: string;
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: string;
}

export default function WarningCenter() {
  const [warnings, setWarnings] = useState<WarningModel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Warning Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customWarning, setCustomWarning] = useState({ studentId: '', reason: '' });
  const [isSending, setIsSending] = useState(false);

  const fetchWarnings = async () => {
    try {
      // Auto evaluating when fetching
      await api.post('/warnings/evaluate').catch(() => {});
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

  const handleResolve = async (id: number) => {
    try {
      await api.put(`/warnings/${id}`, { status: 'RESOLVED' });
      toast.success('Đã cập nhật trạng thái đã giải quyết');
      fetchWarnings();
    } catch (error) {
       toast.error('Lỗi cập nhật');
    }
  };

  const submitCustomWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWarning.studentId || !customWarning.reason) {
      toast.error('Vui lòng nhập đủ thông tin');
      return;
    }
    setIsSending(true);
    try {
      await api.post('/warnings', {
        studentId: parseInt(customWarning.studentId),
        type: 'CUSTOM',
        severity: 'WARNING',
        reason: customWarning.reason
      });
      toast.success('Đã gửi cảnh cáo cá nhân');
      setIsModalOpen(false);
      setCustomWarning({ studentId: '', reason: '' });
      fetchWarnings();
    } catch (error) {
      toast.error('Lỗi khi gửi cảnh cáo');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="text-rose-600"/> Trung tâm Kỷ luật & Cảnh báo Học vụ
          </h1>
          <p className="text-slate-500 mt-1">Quản lý các vi phạm và hiển thị danh sách cảnh cáo</p>
        </div>
        <div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            <Send size={18} />
            Gửi cảnh báo / Kỷ luật
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={20} />
                Gửi Cảnh Báo Riêng
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitCustomWarning} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ID Sinh viên</label>
                <input
                  type="number"
                  className="input-field w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ví dụ: 1001"
                  value={customWarning.studentId}
                  onChange={(e) => setCustomWarning({ ...customWarning, studentId: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Lý do / Nội dung cảnh báo</label>
                <textarea
                  className="input-field w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập nội dung nhắc nhở..."
                  rows={4}
                  value={customWarning.reason}
                  onChange={(e) => setCustomWarning({ ...customWarning, reason: e.target.value })}
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="btn-primary px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-200 disabled:opacity-50"
                >
                  {isSending ? 'Đang gửi...' : 'Gửi Thông Báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
