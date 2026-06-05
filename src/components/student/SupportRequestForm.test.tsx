import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, afterEach } from 'vitest';
import { SupportRequestForm } from './SupportRequestForm';


describe('handleSubmit', () => {
  // 1
  test('Should_SendRequestSuccessfully_When_DataIsValid', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SupportRequestForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByTestId('input-title'), { target: { value: 'Lỗi bài thi' } });
    fireEvent.change(screen.getByTestId('input-content'), { target: { value: 'Bài thi không hiện' } });
    
    act(() => {
      fireEvent.click(screen.getByTestId('submit-btn'));
    });
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('toast-message')).toHaveTextContent('Gửi yêu cầu thành công');
      expect(screen.getByTestId('input-title')).toHaveValue('');
      expect(screen.getByTestId('input-content')).toHaveValue('');
    });
  });

  // 2
  test('Should_ShowValidationError_When_RequiredFieldsAreEmpty', async () => {
    const mockOnSubmit = vi.fn();
    render(<SupportRequestForm onSubmit={mockOnSubmit} />);
    
    act(() => {
      fireEvent.click(screen.getByTestId('submit-btn'));
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('toast-message')).toHaveTextContent('Vui lòng nhập đầy đủ tiêu đề và nội dung');
  });

  // 3
  test('Should_ShowErrorMessage_When_ApiFails', async () => {
    const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Không kết nối được server'));
    render(<SupportRequestForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByTestId('input-title'), { target: { value: 'Title 1' } });
    fireEvent.change(screen.getByTestId('input-content'), { target: { value: 'Content 1' } });
    
    act(() => {
      fireEvent.click(screen.getByTestId('submit-btn'));
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('toast-message')).toHaveTextContent('Không kết nối được server');
      expect(screen.getByTestId('input-title')).toHaveValue('Title 1');
    });
  });

  // 4
  test('Should_DisableSubmitButton_When_RequestIsSubmitting', async () => {
    const mockOnSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<SupportRequestForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByTestId('input-title'), { target: { value: 'Title 1' } });
    fireEvent.change(screen.getByTestId('input-content'), { target: { value: 'Content 1' } });
    
    const submitBtn = screen.getByTestId('submit-btn');
    act(() => {
      fireEvent.click(submitBtn);
    });
    
    expect(submitBtn).toBeDisabled();
    
    act(() => {
        fireEvent.click(submitBtn);
    });
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    
    await waitFor(() => {
        expect(submitBtn).not.toBeDisabled();
    });
  });

  // 5
  test('Should_TrimInputBeforeSubmitting_When_UserInputsExtraSpaces', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SupportRequestForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByTestId('input-title'), { target: { value: '   My Title   ' } });
    fireEvent.change(screen.getByTestId('input-content'), { target: { value: '  My Content  ' } });
    
    act(() => {
      fireEvent.click(screen.getByTestId('submit-btn'));
    });
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('My Title', 'My Content');
    });
  });
});
