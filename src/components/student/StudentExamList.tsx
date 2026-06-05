import React, { useState, useEffect } from 'react';

interface Exam {
  id: string;
  name: string;
}

interface Props {
  apiFetchExams: () => Promise<Exam[]>;
}

export const StudentExamList: React.FC<Props> = ({ apiFetchExams }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadExams = async () => {
      try {
        setLoading(true);
        const data = await apiFetchExams();
        if (mounted) {
          setExams(data);
          setError('');
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Lỗi tải bài thi');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadExams();
    return () => { mounted = false; };
  }, [apiFetchExams]);

  if (loading) return <div data-testid="loading-spinner">Đang tải...</div>;
  if (error) return <div data-testid="toast-message">{error}</div>;
  if (exams.length === 0) return <div data-testid="empty-message">Không có bài thi</div>;

  return (
    <ul data-testid="exam-list">
      {exams.map(ex => <li key={ex.id}>{ex.name}</li>)}
    </ul>
  );
};
