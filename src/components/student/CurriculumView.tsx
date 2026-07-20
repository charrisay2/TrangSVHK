import { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Clock, CheckCircle2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import api from '../../services/api';

export default function CurriculumView() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [major, setMajor] = useState<any>(null);

  useEffect(() => {
    const fetchCurriculum = async () => {
      if (!user?.majorId) return;
      try {
        const [currRes, majorRes] = await Promise.all([
          api.get('/curriculums'),
          api.get(`/majors/${user.majorId}`)
        ]);
        
        // Filter curriculum by student's major
        const filtered = currRes.data
          .filter((c: any) => c.majorId === user.majorId)
          .sort((a: any, b: any) => a.semesterNumber - b.semesterNumber);
          
        setCurriculum(filtered);
        setMajor(majorRes.data);
      } catch (error) {
        console.error('Error fetching curriculum:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurriculum();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Group by semester
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BookOpen size={120} className="text-primary" />
        </div>
        <div className="relative z-10">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">Học tập</span>
          <h1 className="text-3xl font-bold text-slate-800 mt-2">Chương trình khung</h1>
          <p className="text-slate-500 mt-1 max-w-2xl text-lg">
            Khám phá lộ trình học tập của chuyên ngành <span className="text-primary font-semibold">{major?.name}</span> qua 8 học kỳ.
          </p>
          
          <div className="flex flex-wrap gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Thời gian</p>
                <p className="text-sm font-bold text-slate-700">4 Năm (8 Học kỳ)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <GraduationCap size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Học vị</p>
                <p className="text-sm font-bold text-slate-700">Cử nhân/Kỹ sư</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {semesters.map((semNum) => {
          const semCurriculum = curriculum.filter(c => c.semesterNumber === semNum);
          return (
            <div key={semNum} className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-8 h-8 bg-slate-800 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                  {semNum}
                </div>
                <h2 className="font-bold text-slate-700 capitalize">Học kỳ {semNum}</h2>
              </div>
              
              <div className="space-y-2">
                {semCurriculum.length > 0 ? semCurriculum.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.subject.code}</span>
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] rounded font-bold">{item.subject.credits} TC</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {item.subject.name}
                    </h3>
                  </div>
                )) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center">
                    <p className="text-xs text-slate-400 italic">Dữ liệu đang cập nhật</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-900 rounded-3xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold mb-2">Lưu ý quan trọng cho Sinh viên</h2>
            <p className="text-blue-100 opacity-80 leading-relaxed text-sm">
              Đây là chương trình khung dự kiến. Sinh viên cần theo dõi thông báo đăng ký học phần mỗi kỳ để chọn môn học phù hợp với tiến độ và điều kiện tiên quyết của từng môn học.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="text-emerald-400" size={20} />
              <span>Chương trình chuẩn</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="text-emerald-400" size={20} />
              <span>Cập nhật 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
