import { useState, useEffect } from 'react';
import { Megaphone, Send, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface Notification {
  id: number;
  title?: string;
  message: string;
  type: 'SYSTEM' | 'CLASS_UPDATE' | 'BROADCAST';
  targetRole: 'ALL' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  isRead: boolean;
  createdAt: string;
}

export default function NotificationManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'TEACHER' | 'STUDENT'>('ALL');
  const [isSending, setIsSending] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    
    try {
      setIsSending(true);
      await api.post('/notifications/broadcast', {
        title: broadcastTitle,
        message: broadcastMsg,
        targetRole: broadcastTarget
      });
      setBroadcastTitle('');
      setBroadcastMsg('');
      alert('Đã gửi thông báo thành công!');
      fetchNotifications(); // Refresh list
    } catch (error) {
      alert('Lỗi khi gửi thông báo');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tạo thông báo</h1>
          <p className="text-slate-500">Gửi thông báo đến toàn trường hoặc từng nhóm người dùng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Notification Form */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Megaphone className="text-primary" size={20} />
              Tạo thông báo mới
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Tiêu đề</label>
                <input 
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="input-field"
                  placeholder="Nhập tiêu đề thông báo..."
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Gửi đến</label>
                <select 
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value as any)}
                  className="input-field"
                >
                  <option value="ALL">Toàn trường</option>
                  <option value="TEACHER">Tất cả Giáo viên</option>
                  <option value="STUDENT">Tất cả Sinh viên</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Nội dung thông báo</label>
                <textarea 
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  className="input-field min-h-[120px] resize-none"
                  placeholder="Nhập nội dung thông báo..."
                ></textarea>
              </div>
              
              <button 
                onClick={handleSendBroadcast}
                disabled={!broadcastMsg.trim() || isSending}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send size={18} />
                )}
                Phát thông báo
              </button>
            </div>
          </div>
        </div>

        {/* Notification History */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock className="text-primary" size={20} />
                Lịch sử thông báo
              </h2>
            </div>
            
            <div className="p-0">
              {isLoading ? (
                <div className="p-12 text-center text-slate-500">
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Đang tải dữ liệu...
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  Chưa có thông báo nào
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            notif.type === 'BROADCAST' ? 'bg-amber-100 text-amber-600' :
                            notif.type === 'CLASS_UPDATE' ? 'bg-blue-100 text-blue-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {notif.type === 'BROADCAST' ? <Megaphone size={20} /> :
                             notif.type === 'CLASS_UPDATE' ? <CheckCircle2 size={20} /> :
                             <AlertCircle size={20} />}
                          </div>
                          <div>
                            {notif.title && (
                              <p className="text-slate-900 font-bold mb-1">{notif.title}</p>
                            )}
                            <p className="text-slate-800 font-medium">{notif.message}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(notif.createdAt).toLocaleString('vi-VN')}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-100 rounded-full font-medium">
                                Gửi đến: {
                                  notif.targetRole === 'ALL' ? 'Toàn trường' :
                                  notif.targetRole === 'TEACHER' ? 'Giáo viên' :
                                  notif.targetRole === 'STUDENT' ? 'Sinh viên' : 'Hệ thống'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
