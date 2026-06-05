import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, afterEach } from 'vitest';
import { AdminExcelImport } from './AdminExcelImport';

describe('handleImport', () => {
  // 1
  test('Should_ImportSuccessfully_When_ExcelFileIsValid', async () => {
    const mockApiImport = vi.fn().mockResolvedValue({ importedCount: 10 });
    render(<AdminExcelImport apiImport={mockApiImport} />);
    
    const file = new File(['valid'], 'data.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });
    
    act(() => {
      fireEvent.click(screen.getByTestId('import-btn'));
    });
    
    await waitFor(() => {
      expect(mockApiImport).toHaveBeenCalledWith(file);
      expect(screen.getByTestId('toast-message')).toHaveTextContent('Nhập thành công 10 bản ghi');
    });
  });

  // 2
  test('Should_ShowError_When_FileFormatIsInvalid', async () => {
    const mockApiImport = vi.fn();
    render(<AdminExcelImport apiImport={mockApiImport} />);
    
    const file = new File(['code'], 'script.js', { type: 'text/javascript' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });
    
    expect(mockApiImport).not.toHaveBeenCalled();
    expect(screen.getByTestId('toast-message')).toHaveTextContent('Lỗi định dạng file');
  });

  // 3
  test('Should_PreventImport_When_FileIsEmpty', async () => {
    const mockApiImport = vi.fn();
    render(<AdminExcelImport apiImport={mockApiImport} />);
    
    // Simulate empty file (size 0)
    const file = new File([], 'empty.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });
    
    act(() => {
      fireEvent.click(screen.getByTestId('import-btn'));
    });
    
    expect(mockApiImport).not.toHaveBeenCalled();
    expect(screen.getByTestId('toast-message')).toHaveTextContent('File không có dữ liệu');
  });

  // 4
  test('Should_ShowError_When_ImportApiFails', async () => {
    const mockApiImport = vi.fn().mockRejectedValue(new Error('Server Error'));
    render(<AdminExcelImport apiImport={mockApiImport} />);
    
    const file = new File(['valid'], 'data.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });
    
    act(() => {
      fireEvent.click(screen.getByTestId('import-btn'));
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('toast-message')).toHaveTextContent('Server Error');
      // Không reset dữ liệu preview
      expect(screen.getByTestId('preview-data')).toBeInTheDocument();
    });
  });

  // 5
  test('Should_ClearPreviewData_When_ImportCompletesSuccessfully', async () => {
    const mockApiImport = vi.fn().mockResolvedValue({ importedCount: 5 });
    render(<AdminExcelImport apiImport={mockApiImport} />);
    
    const file = new File(['valid'], 'data.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });
    
    // Check preview data is there initially
    expect(screen.getByTestId('preview-data')).toBeInTheDocument();
    
    act(() => {
      fireEvent.click(screen.getByTestId('import-btn'));
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('preview-data')).not.toBeInTheDocument();
      // Import success implies status is idle (btn enabled)
      expect(screen.getByTestId('import-btn')).not.toBeDisabled();
    });
  });
});
