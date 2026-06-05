import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import api from '../../services/api';
import { toast } from 'sonner';
import { Lock, FileSignature, Clock, PlayCircle, Eye, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import ExamEnvironment from './ExamEnvironment';

export default function StudentExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExamId, setActiveExamId] = useState<number | null>(null);

  // Result view state
  const [resultData, setResultData] = useState<any | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);

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

  const handleViewResult = async (examId: number) => {
    setLoadingResult(true);
    try {
      const res = await api.get(`/exams/${examId}/result`);
      setResultData(res.data);
    } catch (error) {
      toast.error('Không thể tải kết quả bài thi');
    } finally {
      setLoadingResult(false);
    }
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
                        <div className="flex-1 space-y-2">
                          <p className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-lg text-center">Đã nộp bài</p>
                          {submission.status === 'GRADED' && (
                             <>
                               <p className="text-center mt-2 font-black text-2xl text-slate-800">{submission.score} <span className="text-sm font-medium text-slate-500">điểm</span></p>
                               <button 
                                 onClick={() => handleViewResult(exam.id)}
                                 className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 mt-2"
                               >
                                 <Eye size={16}/> Xem chi tiết
                               </button>
                             </>
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

      {/* Result Modal */}
      {resultData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 relative">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{resultData.exam.title}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <p><span className="font-bold">Môn học:</span> {resultData.exam.course.name}</p>
                  <p><span className="font-bold">Đã nộp:</span> {new Date(resultData.submission.submittedAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Điểm số</p>
                  <p className="text-3xl font-black text-indigo-600">{resultData.submission.score}<span className="text-lg text-slate-400">/100</span></p>
                </div>
                <button onClick={() => setResultData(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">✕</button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
              {resultData.submission.cheatingAttempts > 0 && (
                 <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800">
                   <AlertTriangle className="shrink-0 mt-0.5" />
                   <div>
                     <p className="font-bold">Hệ thống ghi nhận vi phạm nội quy</p>
                     <p className="text-sm opacity-90">Bạn đã bị hệ thống ghi nhận {resultData.submission.cheatingAttempts} lần vi phạm trong lúc làm bài thi. Điểm số đã bị trừ {resultData.submission.cheatingAttempts * 5} điểm.</p>
                   </div>
                 </div>
              )}
              
              <div className="space-y-6">
                {resultData.exam.questions.map((q: any, idx: number) => {
                  const studentAns = resultData.submission.answers[q.id];
                  const teacherNote = resultData.submission.gradingDetails?.[q.id];
                  const isCorrect = q.type === 'MULTIPLE_CHOICE' ? studentAns === q.correctAnswer : null;
                  
                  return (
                    <div key={q.id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <p className="font-medium text-slate-800 text-lg leading-relaxed"><span className="text-indigo-600 font-black mr-2">Câu {idx + 1}:</span> {q.content}</p>
                        <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap">{q.points} điểm</span>
                      </div>
                      
                      {q.type === 'MULTIPLE_CHOICE' ? (
                        <div className="space-y-3 mt-4">
                          {q.options?.map((opt: string, i: number) => {
                             const isSelected = studentAns === opt;
                             const isTheCorrect = opt === q.correctAnswer;
                             
                             let optionStyles = 'border-slate-200 hover:border-slate-300 text-slate-700';
                             let icon = null;
                             
                             if (isSelected && isTheCorrect) {
                               optionStyles = 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm';
                               icon = <CheckCircle className="text-emerald-500 shrink-0" />;
                             } else if (isSelected && !isTheCorrect) {
                               optionStyles = 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm';
                               icon = <AlertTriangle className="text-rose-500 shrink-0" />;
                             } else if (!isSelected && isTheCorrect) {
                               optionStyles = 'bg-emerald-50/30 border-emerald-300 text-emerald-700 border-dashed';
                               icon = <CheckCircle className="text-emerald-400 shrink-0 opacity-50" />;
                             }

                             return (
                                <div key={i} className={`p-4 rounded-xl text-sm md:text-base flex items-center justify-between border-2 transition-all ${optionStyles}`}>
                                  <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/50 border border-black/5 font-bold shrink-0">{String.fromCharCode(65+i)}</span>
                                    <span>{opt}</span>
                                  </div>
                                  {icon}
                                </div>
                             )
                          })}
                        </div>
                      ) : (
                        <div className="mt-4">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bài làm của bạn:</h4>
                          <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl whitespace-pre-wrap text-slate-800 leading-relaxed min-h-[100px]">
                            {studentAns || <span className="text-slate-400 italic">Nộp giấy trắng</span>}
                          </div>
                        </div>
                      )}
                      
                      {/* Teacher Note */}
                      {teacherNote && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                          <MessageSquare className="text-amber-500 shrink-0 mt-0.5" size={20} />
                          <div>
                            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Nhận xét từ Giảng viên:</p>
                            <p className="text-amber-900 text-sm leading-relaxed">{teacherNote}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button onClick={() => setResultData(null)} className="btn-primary px-8">Đóng lại</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
