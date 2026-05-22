import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import api from '../../services/api';
import { toast } from 'sonner';
import { Lock, FileSignature, Clock, PlayCircle } from 'lucide-react';
import ExamEnvironment from './ExamEnvironment';

export default function StudentExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExamId, setActiveExamId] = useState<number | null>(null);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams/student');
      setExams(res.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách bài thi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleTakeExam = (exam: any) => {
     const now = new Date();
     const startTime = new Date(exam.startTime);
     const endTime = new Date(exam.endTime);

     if (now < startTime) {
        toast.warning('Chưa đến giờ làm bài');
        return;
     }

     if (now > endTime) {
        toast.error('Bài thi đã kết thúc');
        return;
     }

     setActiveExamId(exam.id);
  };

  if (activeExamId) {
     return <ExamEnvironment examId={activeExamId} onComplete={() => { setActiveExamId(null); fetchExams(); }} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileSignature className="text-indigo-600"/> Khảo thí trực tuyến
        </h1>
        <p className="text-slate-500 mt-1">Danh sách bài thi của bạn</p>
      </div>

      {loading ? (
        <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"/></div>
      ) : exams.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 bg-slate-50/50 flex flex-col items-center">
          <FileSignature size={48} className="mb-4 opacity-50" />
          Chưa có bài thi nào đang mở.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => {
            const hasSubmitted = exam.submissions && exam.submissions.length > 0;
            const submission = hasSubmitted ? exam.submissions[0] : null;
            const now = new Date();
            const isActive = now >= new Date(exam.startTime) && now <= new Date(exam.endTime) && exam.status === 'PUBLISHED';
            const isEnded = now > new Date(exam.endTime) || exam.status === 'COMPLETED';
            
            return (
              <div key={exam.id} className={`card overflow-hidden transition-all hover:shadow-lg ${isActive && !hasSubmitted ? 'border-2 border-indigo-500 ring-4 ring-indigo-50' : 'border border-slate-200'}`}>
                <div className={`p-5 ${isActive && !hasSubmitted ? 'bg-gradient-to-br from-indigo-50 to-white' : 'bg-white'}`}>
                   <div className="flex justify-between items-start mb-4">
                     <h3 className="font-bold text-slate-800 text-lg leading-tight">{exam.title}</h3>
                     {exam.isLockdown && <Lock className="text-rose-500 shrink-0" size={20} />}
                   </div>
                   
                   <div className="space-y-2 text-sm text-slate-600 mb-6">
                      <p><span className="font-medium text-slate-700">Môn học:</span> {exam.course?.name}</p>
                      <p className="flex items-center gap-1">
                        <Clock size={14}/> 
                        {new Date(exam.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - {new Date(exam.endTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} 
                        ({new Date(exam.startTime).toLocaleDateString('vi-VN')})
                      </p>
                   </div>

                   <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                     {hasSubmitted ? (
                        <div className="flex-1">
                          <p className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-lg text-center">Đã nộp bài</p>
                          {submission.status === 'GRADED' && (
                             <p className="text-center mt-2 font-black text-2xl text-slate-800">{submission.score} <span className="text-sm font-medium text-slate-500">điểm</span></p>
                          )}
                          {submission.status === 'PENDING' && (
                             <p className="text-center mt-2 font-medium text-amber-600 text-sm">Chờ giảng viên chấm tự luận</p>
                          )}
                        </div>
                     ) : isActive ? (
                        <button 
                          onClick={() => handleTakeExam(exam)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                        >
                          <PlayCircle size={18}/> Vào thi
                        </button>
                     ) : isEnded ? (
                        <p className="w-full text-slate-500 font-bold text-sm bg-slate-100 px-3 py-2 rounded-lg text-center">Đã kết thúc</p>
                     ) : (
                        <p className="w-full text-amber-600 font-bold text-sm bg-amber-50 px-3 py-2 rounded-lg text-center">Sắp diễn ra</p>
                     )}
                   </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
