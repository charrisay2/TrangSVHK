import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, afterEach } from 'vitest';
import { ExamSubmission } from './ExamSubmission';

describe('ExamSubmission - handleSubmit', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Nộp bài thành công khi dữ liệu hợp lệ
  test('Should_NavigateAndLockExam_When_SubmitSuccessfully', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const mockOnFinished = vi.fn();
    render(<ExamSubmission onSubmit={mockOnSubmit} onFinished={mockOnFinished} initialTimeLeft={60} />);
    
    // Student đã trả lời câu hỏi
    fireEvent.click(screen.getByText('Chọn Câu A'));
    
    // Act
    act(() => {
        fireEvent.click(screen.getByTestId('submit-btn'));
    });
    
    // Assert 
    await waitFor(() => {
      // API submit thành công
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      
      // Hiển thị thông báo thành công
      expect(screen.getByTestId('toast-message')).toHaveTextContent('Nộp bài thành công');
      
      // Điều hướng sang trang kết quả hoặc khóa bài thi
      expect(mockOnFinished).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('submit-btn')).toBeDisabled();
      expect(screen.queryByText('Chọn Câu A')).not.toBeInTheDocument();
    });
  });

  // 2. Không cho nộp bài khi chưa làm câu nào
  test('Should_ShowWarningAndNotSubmit_When_NoAnswersProvided', async () => {
    const mockOnSubmit = vi.fn();
    render(<ExamSubmission onSubmit={mockOnSubmit} initialTimeLeft={60} />);
    
    // Act - Kích vào nút nộp bài khi answers đang rỗng
    act(() => {
        fireEvent.click(screen.getByTestId('submit-btn'));
    });
    
    // Assert
    // Không gọi API submit
    expect(mockOnSubmit).not.toHaveBeenCalled();
    // Hiển thị cảnh báo yêu cầu làm bài trước
    expect(screen.getByTestId('toast-message')).toHaveTextContent('Vui lòng chọn đáp án trước khi nộp');
  });

  // 3. Xử lý lỗi khi API submit thất bại
  test('Should_ShowErrorAndKeepAnswers_When_ApiSubmitFails', async () => {
    const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Internal Server Error'));
    const mockOnFinished = vi.fn();
    render(<ExamSubmission onSubmit={mockOnSubmit} onFinished={mockOnFinished} initialTimeLeft={60} />);
    
    // Student đã trả lời câu hỏi
    fireEvent.click(screen.getByText('Chọn Câu A'));
    
    // Act
    act(() => {
        fireEvent.click(screen.getByTestId('submit-btn'));
    });
    
    // Assert
    await waitFor(() => {
      // Hiển thị toast lỗi
      expect(screen.getByTestId('toast-message')).toHaveTextContent('Nộp bài thất bại');
      
      // Không chuyển trang (onFinished không được gọi)
      expect(mockOnFinished).not.toHaveBeenCalled();
      
      // Không mất dữ liệu answers hiện tại (vẫn là 1 đáp án)
      expect(screen.getByTestId('answers-count')).toHaveTextContent('1');
      
      // Nút submit có thể click lại
      expect(screen.getByTestId('submit-btn')).not.toBeDisabled();
    });
  });

  // 4. Không cho submit nhiều lần liên tiếp
  test('Should_DisableButtonAndCallApiOnce_When_UserSpamsSubmit', async () => {
    const mockOnSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<ExamSubmission onSubmit={mockOnSubmit} initialTimeLeft={60} />);
    
    // Chọn đáp án
    fireEvent.click(screen.getByText('Chọn Câu A'));
    const submitBtn = screen.getByTestId('submit-btn');
    
    // Act - User click nút submit nhiều lần liên tiếp
    act(() => {
        fireEvent.click(submitBtn);
        fireEvent.click(submitBtn);
        fireEvent.click(submitBtn);
    });
    
    // Assert
    // API chỉ được gọi 1 lần
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    
    // Button bị disable khi đang submit
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent('Đang nộp...');
    
    // Đợi API xử lý xong
    await waitFor(() => {
      expect(screen.getByTestId('toast-message')).toHaveTextContent('Nộp bài thành công');
    });
  });

  // 5. Tự động submit khi hết thời gian làm bài
  test('Should_AutoSubmit_When_TimerReachesZero', async () => {
    vi.useFakeTimers();
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    // Timer bắt đầu với 2 giây
    render(<ExamSubmission onSubmit={mockOnSubmit} initialTimeLeft={2} />);
    
    // Act
    act(() => {
      // Hết thời gian làm bài (Timer = 0)
      vi.advanceTimersByTime(2000);
    });
    vi.useRealTimers();
    
    // Assert
    await waitFor(() => {
      // handleSubmit được gọi tự động và gửi bài thi lên server
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('toast-message')).toHaveTextContent('Nộp bài thành công');
    });
  });
});
