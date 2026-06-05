import React, { useState } from 'react';

interface Props {
  markAttendance: (qrCode: string) => Promise<void>;
}

export const QRAttendance: React.FC<Props> = ({ markAttendance }) => {
  const [qrCode, setQrCode] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Should_RejectAttendance_When_QRCodeIsInvalid
    if (!qrCode || qrCode.trim() === '' || qrCode.length < 5) {
      setMessage('Mã không hợp lệ');
      return;
    }

    setIsSubmitting(true);
    try {
      await markAttendance(qrCode);
      setMessage('Điểm danh thành công'); // Should_MarkAttendanceSuccessfully_When_QRCodeIsValid
    } catch (error: any) {
      // Handle various errors: expired, duplicate, server error
      setMessage(error.message || 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <input 
        placeholder="Nhập mã QR"
        data-testid="qr-input"
        value={qrCode}
        onChange={(e) => setQrCode(e.target.value)}
      />
      <button 
        data-testid="submit-btn" 
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Đang xử lý...' : 'Điểm danh'}
      </button>
      
      {message && <div data-testid="toast-message">{message}</div>}
    </div>
  );
};
