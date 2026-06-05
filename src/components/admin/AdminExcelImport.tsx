import React, { useState } from 'react';

interface Props {
  apiImport: (file: File) => Promise<{ importedCount: number }>;
}

export const AdminExcelImport: React.FC<Props> = ({ apiImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [previewData, setPreviewData] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'importing'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.xlsx')) {
        setMessage('Lỗi định dạng file');
        setFile(null);
        setPreviewData([]);
        return;
      }
      setFile(selected);
      // Giả lập đọc preview
      if (selected.size === 0) {
        setPreviewData([]);
      } else {
        setPreviewData(['Row 1', 'Row 2']);
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    if (previewData.length === 0) {
      setMessage('File không có dữ liệu');
      return;
    }

    setStatus('importing');
    setMessage('');
    try {
      const res = await apiImport(file);
      setMessage(`Nhập thành công ${res.importedCount} bản ghi`);
      setPreviewData([]);
      setStatus('idle');
      setFile(null);
    } catch (err: any) {
      setMessage(err.message || 'Import lỗi');
      setStatus('idle');
    }
  };

  return (
    <div>
      <input 
        type="file" 
        data-testid="file-input" 
        onChange={handleFileChange} 
      />
      {previewData.length > 0 && <div data-testid="preview-data">Có dữ liệu preview</div>}
      <button 
        data-testid="import-btn" 
        onClick={handleImport}
        disabled={status === 'importing'}
      >
        Import
      </button>
      {message && <div data-testid="toast-message">{message}</div>}
    </div>
  );
};
