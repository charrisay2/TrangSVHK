import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, afterEach } from 'vitest';
import { StudentExamList } from './StudentExamList';


describe('fetchExams', () => {
  // 1
  test('Should_LoadExamListSuccessfully_When_ApiReturnsData', async () => {
    const mockExams = [{ id: '1', name: 'Toán cao cấp' }];
    const apiFetchExams = vi.fn().mockResolvedValue(mockExams);
    render(<StudentExamList apiFetchExams={apiFetchExams} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('exam-list')).toBeInTheDocument();
      expect(screen.getByText('Toán cao cấp')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  // 2
  test('Should_ShowEmptyMessage_When_NoExamsReturned', async () => {
    const apiFetchExams = vi.fn().mockResolvedValue([]);
    render(<StudentExamList apiFetchExams={apiFetchExams} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('empty-message')).toHaveTextContent('Không có bài thi');
    });
  });

  // 3
  test('Should_ShowErrorMessage_When_ApiFails', async () => {
    const apiFetchExams = vi.fn().mockRejectedValue(new Error('Lỗi kết nối máy chủ'));
    render(<StudentExamList apiFetchExams={apiFetchExams} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('toast-message')).toHaveTextContent('Lỗi kết nối máy chủ');
    });
  });

  // 4
  test('Should_DisplayLoading_When_FetchingExams', () => {
    const apiFetchExams = vi.fn().mockImplementation(() => new Promise(() => {}));
    render(<StudentExamList apiFetchExams={apiFetchExams} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  // 5
  test('Should_CallApiOnlyOnce_When_ComponentMounted', async () => {
    const apiFetchExams = vi.fn().mockResolvedValue([]);
    render(<StudentExamList apiFetchExams={apiFetchExams} />);
    
    await waitFor(() => {
      expect(apiFetchExams).toHaveBeenCalledTimes(1);
    });
  });
});
