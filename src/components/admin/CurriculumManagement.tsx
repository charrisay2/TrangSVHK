import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import { toast } from "sonner";
export default function CurriculumManagement() {
  const [majors, setMajors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [majorFilter, setMajorFilter] = useState<string>('ALL');
  const [semesterFilter, setSemesterFilter] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingNewMajor, setIsAddingNewMajor] = useState(false);
  const [newMajorName, setNewMajorName] = useState('');
  const [newMajorCode, setNewMajorCode] = useState('');
  const [newMajorDeptId, setNewMajorDeptId] = useState('');

  const [isAddingNewDepartment, setIsAddingNewDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newDepartmentCode, setNewDepartmentCode] = useState('');

  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    majorId: '',
    semesterNumber: 1,
    credits: 3,
    totalPeriods: 45,
    weeks: 10
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [majRes, subRes, deptRes] = await Promise.all([
        api.get('/majors'),
        api.get('/subjects'),
        api.get('/departments')
      ]);
      setMajors(majRes.data);
      setSubjects(subRes.data);
      setDepartments(deptRes.data);
    } catch (err: any) {
      setError('Lỗi khi tải dữ liệu chương trình đào tạo');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const matchMajor = majorFilter === 'ALL' || s.majorId === Number(majorFilter);
    const matchSemester = semesterFilter === 'ALL' || s.semesterNumber === Number(semesterFilter);
    return matchMajor && matchSemester;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let currentMajorId = formData.majorId;
      if (isAddingNewMajor) {
        let currentDeptId = newMajorDeptId;
        if (isAddingNewDepartment) {
          const deptRes = await api.post('/departments', {
            name: newDepartmentName,
            code: newDepartmentCode
          });
          currentDeptId = deptRes.data.id;
        }

        const majorRes = await api.post('/majors', { 
          name: newMajorName, 
          code: newMajorCode,
          departmentId: currentDeptId
        });
        currentMajorId = majorRes.data.id;
        fetchData(); // Refresh majors list
      }

      const dataToSubmit = { ...formData, majorId: currentMajorId };

      if (editingId) {
        await api.put(`/subjects/${editingId}`, dataToSubmit);
      } else {
        await api.post('/subjects', dataToSubmit);
      }
      setIsModalOpen(false);
      setIsAddingNewMajor(false);
      setIsAddingNewDepartment(false);
      setNewMajorName('');
      setNewMajorCode('');
      setNewMajorDeptId('');
      setNewDepartmentName('');
      setNewDepartmentCode('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa môn học này?')) {
      try {
        await api.delete(`/subjects/${id}`);
        fetchData();
      } catch (err) {
        toast.error('Lỗi khi xóa');
      }
    }
  };

  const openEditModal = (sub: any) => {
    setEditingId(sub.id);
    setIsAddingNewMajor(false);
    setIsAddingNewDepartment(false);
    setNewMajorName('');
    setNewMajorCode('');
    setNewMajorDeptId('');
    setNewDepartmentName('');
    setNewDepartmentCode('');
    setFormData({
      code: sub.code,
      name: sub.name,
      majorId: sub.majorId,
      semesterNumber: sub.semesterNumber || 1,
      credits: sub.credits || 3,
      totalPeriods: sub.totalPeriods || 45,
      weeks: sub.weeks || 10
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    setIsAddingNewMajor(false);
    setIsAddingNewDepartment(false);
    setNewMajorName('');
    setNewMajorCode('');
    setNewMajorDeptId('');
    setNewDepartmentName('');
    setNewDepartmentCode('');
    setFormData({
      code: '',
      name: '',
      majorId: majors[0]?.id || '',
      semesterNumber: 1,
      credits: 3,
      totalPeriods: 45,
      weeks: 10
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý chương trình đào tạo</h1>
          <p className="text-slate-500">Quản lý môn học trong khung chương trình cho từng ngành học</p>
        </div>
        <button 
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Thêm môn học
        </button>
      </div>

      <div className="card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={18} className="text-slate-400" />
          <select 
            className="input-field py-2 w-auto"
            value={majorFilter}
            onChange={(e) => setMajorFilter(e.target.value)}
          >
            <option value="ALL">Tất cả ngành</option>
            {majors.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select 
            className="input-field py-2 w-auto"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
          >
            <option value="ALL">Tất cả học kỳ</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Học kỳ {s}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ngành học</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Học kỳ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mã môn</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên môn học</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Số tín chỉ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số tiết</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Số tuần</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredSubjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{sub.major?.name}</td>
                  <td className="px-6 py-4">Học kỳ {sub.semesterNumber || 1}</td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-600">{sub.code}</td>
                  <td className="px-6 py-4 text-slate-800">{sub.name}</td>
                  <td className="px-6 py-4">{sub.credits}</td>
                  <td className="px-6 py-4">{sub.totalPeriods || 45}</td>
                  <td className="px-6 py-4">{sub.weeks || 10}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(sub)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(sub.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredSubjects.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy dữ liệu phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Cập nhật môn học' : 'Thêm môn học mới'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Ngành học</label>
                {!isAddingNewMajor ? (
                  <div className="flex gap-2">
                    <select 
                      required
                      className="input-field flex-1"
                      value={formData.majorId}
                      onChange={(e) => setFormData({...formData, majorId: e.target.value})}
                    >
                      <option value="">Chọn ngành học</option>
                      {majors.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      onClick={() => setIsAddingNewMajor(true)}
                      className="btn-secondary"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">Thêm ngành học mới</p>
                    <input 
                      type="text"
                      placeholder="Mã ngành (VD: IT)"
                      className="input-field"
                      value={newMajorCode}
                      onChange={(e) => setNewMajorCode(e.target.value)}
                      required
                    />
                    <input 
                      type="text"
                      placeholder="Tên ngành mới"
                      className="input-field"
                      value={newMajorName}
                      onChange={(e) => setNewMajorName(e.target.value)}
                      required
                    />
                    
                    {!isAddingNewDepartment ? (
                      <div className="flex gap-2">
                        <select
                          required
                          className="input-field flex-1"
                          value={newMajorDeptId}
                          onChange={(e) => setNewMajorDeptId(e.target.value)}
                        >
                          <option value="">Chọn khoa quản lý</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        <button 
                          type="button"
                          onClick={() => setIsAddingNewDepartment(true)}
                          className="btn-secondary"
                          title="Thêm khoa mới"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 p-3 bg-white rounded-lg border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase">Thêm khoa mới</p>
                        <input 
                          type="text"
                          placeholder="Mã khoa (VD: IT)"
                          className="input-field"
                          value={newDepartmentCode}
                          onChange={(e) => setNewDepartmentCode(e.target.value)}
                          required
                        />
                        <input 
                          type="text"
                          placeholder="Tên khoa mới"
                          className="input-field"
                          value={newDepartmentName}
                          onChange={(e) => setNewDepartmentName(e.target.value)}
                          required
                        />
                        <button 
                          type="button"
                          onClick={() => setIsAddingNewDepartment(false)}
                          className="text-sm text-primary hover:underline"
                        >
                          Hủy, chọn khoa có sẵn
                        </button>
                      </div>
                    )}

                    <button 
                      type="button"
                      onClick={() => {
                        setIsAddingNewMajor(false);
                        setIsAddingNewDepartment(false);
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Hủy, chọn ngành có sẵn
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Mã môn học</label>
                <input 
                  type="text"
                  required
                  className="input-field"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="VD: IT101"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tên môn học</label>
                <input 
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="VD: Lập trình cơ bản"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Học kỳ</label>
                <select 
                  required
                  className="input-field"
                  value={formData.semesterNumber}
                  onChange={(e) => setFormData({...formData, semesterNumber: Number(e.target.value)})}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Học kỳ {s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Số tín chỉ</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    max="10"
                    className="input-field"
                    value={formData.credits}
                    onChange={(e) => setFormData({...formData, credits: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tổng số tiết</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    className="input-field"
                    value={formData.totalPeriods}
                    onChange={(e) => setFormData({...formData, totalPeriods: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Số tuần</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    className="input-field"
                    value={formData.weeks}
                    onChange={(e) => setFormData({...formData, weeks: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white py-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                >
                  {editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
