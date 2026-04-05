import { useEffect, useState } from 'react';
import { BookOpen, Users, Clock, MapPin, ChevronRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchCourses } from '../../redux/slices/courseSlice';
import ClassDetail from './ClassDetail';
import { Class } from '../../types';

interface MyClassesProps {
  teacherId: string | number;
}

export default function MyClasses({ teacherId }: MyClassesProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { classes, isLoading, error } = useSelector((state: RootState) => state.courses);
  const [selectedCourse, setSelectedCourse] = useState<Class | null>(null);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  // Filter classes for the current teacher
  // Note: In a real app, the API might filter this, or we filter locally
  const teacherClasses = classes.filter(c => c.teacherId == teacherId);

  if (selectedCourse) {
    return <ClassDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Đang tải danh sách lớp học...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Lỗi: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Lớp học của tôi</h1>
        <p className="text-slate-500">Danh sách các lớp học bạn đang giảng dạy trong học kỳ này</p>
      </div>

      {teacherClasses.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-500">Bạn chưa được phân công lớp học nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teacherClasses.map((c) => (
            <div key={c.id} className="card p-6 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
                  <BookOpen size={24} />
                </div>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                  {c.code}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">{c.name}</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Clock size={16} className="text-primary" />
                  <span>{c.schedule}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <MapPin size={16} className="text-primary" />
                  <span>{c.room?.name || 'Chưa xếp phòng'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Users size={16} className="text-primary" />
                  <span>{c.students ? c.students.length : 0} Sinh viên đã đăng ký</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <img 
                      key={i}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Student${i}`} 
                      className="w-8 h-8 rounded-full border-2 border-white bg-slate-100"
                      alt=""
                    />
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    +{(c.students ? c.students.length : 0)}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCourse(c)}
                  className="text-sm font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  Chi tiết lớp học <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
