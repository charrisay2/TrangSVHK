import React, { useState } from 'react';

interface Props {
  onSubmit: (title: string, content: string) => Promise<void>;
}

export const SupportRequestForm: React.FC<Props> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setMessage('Vui lòng nhập đầy đủ tiêu đề và nội dung');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    
    try {
      await onSubmit(title.trim(), content.trim());
      setMessage('Gửi yêu cầu thành công');
      setTitle('');
      setContent('');
    } catch (err: any) {
      setMessage(err.message || 'Gửi yêu cầu thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        data-testid="input-title"
        value={title}
        onChange={e => setTitle(e.target.value)} 
      />
      <textarea 
        data-testid="input-content"
        value={content}
        onChange={e => setContent(e.target.value)} 
      />
      <button 
        type="submit" 
        data-testid="submit-btn" 
        disabled={isSubmitting}
      >
        Gửi
      </button>
      {message && <div data-testid="toast-message">{message}</div>}
    </form>
  );
};
