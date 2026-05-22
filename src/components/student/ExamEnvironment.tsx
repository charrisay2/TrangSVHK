import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'sonner';
import { Lock, AlertTriangle, Send, CheckCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  examId: number;
  onComplete: () => void;
}

export default function ExamEnvironment({ examId, onComplete }: Props) {
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [cheatingAttempts, setCheatingAttempts] = useState(0);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await api.get(`/exams/${examId}/take`);
        setExam(res.data);
      } catch (error) {
         toast.error('Lỗi khi tải đề thi');
         onComplete();
      }
    };
    fetchExam();

    // Security constraints if lockdown mode
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
         setCheatingAttempts(prev => prev + 1);
         toast.error('CẢNH BÁO BẢO MẬT: Phát hiện chuyển tab hoặc rời khỏi màn hình thi!', { duration: 5000 });
      }
    };

    const handleCopy = (e: ClipboardEvent) => { 
      e.preventDefault(); 
      setCheatingAttempts(prev => prev + 1);
      toast.warning('Không được phép copy trong môi trường thi.'); 
    };
    const handlePaste = (e: ClipboardEvent) => { 
      e.preventDefault(); 
      setCheatingAttempts(prev => prev + 1);
      toast.warning('Không được phép paste trong môi trường thi.'); 
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.warning('Không được phép sử dụng chuột phải.'); 
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    // Try to request full screen
    try {
        document.documentElement.requestFullscreen().catch(err => {
            console.log("Could not request full screen", err);
        });
    } catch(e) {}

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch(e) {}
    };
  }, [examId]);

  const handleSubmit = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn nộp bài? Không thể sửa đổi sau khi nộp.')) return;
    setSubmitting(true);
    try {
      await api.post(`/exams/${examId}/submit`, { answers, cheatingAttempts });
      toast.success('Nộp bài thành công!');
      onComplete();
    } catch (error) {
      toast.error('Lỗi khi nộp bài');
      setSubmitting(false); 
    }
  };

  if (!exam) return (
     <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
     </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10 shrink-0">
         <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
               <ShieldAlert size={24}/>
            </div>
            <div>
               <h1 className="font-bold text-xl text-slate-800 leading-tight">{exam.title}</h1>
               <p className="text-sm text-slate-500">Khảo thí trực tuyến an toàn - {exam.isLockdown ? 'Bật Lockdown' : 'Mở'}</p>
            </div>
         </div>

         <div className="flex items-center gap-6">
            {cheatingAttempts > 0 && (
               <div className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-lg font-bold border border-rose-200">
                 <AlertTriangle size={20}/>
                 Cảnh báo vi phạm: {cheatingAttempts}
               </div>
            )}
            
            <button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-emerald-200 transition-colors flex items-center gap-2 text-lg"
            >
              <Send size={20}/> Nộp bài
            </button>
         </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
           {exam.questions?.map((q: any, idx: number) => (
              <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0 mt-1">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-medium text-slate-800">{q.content}</p>
                    <p className="text-xs font-bold text-slate-400 mt-2">{q.points} điểm • {q.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : 'Tự luận'}</p>
                  </div>
                </div>

                <div className="pl-12">
                  {q.type === 'MULTIPLE_CHOICE' ? (
                     <div className="space-y-3">
                       {q.options?.map((opt: string, i: number) => (
                          <label 
                            key={i} 
                            className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                               answers[q.id] === opt 
                               ? 'border-indigo-500 bg-indigo-50 shadow-sm ring-1 ring-indigo-500' 
                               : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <input 
                              type="radio" 
                              name={`question-${q.id}`} 
                              value={opt}
                              checked={answers[q.id] === opt}
                              onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                              className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-slate-700 font-medium leading-relaxed">{opt}</span>
                          </label>
                       ))}
                     </div>
                  ) : (
                    <textarea
                      className="w-full min-h-[200px] p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700"
                      placeholder="Nhập câu trả lời tự luận của bạn vào đây..."
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    />
                  )}
                </div>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
}
