import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import api from '../../services/api';
import { toast } from 'sonner';
import { Plus, Database, Filter, Upload, Download, LayoutGrid, List, SortAsc, SortDesc } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

export default function QuestionBank({ courses }: { courses: any[] }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredCourse, setFilteredCourse] = useState<string>('');
  const [filteredExamType, setFilteredExamType] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    courseId: '',
    type: 'MULTIPLE_CHOICE',
    content: '',
    points: 10,
    correctAnswer: '',
    options: ['', '', '', ''],
    examType: 'Tất cả'
  });

  const fetchQuestions = async () => {
    try {
      const url = filteredCourse ? `/exams/bank?courseId=${filteredCourse}` : `/exams/bank`;
      const res = await api.get(url);
      setQuestions(res.data);
    } catch (error) {
      toast.error('Lỗi khi tải ngân hàng câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [filteredCourse]);

  const handleOptionChange = (idx: number, val: string) => {
    const newOptions = [...formData.options];
    newOptions[idx] = val;
    setFormData({ ...formData, options: newOptions });
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        courseId: parseInt(formData.courseId),
        type: formData.type,
        content: formData.content,
        points: parseFloat(formData.points.toString()),
        examType: formData.examType
      };
      
      if (formData.type === 'MULTIPLE_CHOICE') {
        payload.options = formData.options.filter(Boolean);
        payload.correctAnswer = formData.correctAnswer;
      }
      
      await api.post('/exams/bank', payload);
      toast.success('Đã thêm câu hỏi vào ngân hàng');
      setShowAddModal(false);
      setFormData({
        ...formData,
        content: '',
        points: 10,
        correctAnswer: '',
        options: ['', '', '', ''],
        examType: 'Tất cả'
      });
      fetchQuestions();
    } catch (error) {
      toast.error('Lỗi khi thêm câu hỏi');
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!filteredCourse) {
      toast.error('Vui lòng chọn môn học trước khi upload hàng loạt');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        
        const formattedQuestions = jsonData.map((row: any) => ({
          type: row['Loại'] === 'Tự luận' ? 'ESSAY' : 'MULTIPLE_CHOICE',
          content: row['Nội dung'] || '(Chưa nhập nội dung)',
          options: row['Các lựa chọn (cách nhau bởi |)'] ? String(row['Các lựa chọn (cách nhau bởi |)']).split('|') : null,
          correctAnswer: row['Đáp án đúng'] ? String(row['Đáp án đúng']) : null,
          points: parseFloat(row['Điểm'] || 10),
          examType: row['Loại bài thi'] || 'Tất cả'
        }));

        await api.post(`/exams/bank/upload`, {
          courseId: parseInt(filteredCourse),
          questions: formattedQuestions
        });
        
        toast.success('Đã import câu hỏi thành công');
        fetchQuestions();
      } catch (error: any) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Lỗi khi đọc file Excel hoặc lưu dữ liệu');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng?')) return;
    try {
      await api.delete(`/exams/bank/${id}`);
      toast.success('Xóa câu hỏi thành công');
      fetchQuestions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa câu hỏi');
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Loại": "Trắc nghiệm",
        "Nội dung": "Đâu là thủ đô của Việt Nam?",
        "Các lựa chọn (cách nhau bởi |)": "Hà Nội|Hồ Chí Minh|Đà Nẵng|Cần Thơ",
        "Đáp án đúng": "Hà Nội",
        "Điểm": 10,
        "Loại bài thi": "Tất cả"
      },
      {
        "Loại": "Tự luận",
        "Nội dung": "Phân tích nguyên nhân dẫn đến Chiến tranh thế giới thứ hai.",
        "Các lựa chọn (cách nhau bởi |)": "",
        "Đáp án đúng": "",
        "Điểm": 20,
        "Loại bài thi": "Thi cuối kỳ"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Mang_Mau_Cau_Hoi.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* 1. SỬA TOOLBAR CHÍNH: Chuyển breakpoint từ md sang xl để tương thích lượng control lớn */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between xl:items-center mb-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        
        {/* 2. SỬA KHỐI BỘ LỌC BÊN TRÁI: Cho phép tự động wrap (xuống dòng) mượt mà khi thiếu không gian */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <Filter size={18} className="text-slate-400 shrink-0" />
          
          <select 
            className="input-field py-2 m-0 border-none bg-slate-50 cursor-pointer text-sm min-w-[140px]"
            value={filteredCourse}
            onChange={(e) => setFilteredCourse(e.target.value)}
          >
            <option value="">Tất cả môn học</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select 
            className="input-field py-2 m-0 border-none bg-slate-50 cursor-pointer text-sm min-w-[130px]"
            value={filteredExamType}
            onChange={(e) => setFilteredExamType(e.target.value)}
          >
            <option value="">Tất cả bài thi</option>
            <option value="Kiểm tra 15 phút">Thi 15 phút</option>
            <option value="Thi giữa kỳ">Thi giữa kỳ</option>
            <option value="Thi cuối kỳ">Thi cuối kỳ</option>
          </select>
          
          {/* View Mode buttons */}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white shrink-0">
            <button 
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
              title="Dạng lưới"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
              title="Dạng danh sách chi tiết"
            >
              <List size={18} />
            </button>
          </div>
          
          {/* Sort Order buttons */}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white shrink-0">
             <button 
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'none' : 'asc')}
              className={`p-2 transition-colors ${sortOrder === 'asc' ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
              title="Sắp xếp A-Z"
             >
              <SortAsc size={18} />
             </button>
             <button 
              type="button"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'none' : 'desc')}
              className={`p-2 transition-colors ${sortOrder === 'desc' ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
              title="Sắp xếp Z-A"
             >
              <SortDesc size={18} />
             </button>
          </div>
        </div>

        {/* 3. SỬA KHỐI BUTTONS BÊN PHẢI: Đồng bộ hóa breakpoint rộng với xl */}
        <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-start xl:justify-end">
          <button onClick={handleDownloadTemplate} className="btn-secondary py-2 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm">
            <Download size={18}/> Mẫu import
          </button>
          <label className="btn-secondary py-2 flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 text-sm">
            <Upload size={18}/> Import Excel
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleBulkUpload} />
          </label>
          <button onClick={() => setShowAddModal(true)} className="btn-primary py-2 flex items-center gap-2 text-sm">
            <Plus size={18}/> Thêm Câu Hỏi
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"/></div>
      ) : questions.filter(q => !filteredExamType || q.examType === filteredExamType).length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center text-slate-500 bg-white rounded-xl border border-slate-100 shadow-sm">
          <Database size={48} className="mb-4 opacity-30" />
          <p>Chưa có câu hỏi nào thỏa mãn điều kiện lọc</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
          {[...questions]
            .filter(q => !filteredExamType || q.examType === filteredExamType)
            .sort((a, b) => {
               if (sortOrder === 'none') return 0;
               return sortOrder === 'asc' ? a.content.localeCompare(b.content) : b.content.localeCompare(a.content);
            })
            .map(q => (
            <div key={q.id} className="card bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                    q.type === 'MULTIPLE_CHOICE' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {q.type === 'MULTIPLE_CHOICE' ? 'TRẮC NGHIỆM' : 'TỰ LUẬN'}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{q.points} điểm</span>
                </div>
                <p className={`font-medium text-slate-800 mb-2 ${viewMode === 'grid' ? 'line-clamp-3' : ''}`}>{q.content}</p>
                {q.type === 'MULTIPLE_CHOICE' && q.options && (
                  <div className="space-y-1 mt-3">
                    {q.options.map((opt: string, i: number) => (
                      <div key={i} className={`text-xs p-1.5 rounded border ${opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                        {String.fromCharCode(65+i)}. {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-3 mt-4 border-t border-slate-100 flex flex-col gap-1 text-xs text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Môn: {q.course?.name}</span>
                  <button 
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="text-rose-500 hover:text-rose-700 font-medium"
                  >
                    Xóa
                  </button>
                </div>
                <div>Loại: {q.examType || 'Tất cả'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Question Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800">Thêm vào Ngân hàng</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <form onSubmit={handleAddQuestion} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Môn học</label>
                  <select className="input-field w-full border border-slate-200 rounded-lg p-2" value={formData.courseId} onChange={(e) => setFormData({...formData, courseId: e.target.value})}>
                    <option value="">Chọn môn học...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Loại bài thi</label>
                    <select className="input-field w-full border border-slate-200 rounded-lg p-2" value={formData.examType} onChange={(e) => setFormData({...formData, examType: e.target.value})}>
                      <option value="Tất cả">Tất cả</option>
                      <option value="Thi 15 phút">Thi 15 phút</option>
                      <option value="Thi giữa kỳ">Thi giữa kỳ</option>
                      <option value="Thi cuối kỳ">Thi cuối kỳ</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Loại câu hỏi</label>
                    <select className="input-field w-full border border-slate-200 rounded-lg p-2" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                      <option value="ESSAY">Tự luận</option>
                    </select>
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Thang điểm</label>
                    <input type="number" step="0.5" className="input-field w-full border border-slate-200 rounded-lg p-2" value={formData.points} onChange={(e) => setFormData({...formData, points: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung câu hỏi</label>
                  <textarea className="input-field w-full border border-slate-200 rounded-lg p-2 min-h-[100px]" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} />
                </div>
                
                {formData.type === 'MULTIPLE_CHOICE' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <label className="block text-sm font-bold text-slate-700">Các phương án đáp án</label>
                    {[0,1,2,3].map((idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-bold text-slate-400 w-6">{String.fromCharCode(65+idx)}</span>
                        <input 
                          type="text" 
                          className="input-field flex-1 border border-slate-200 rounded-lg p-1.5" 
                          value={formData.options[idx]} 
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                        />
                      </div>
                    ))}
                    <div className="pt-2">
                      <label className="block text-sm font-bold text-slate-700 mb-1">Đáp án đúng (Nhập nguyên văn)</label>
                      <input 
                        type="text" 
                        className="input-field w-full border border-emerald-300 rounded-lg p-2 focus:border-emerald-500 focus:ring-emerald-200" 
                        value={formData.correctAnswer} 
                        onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                
                <button type="submit" className="btn-primary w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">Lưu Câu Hỏi</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}