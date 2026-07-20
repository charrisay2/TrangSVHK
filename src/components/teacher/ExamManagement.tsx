import { useState, useEffect } from 'react';
import { BookOpen, Search, Clock, FileText, Upload, CheckCircle, Edit, Play, Lock, AlertTriangle, MessageSquare, Database } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import api from '../../services/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import QuestionBank from './QuestionBank';

export default function ExamManagement() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'exams' | 'bank'>('exams');
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  
  // Submit grading
  const [gradingSubmission, setGradingSubmission] = useState<any | null>(null);
  const [bankModal, setBankModal] = useState<{isOpen: boolean; examId: number | null; count: string}>({ isOpen: false, examId: null, count: '10' });
  const [essayScores, setEssayScores] = useState<Record<number, number>>({});
  const [gradingDetails, setGradingDetails] = useState<Record<number, string>>({}); // Mapping questionId -> comment

  // Form State
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',  
    description: '',
    startTime: '',
    endTime: '',
    isLockdown: false
  });

  const fetchExams = async () => {
    try {
      const [examsRes, coursesRes] = await Promise.all([
        api.get('/exams/teacher'),
        api.get('/courses')
      ]);
      setExams(examsRes.data);
      // Filter courses where teacher is assigned
      setCourses(coursesRes.data.filter((c: any) => String(c.teacherId) === String(user?.id)));
    } catch (error) {
      toast.error('Lỗi khi tải danh sách bài thi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/exams', formData);
      toast.success('Tạo bài thi thành công!');
      setShowCreateModal(false);
      fetchExams();
    } catch (error) {
      toast.error('Lỗi khi tạo bài thi');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, examId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Parse data
        const questions = data.map((row: any) => {
          if (row.Type === 'ESSAY') {
            return {
              type: 'ESSAY',
              content: row.Question,
              points: parseFloat(row.Points) || 10
            };
          } else {
            return {
              type: 'MULTIPLE_CHOICE',
              content: row.Question,
              options: [row.OptionA, row.OptionB, row.OptionC, row.OptionD].filter(Boolean),
              correctAnswer: row.CorrectAnswer,
              points: parseFloat(row.Points) || 1
            };
          }
        });

        await api.post(`/exams/${examId}/questions`, { questions, append: true });
        toast.success(`Đã thêm ${questions.length} câu hỏi từ file Excel`);
        fetchExams();
      } catch (err) {
        toast.error('File Excel không đúng định dạng.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleFromBank = (exam: any) => {
    setBankModal({ isOpen: true, examId: exam.id, count: '10' });
  };

  const submitFromBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankModal.examId) return;
    try {
      await api.post(`/exams/${bankModal.examId}/questions-from-bank`, { count: parseInt(bankModal.count) });
      toast.success('Đã lấy câu hỏi từ ngân hàng!');
      fetchExams();
      setBankModal({ isOpen: false, examId: null, count: '10' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi lấy từ ngân hàng');
    }
  };

  const publishExam = async (id: number) => {
    try {
      await api.put(`/exams/${id}/publish`, { status: 'PUBLISHED' });
      toast.success('Đã xuất bản bài thi');
      fetchExams();
    } catch (error) {
      toast.error('Lỗi xuất bản');
    }
  };

  const loadSubmissions = async (exam: any) => {
    try {
      const res = await api.get(`/exams/${exam.id}/submissions`);
      setSelectedExam({ ...exam, submissionData: res.data.submissions, questionsData: res.data.questions });
    } catch (error) {
      toast.error('Lỗi tải bài nộp');
    }
  };

  const saveGrade = async () => {
    try {
       // Recompute final score
       let rawScore = 0;
       const totalPointsConfigured = selectedExam.questionsData?.reduce((sum: number, q: any) => sum + (q.points || 0), 0) || 1;
       
       selectedExam.questionsData?.forEach((q: any) => {
         if (q.type === 'MULTIPLE_CHOICE') {
           if (gradingSubmission.answers[q.id] === q.correctAnswer) rawScore += q.points;
         } else {
           rawScore += (essayScores[q.id] || 0);
         }
       });
       
       const pointScale = 100 / totalPointsConfigured;
       let finalScore = (rawScore * pointScale) - (gradingSubmission.cheatingAttempts * 5);
       if (finalScore < 0) finalScore = 0;
       if (finalScore > 100) finalScore = 100;

       await api.put(`/exams/submissions/${gradingSubmission.id}/grade`, { 
         score: parseFloat(finalScore.toFixed(2)),
         gradingDetails
       });
       toast.success('Chấm điểm thành công');
       setGradingSubmission(null);
       setEssayScores({});
       setGradingDetails({});
       loadSubmissions(selectedExam);
       fetchExams();
    } catch (error) {
       toast.error('Lỗi khi chấm điểm');
    }
  };

  const openGradingModal = (sub: any) => {
    setGradingSubmission(sub);
    const initialGradingDetails: Record<number, string> = sub.gradingDetails || {};
    setEssayScores({});
    setGradingDetails(initialGradingDetails);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-indigo-600"/> Quản lý Khảo thí
          </h1>
          <p className="text-slate-500 mt-1">Tạo bài thi trực tuyến, môi trường chống gian lận và tự động chấm điểm</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          + Tạo Bài Thi Mới
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          className={`pb-3 px-4 font-bold transition-colors ${activeTab === 'exams' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('exams')}
        >
          Danh sách Bài thi
        </button>
        <button 
          className={`pb-3 px-4 font-bold transition-colors ${activeTab === 'bank' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('bank')}
        >
          Ngân hàng Câu hỏi
        </button>
      </div>

      {activeTab === 'bank' ? (
        <QuestionBank courses={courses} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Danh sách bài thi</h2>
          {loading ? (
             <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"/></div>
          ) : exams.length === 0 ? (
             <div className="card p-8 text-center text-slate-500">Chưa có bài thi nào</div>
          ) : (
            exams.map(exam => (
              <div 
                key={exam.id} 
                className={`card p-5 cursor-pointer transition-all border-2 ${selectedExam?.id === exam.id ? 'border-indigo-500 shadow-md ring-2 ring-indigo-100' : 'border-transparent hover:border-slate-200'}`}
                onClick={() => loadSubmissions(exam)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-lg">{exam.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    exam.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 
                    exam.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {exam.status === 'PUBLISHED' ? 'Đang diễn ra' : exam.status === 'DRAFT' ? 'Bản nháp' : 'Đã kết thúc'}
                  </span>
                </div>
                <div className="text-sm text-slate-600 space-y-1 mb-4">
                  <p><span className="font-medium text-slate-700">Môn học:</span> {exam.course?.name}</p>
                  <p><span className="font-medium text-slate-700">Thời gian:</span> {new Date(exam.startTime).toLocaleString('vi-VN')} - {new Date(exam.endTime).toLocaleString('vi-VN')}</p>
                  {exam.isLockdown && <p className="text-rose-600 font-bold flex items-center gap-1 text-xs"><Lock size={12}/> Lockdown Browser Bật</p>}
                  <p><span className="font-medium text-slate-700">Câu hỏi:</span> {exam.questions?.length || 0} câu</p>
                  <p><span className="font-medium text-slate-700">Bài nộp:</span> {exam.submissions?.length || 0} bài</p>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                  {exam.status === 'DRAFT' && (
                    <>
                      <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2">
                        <Upload size={16}/> Upload Excel
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleFileUpload(e, exam.id)} />
                      </label>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleFromBank(exam); }}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <Database size={16}/> Lấy từ Ngân hàng
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); publishExam(exam.id); }}
                        disabled={!exam.questions || exam.questions.length === 0}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Play size={16}/> Xuất bản
                      </button>
                    </>
                  )}
                  {exam.status === 'PUBLISHED' && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        api.put(`/exams/${exam.id}/publish`, { status: 'COMPLETED' })
                          .then(() => { toast.success('Đã kết thúc bài thi'); fetchExams(); })
                          .catch(() => toast.error('Lỗi kết thúc bài thi'));
                      }}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <CheckCircle size={16}/> Kết thúc
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Quản lý & Chấm điểm</h2>
          {!selectedExam ? (
            <div className="card p-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 border border-slate-200 border-dashed">
               <FileText size={48} className="mb-4 opacity-50"/>
               <p>Chọn một bài thi để xem chi tiết và chấm điểm</p>
            </div>
          ) : (
            <div className="card p-6">
              <h3 className="font-bold text-xl text-slate-800 mb-4 flex items-center gap-2">
                Bài thi: {selectedExam.title}
              </h3>
              
              {!selectedExam.submissionData || selectedExam.submissionData.length === 0 ? (
                <div className="text-center p-6 text-slate-500 bg-slate-50 rounded-xl">Chưa có bài nộp nào.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-4 font-bold text-slate-600 text-sm pb-2">
                    <div className="col-span-2">Sinh viên</div>
                    <div>Tình trạng</div>
                    <div className="text-right">Điểm</div>
                  </div>
                  {selectedExam.submissionData.map((sub: any) => (
                    <div key={sub.id} className="grid grid-cols-4 items-center py-3">
                      <div className="col-span-2">
                        <p className="font-bold text-slate-800 flex items-center gap-2">
                          {sub.student.name}
                          {sub.cheatingAttempts > 0 && (
                            <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded flex items-center gap-0.5" title={`${sub.cheatingAttempts} lần vi phạm trong quá trình làm bài`}>
                              <AlertTriangle size={10}/> {sub.cheatingAttempts}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{sub.student.username}</p>
                      </div>
                      <div>
                        {sub.status === 'GRADED' ? (
                          <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">Đã chấm ({sub.score}đ)</span>
                        ) : (
                          <span className="text-amber-600 font-bold text-xs bg-amber-50 px-2 py-1 rounded flex items-center gap-1 w-fit">
                            <Clock size={12}/> Chờ duyệt
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <button 
                          onClick={() => openGradingModal(sub)}
                          className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium rounded text-sm"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Question Bank Modal */}
      {bankModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Database size={20} className="text-indigo-600" /> Lấy câu hỏi từ ngân hàng
            </h3>
            <form onSubmit={submitFromBank}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng câu hỏi cần lấy ngẫu nhiên</label>
                <input 
                  type="number" 
                  min="1" 
                  className="input-field" 
                  value={bankModal.count} 
                  onChange={(e) => setBankModal({...bankModal, count: e.target.value})} 
                />
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button type="button" onClick={() => setBankModal({isOpen: false, examId: null, count: '10'})} className="px-4 py-2 text-slate-600 font-medium btn-secondary">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Chấm bài: {gradingSubmission.student.name}</h2>
                <div className="flex items-center gap-3">
                  <p className="text-slate-500 text-sm">Điểm hiện tại: {gradingSubmission.score !== null ? gradingSubmission.score : 'Chưa có'}</p>
                  {gradingSubmission.cheatingAttempts > 0 && (
                     <p className="text-rose-600 font-bold text-sm bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1">
                       <AlertTriangle size={14}/> Vi phạm quay cóp/click chuột phải/tab: {gradingSubmission.cheatingAttempts} lần (-{gradingSubmission.cheatingAttempts * 5} điểm)
                     </p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => {
                  setGradingSubmission(null);
               
                  setGradingDetails({});
                }} 
                className="text-slate-400 hover:text-slate-600"
              >✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {selectedExam.questionsData?.map((q: any, idx: number) => {
                const studentAns = gradingSubmission.answers[q.id];
                const isCorrect = q.type === 'MULTIPLE_CHOICE' ? studentAns === q.correctAnswer : null;
                
                return (
                  <div key={q.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm space-y-3">
                    <div className="flex justify-between items-start mb-3">
                      <p className="font-medium text-slate-800"><span className="text-indigo-600 font-bold mr-1">Câu {idx + 1}:</span> {q.content}</p>
                      <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{q.points}đ</span>
                    </div>
                    
                    {q.type === 'MULTIPLE_CHOICE' ? (
                      <div className="space-y-2">
                        {q.options?.map((opt: string, i: number) => {
                           const isSelected = studentAns === opt;
                           const isTheCorrect = opt === q.correctAnswer;
                           return (
                              <div key={i} className={`p-2 rounded text-sm flex items-center justify-between border
                                ${isSelected && isTheCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                                  isSelected && !isTheCorrect ? 'bg-rose-50 border-rose-200 text-rose-800' : 
                                  isTheCorrect ? 'bg-emerald-50/50 border-emerald-100 border-dashed text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-600'}
                              `}>
                                <span>{String.fromCharCode(65+i)}. {opt}</span>
                                {isSelected && isTheCorrect && <CheckCircle size={16} className="text-emerald-500" />}
                                {isSelected && !isTheCorrect && <AlertTriangle size={16} className="text-rose-500" />}
                              </div>
                           )
                        })}
                        <p className={`text-sm font-bold mt-2 ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                          Hệ thống chấm: {isCorrect ? `${q.points} / ${q.points}đ` : `0 / ${q.points}đ`}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bài nộp tự luận:</h4>
                        <div className="p-4 bg-yellow-50/50 border border-yellow-200/50 rounded-lg whitespace-pre-wrap text-sm text-slate-700 min-h-[100px]">
                          {studentAns || <span className="text-slate-400 italic">Không có câu trả lời</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-2 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                           <label className="text-sm font-bold text-slate-700">Chấm điểm ({q.points}đ tối đa):</label>
                           <input 
                              type="number"
                              step="0.25"
                              min="0"
                              max={q.points}
                              className="input-field w-24 py-1 border-indigo-200 focus:border-indigo-500"
                              value={essayScores[q.id] === undefined ? '' : essayScores[q.id]}
                              onChange={(e) => {
                                 const val = parseFloat(e.target.value);
                                 if (isNaN(val)) {
                                    setEssayScores({ ...essayScores, [q.id]: 0 });
                                    return;
                                 }
                                 if (val > q.points || val < 0) {
                                    toast.error(`Điểm phải nằm trong khoảng từ 0 đến ${q.points}`);
                                 } else {
                                    setEssayScores({ ...essayScores, [q.id]: val });
                                 }
                              }}
                           />
                        </div>
                      </div>
                    )}
                    
                    {/* Teacher Feedback Note per Answer */}
                    {((q.type === 'MULTIPLE_CHOICE' && studentAns !== q.correctAnswer) || (q.type === 'ESSAY' && (essayScores[q.id] || 0) < q.points)) && (
                      <div className="pt-2 border-t border-slate-100 mt-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <MessageSquare size={12}/> Nhận xét của giảng viên
                        </label>
                        <input 
                          className="input-field w-full text-sm py-1.5"
                          placeholder="Thêm nhận xét cho câu trả lời này..."
                          value={gradingDetails[q.id] || ''}
                          onChange={(e) => setGradingDetails({ ...gradingDetails, [q.id]: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

              {/* Compute autoScore and show it */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  {(() => {
                    let rawScore = 0;
                    let mcqRaw = 0;
                    let essayRaw = 0;
                    const totalPointsConfigured = selectedExam.questionsData?.reduce((sum: number, q: any) => sum + (q.points || 0), 0) || 1;
                    
                    selectedExam.questionsData?.forEach((q: any) => {
                      if (q.type === 'MULTIPLE_CHOICE') {
                        if (gradingSubmission.answers[q.id] === q.correctAnswer) {
                           rawScore += q.points;
                           mcqRaw += q.points;
                        }
                      } else {
                        rawScore += (essayScores[q.id] || 0);
                        essayRaw += (essayScores[q.id] || 0);
                      }
                    });
                    
                    const pointScale = 100 / totalPointsConfigured;
                    const penalty = gradingSubmission.cheatingAttempts * 5;
                    let finalScore = (rawScore * pointScale) - penalty;
                    if (finalScore < 0) finalScore = 0;
                    if (finalScore > 100) finalScore = 100;
                    
                    return (
                      <div className="text-sm border p-4 rounded-xl bg-white shadow-sm flex flex-col gap-1 min-w-[250px]">
                        <p className="text-slate-600 font-medium flex justify-between"><span>Điểm trắc nghiệm:</span> <span>{mcqRaw} đ (Thô)</span></p>
                        <p className="text-slate-600 font-medium flex justify-between"><span>Điểm tự luận:</span> <span>{essayRaw} đ (Thô)</span></p>
                        <p className="text-amber-600 font-medium flex justify-between"><span>Quy đổi (Hệ 100):</span> <span>{(rawScore * pointScale).toFixed(2)}</span></p>
                        <p className="text-rose-600 font-medium flex justify-between border-b pb-1"><span>Trừ điểm vi phạm:</span> <span>-{penalty}</span></p>
                        <p className="text-indigo-600 font-bold text-lg mt-1 flex justify-between uppercase"><span>Tổng điểm:</span> <span>{finalScore.toFixed(2)} / 100</span></p>
                      </div>
                    )
                  })()}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setGradingSubmission(null);
                   
                        setGradingDetails({});
                      }} 
                      className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg"
                    >Hủy</button>
                    <button onClick={saveGrade} className="btn-primary" disabled={false}>Lưu điểm</button>
                  </div>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 text-center">Tạo Bài Thi Mới</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <form onSubmit={handleCreateExam} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Môn học</label>
                  <select 
                    className="input-field"
                    value={formData.courseId}
                    onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                  >
                    <option value="">Chọn môn học...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loại bài thi (Tên bài thi)</label>
                  <select  className="input-field" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}>
                    <option value="">Chọn loại bài thi...</option>
                    <option value="Kiểm tra 15 phút">Kiểm tra 15 phút</option>
                    <option value="Kiểm tra giữa kỳ">Kiểm tra giữa kỳ</option>
                    <option value="Thi cuối kỳ">Thi cuối kỳ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian bắt đầu</label>
                  <input  type="datetime-local" className="input-field" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian kết thúc</label>
                  <input  type="datetime-local" className="input-field" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
                </div>
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl mt-4">
                  <input 
                    type="checkbox" 
                    id="lockdown" 
                    className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500"
                    checked={formData.isLockdown}
                    onChange={(e) => setFormData({...formData, isLockdown: e.target.checked})}
                  />
                  <label htmlFor="lockdown" className="font-bold text-rose-800 flex items-center gap-2">
                    <Lock size={16}/> Bật Lockdown Browser (Chống gian lận)
                  </label>
                </div>
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl mt-4 text-sm text-indigo-700">
                  <span className="font-bold">Lưu ý:</span> Tổng điểm tự động được quy đổi thành thang điểm 100. Mỗi vi phạm sẽ tự động bị trừ 5 điểm.
                </div>
                <button type="submit" className="btn-primary w-full mt-6 py-3 text-lg">Tạo mới</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
