import { useState, useEffect } from 'react';
import { GraduationCap, Filter, Download, ChevronDown, Award } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { fetchCourses } from '../redux/slices/courseSlice';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Grades() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { classes } = useSelector((state: RootState) => state.courses);

  const [selectedSemester, setSelectedSemester] = useState('All');
  const [grades, setGrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const semesters = ['All', 'Học kỳ 1', 'Học kỳ 2'];

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  useEffect(() => {
    const fetchGrades = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/grades?studentId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setGrades(data);
        }
      } catch (error) {
        console.error('Failed to fetch grades:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGrades();
  }, [user]);
  
  const filteredGrades = selectedSemester === 'All' 
    ? grades 
    : grades.filter(g => g.semester === selectedSemester);

  const handleExportTranscript = () => {
    const doc = new jsPDF();
    const student = user || { name: 'Sinh viên', username: 'SV000000' };

    // Header
    doc.setFontSize(20);
    doc.text('BANG DIEM CA NHAN', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Ho ten: ${student.name}`, 20, 40);
    doc.text(`MSSV: ${(student as any).studentId || student.username}`, 20, 50);
    doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 20, 60);

    // Table
    const tableColumn = ["Mon hoc", "Hoc ky", "Diem QT", "Diem Thi", "Tong ket", "Ket qua"];
    const tableRows = filteredGrades.map(grade => {
      const classInfo = classes.find(c => c.id === grade.courseId);
      const total = (grade.midterm * 0.4 + grade.final * 0.6).toFixed(1);
      const result = parseFloat(total) >= 5.0 ? 'Dat' : 'Khong dat';
      return [
        classInfo?.name || '',
        grade.semester,
        grade.midterm.toString(),
        grade.final.toString(),
        total,
        result
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      theme: 'grid',
      styles: { font: 'helvetica' },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save('bang-diem.pdf');
  };

  // Calculate summary stats
  let totalCredits = 0;
  let totalPoints = 0;
  let passedCredits = 0;

  grades.forEach(grade => {
    const classInfo = classes.find(c => c.id === grade.courseId);
    if (classInfo) {
      const credits = classInfo.credits || 3; // Default to 3 if not set
      const total = grade.midterm * 0.4 + grade.final * 0.6;
      
      totalCredits += credits;
      totalPoints += total * credits;
      
      if (total >= 5.0) {
        passedCredits += credits;
      }
    }
  });

  const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  const gpaNum = parseFloat(gpa);
  let classification = 'Chưa xếp loại';
  if (gpaNum >= 8.5) classification = 'Giỏi';
  else if (gpaNum >= 7.0) classification = 'Khá';
  else if (gpaNum >= 5.5) classification = 'Trung bình';
  else if (gpaNum > 0) classification = 'Yếu';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kết quả học tập</h1>
          <p className="text-slate-500">Theo dõi điểm số và tiến độ học tập của bạn</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportTranscript}
            className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            Xuất bảng điểm
          </button>
          <div className="relative group">
            <select 
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="appearance-none bg-primary text-white px-4 py-2 pr-10 rounded-lg text-sm font-semibold outline-none cursor-pointer hover:bg-blue-800 transition-colors"
            >
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-6 bg-gradient-to-br from-primary to-blue-700 text-white border-none">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Award size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Học lực</span>
          </div>
          <p className="text-3xl font-bold mb-1">{classification}</p>
          <p className="text-sm opacity-80">Xếp loại học tập</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-50 text-primary rounded-lg flex items-center justify-center">
              <GraduationCap size={24} />
            </div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">GPA</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-1">{gpa}</p>
          <p className="text-sm text-slate-500">Điểm trung bình (hệ 10)</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <Award size={24} />
            </div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tín chỉ</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-1">{passedCredits} / {totalCredits}</p>
          <p className="text-sm text-slate-500">Tín chỉ đạt / Tổng đăng ký</p>
        </div>
      </div>

      {/* Grades Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Môn học</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Điểm QT (40%)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Điểm Thi (60%)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tổng kết</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Kết quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Không tìm thấy dữ liệu cho học kỳ này
                  </td>
                </tr>
              ) : (
                filteredGrades.map((grade) => {
                  const classInfo = classes.find(c => c.id === grade.courseId);
                  const total = (grade.midterm * 0.4 + grade.final * 0.6).toFixed(1);
                  return (
                    <tr key={grade.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{classInfo?.name}</p>
                        <p className="text-xs text-slate-400">{grade.semester}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-600">{grade.midterm}</td>
                      <td className="px-6 py-4 text-center font-medium text-slate-600">{grade.final}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-bold ${parseFloat(total) >= 8.0 ? 'text-emerald-600' : parseFloat(total) >= 5.0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {total}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                          parseFloat(total) >= 5.0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {parseFloat(total) >= 5.0 ? 'Đạt' : 'Không đạt'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
