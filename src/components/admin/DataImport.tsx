import { useState, useRef } from 'react';
import { Upload, FileDown, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import api from '../../services/api';

export default function DataImport() {
  const [dataPreview, setDataPreview] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [targetTable, setTargetTable] = useState<'users' | 'curriculum' | 'courses' | 'subjects'>('users');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length > 0) {
          setColumns(Object.keys(data[0] as object));
          setDataPreview(data);
          setImportStatus('idle');
        } else {
          toast.error('File Excel không có dữ liệu');
        }
      } catch (err) {
        toast.error('Không thể đọc file Excel');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (dataPreview.length === 0) return;
    setImportStatus('processing');

    try {
      const response = await api.post(`/import/${targetTable}`, { data: dataPreview });
      
      setImportStatus('success');
      toast.success(`Đã nhập thành công ${dataPreview.length} bản ghi`);
      setTimeout(() => {
         setDataPreview([]);
         setImportStatus('idle');
         if(fileInputRef.current) fileInputRef.current.value = '';
      }, 3000);
    } catch (error: any) {
      setImportStatus('error');
      toast.error(error.response?.data?.message || 'Lỗi khi nhập dữ liệu');
    }
  };

  const downloadTemplate = () => {
    let templateData = [{}];
    let filename = 'template.xlsx';

    switch (targetTable) {
      case 'users':
        templateData = [{ 
          name: 'Nguyễn Văn A', 
          phone: '0912345678',
          address: 'Hà Nội',
          role: 'STUDENT', 
          majorName: 'Công nghệ thông tin',
          departmentName: 'Khoa Công nghệ thông tin',
          className: 'CT0101' 
        }];
        filename = 'users_template.xlsx';
        break;
      case 'courses':
        templateData = [{ 
          name: 'Toán cao cấp 1', 
          code: 'TCC1', 
          teacherEmail: 'teacher@vaa.edu.vn', 
          credits: 3, 
          majorName: 'Công nghệ thông tin', 
          className: 'CT0101',
          type: 'Standard',
          schedule: 'Thứ Hai (07:00 - 09:30)',
          startDate: '2024-09-01',
          endDate: '2024-12-31'
        }];
        filename = 'courses_template.xlsx';
        break;
      case 'curriculum':
        templateData = [{ 
          majorName: 'Công nghệ thông tin', 
          subjectCode: 'TCC1', 
          semesterNumber: 1 
        }];
        filename = 'curriculum_template.xlsx';
        break;
      case 'subjects':
        templateData = [{ 
          name: 'Toán cao cấp 1', 
          credits: 3, 
          majorName: 'Công nghệ thông tin',
          semesterNumber: 1,
          totalPeriods: 45,
          weeks: 10
        }];
        filename = 'subjects_template.xlsx';
        break;
    }

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="text-indigo-600"/> Import dữ liệu Excel
        </h1>
        <p className="text-slate-500">Nhập dữ liệu hàng loạt từ file Excel vào hệ thống</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-slate-800 mb-4">Cấu hình Import</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Loại dữ liệu</label>
                <select 
                  className="input-field"
                  value={targetTable}
                  onChange={(e) => setTargetTable(e.target.value as any)}
                >
                  <option value="users">Tài khoản & Người dùng</option>
                  <option value="courses">Học phần</option>
                  <option value="curriculum">Chương trình đào tạo</option>
                  <option value="subjects">Môn học gốc (Áp dụng theo từng Ngành)</option>
                </select>
              </div>

              <div className="pt-2">
                <button 
                  onClick={downloadTemplate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  <FileDown size={18} />
                  Tải file mẫu
                </button>
              </div>
            </div>
          </div>

          <div className="card p-6 border-dashed border-2 border-indigo-200 bg-indigo-50/50">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-indigo-400 mb-3" />
              <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md bg-white px-3 font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                >
                  <span>Tải lên file Excel</span>
                  <input id="file-upload" name="file-upload" type="file" accept=".xlsx, .xls" className="sr-only" onChange={handleFileUpload} ref={fileInputRef}/>
                </label>
              </div>
              <p className="text-xs leading-5 text-slate-500 mt-2">Dung lượng tối đa 10MB</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="card h-full flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Bản xem trước dữ liệu</h3>
              {dataPreview.length > 0 && (
                <span className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
                  {dataPreview.length} dòng
                </span>
              )}
            </div>

            <div className="flex-1 p-4 bg-slate-50 min-h-[300px] overflow-auto">
              {dataPreview.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <FileSpreadsheet size={48} className="mb-4 opacity-50" />
                  <p>Hãy tải lên một file để xem trước dữ liệu</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                          {columns.slice(0, 8).map((col, idx) => (
                            <th key={idx} className="px-4 py-3 whitespace-nowrap">{col}</th>
                          ))}
                          {columns.length > 8 && <th className="px-4 py-3">...</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {dataPreview.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-100/50 hover:bg-slate-50">
                            {columns.slice(0, 8).map((col, cIdx) => (
                              <td key={cIdx} className="px-4 py-3 truncate max-w-[150px]">{String(row[col] || '')}</td>
                            ))}
                            {columns.length > 8 && <td className="px-4 py-3 text-slate-400">...</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {dataPreview.length > 10 && (
                    <div className="p-3 text-center border-t border-slate-100 text-sm text-slate-500 bg-slate-50">
                      Hiển thị 10 dòng đầu tiên
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white rounded-b-xl">
              <div className="flex items-center gap-2">
                {importStatus === 'processing' && <div className="animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full" />}
                {importStatus === 'success' && <CheckCircle className="text-emerald-500" size={20} />}
                {importStatus === 'error' && <AlertTriangle className="text-rose-500" size={20} />}
                <span className={`text-sm font-medium ${
                  importStatus === 'success' ? 'text-emerald-600' :
                  importStatus === 'error' ? 'text-rose-600' :
                  'text-slate-600'
                }`}>
                  {importStatus === 'processing' ? 'Đang xử lý...' :
                   importStatus === 'success' ? 'Nhập dữ liệu thành công!' :
                   importStatus === 'error' ? 'Có lỗi xảy ra!' : ''}
                </span>
              </div>

              <button 
                onClick={handleImport}
                disabled={dataPreview.length === 0 || importStatus === 'processing'}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tiến hành Nhập dữ liệu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
