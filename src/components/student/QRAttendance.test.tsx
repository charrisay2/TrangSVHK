import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, afterEach } from 'vitest';
import { QRAttendance } from './QRAttendance';


describe('QRAttendance - markAttendance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Should_MarkAttendanceSuccessfully_When_QRCodeIsValid
  test('Should_MarkAttendanceSuccessfully_When_QRCodeIsValid', async () => {
    const mockMarkAttendance = vi.fn().mockResolvedValue(undefined);
    render(<QRAttendance markAttendance={mockMarkAttendance} />);
    
    // QR code hợp lệ
    const input = screen.getByTestId('qr-input');
    fireEvent.change(input, { target: { value: 'VALID_QR_123' } });
    
    // Act
    act(() => {
      fireEvent.click(screen.getByTestId('submit-btn'));
    });
    
    // Assert
    await waitFor(() => {
      // API trả về thành công
      expect(mockMarkAttendance).toHaveBeenCalledTimes(1);
      // Hiển thị thông báo điểm danh thành công
      expect(screen.getByTestId('toast-message')).toHaveTextContent('Điểm danh thành công');
    });
  });

  // 2. Should_ShowError_When_QRCodeIsExpired
  test('Should_ShowError_When_QRCodeIsExpired', async () => {
    // API mock ném lỗi mã hết hạn
    const mockMarkAttendance = vi.fn().mockRejectedValue(new Error('Mã điểm danh đã hết hạn'));
    render(<QRAttendance markAttendance={mockMarkAttendance} />);
    
    // QR code đã hết hạn
    const input = screen.getByTestId('qr-input');
    fireEvent.change(input, { target: { value: 'EXPIRED_QR' } });
    
    // Act
    act(() => {
      fireEvent.click(screen.getByTestId('submit-btn'));
    });
    
    // Assert
    await waitFor(() => {
      // Hiển thị lỗi "Mã điểm danh đã hết hạn"
      expect(screen.getByTestId('toast-message')).toHaveTextContent('Mã điểm danh đã hết hạn');
    });
  });

  // 3. Should_PreventDuplicateAttendance_When_StudentAlreadyMarked
  test('Should_PreventDuplicateAttendance_When_StudentAlreadyMarked', async () => {
    // API mock ném lỗi đã điểm danh
    const mockMarkAttendance = vi.fn().mockRejectedValue(new Error('Bạn đã điểm danh trước đó'));
    render(<QRAttendance markAttendance={mockMarkAttendance} />);
    
    // Student nhập mã
    const input = screen.getByTestId('qr-input');
    fireEvent.change(input, { target: { value: 'VALID_QR_123' } });
    
    // Act
    act(() => {
      fireEvent.click(screen.getByTestId('submit-btn'));
    });
    
    // Assert
    await waitFor(() => {
      // Hiển thị cảnh báo đã điểm danh
      expect(screen.getByTestId('toast-message')).toHaveTextContent('Bạn đã điểm danh trước đó');
    });
  });

  // 4. Should_ShowError_When_ServerFails
  test('Should_ShowError_When_ServerFails', async () => {
    // API/database throw error
    const mockMarkAttendance = vi.fn().mockRejectedValue(new Error('Lỗi máy chủ nội bộ'));
    render(<QRAttendance markAttendance={mockMarkAttendance} />);
    
    const input = screen.getByTestId('qr-input');
    fireEvent.change(input, { target: { value: 'VALID_QR_123' } });
    
    // Act
    act(() => {
      fireEvent.click(screen.getByTestId('submit-btn'));
    });
    
    // Assert
    await waitFor(() => {
      // Hiển thị toast lỗi
      expect(screen.getByTestId('toast-message')).toHaveTextContent('Lỗi máy chủ nội bộ');
      // Không crash ứng dụng và button click lại được
      expect(screen.getByTestId('submit-btn')).not.toBeDisabled();
    });
  });

  // 5. Should_RejectAttendance_When_QRCodeIsInvalid
  test('Should_RejectAttendance_When_QRCodeIsInvalid', async () => {
    const mockMarkAttendance = vi.fn();
    render(<QRAttendance markAttendance={mockMarkAttendance} />);
    
    // QR code sai format (quá ngắn = sai)
    const input = screen.getByTestId('qr-input');
    fireEvent.change(input, { target: { value: '123' } }); 
    
    // Act
    act(() => {
      fireEvent.click(screen.getByTestId('submit-btn'));
    });
    
    // Assert
    // Không gọi API mark attendance
    expect(mockMarkAttendance).not.toHaveBeenCalled();
    // Hiển thị thông báo mã không hợp lệ
    expect(screen.getByTestId('toast-message')).toHaveTextContent('Mã không hợp lệ');
  });
});
