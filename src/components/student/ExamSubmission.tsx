import React, { useState, useEffect, useRef } from 'react';

interface Props {
  onSubmit: (answers: Record<string, string>) => Promise<void>;
  initialTimeLeft: number;
  onFinished?: () => void;
}

export const ExamSubmission: React.FC<Props> = ({ onSubmit, initialTimeLeft, onFinished }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [message, setMessage] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  // Count down timer
  useEffect(() => {
    if (timeLeft <= 0) {
      if (!isSubmittingRef.current && !isFinished) {
        handleSubmit();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmit = async () => {
    // Không cho submit khi chưa có đáp án (mà thời gian vẫn còn)
    if (Object.keys(answers).length === 0 && timeLeft > 0) {
      setMessage('Vui lòng chọn đáp án trước khi nộp');
      return;
    }

    // Không gọi API nhiều lần
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setMessage('');

    try {
      await onSubmit(answers);
      setMessage('Nộp bài thành công');
      setIsFinished(true); // Khóa bài thi
      if (onFinished) onFinished(); // Điều hướng
    } catch (error) {
      setMessage('Nộp bài thất bại');
      isSubmittingRef.current = false;
      setIsSubmitting(false); // Cho phép nộp lại nếu thất bại, giữ nguyên answers
    }
  };

  return (
    <div>
      <div>Thời gian còn lại: {timeLeft}s</div>
      {message && <div data-testid="toast-message">{message}</div>}
      
      {!isFinished && (
        <button 
          onClick={() => setAnswers({ '1': 'A' })}
          disabled={isSubmitting}
        >
          Chọn Câu A
        </button>
      )}

      <div data-testid="answers-count">{Object.keys(answers).length}</div>

      <button 
        onClick={handleSubmit} 
        disabled={isSubmitting || isFinished}
        data-testid="submit-btn"
      >
        {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
      </button>
    </div>
  );
};
