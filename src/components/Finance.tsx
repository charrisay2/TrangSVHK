import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Wallet,
  CreditCard,
  History,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  QrCode,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { fetchInvoices, payInvoice } from "../redux/slices/invoiceSlice";
import { Invoice } from "../types";
import api from "../services/api";
import { toast } from "sonner"; // Dùng toast cho xịn

// Khai báo kiểu dữ liệu cho phiên thanh toán (Hỗ trợ cả thanh toán lẻ và thanh toán gộp)
interface PaymentSession {
  isBulk: boolean;
  invoices: Invoice[];
  totalAmount: number;
}

export default function Finance() {
  const dispatch = useDispatch<AppDispatch>();
  const { invoices, isLoading } = useSelector(
    (state: RootState) => state.invoices,
  );

  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"vietqr" | "mock">(
    "vietqr",
  );

  // Xử lý kết quả trả về từ PayOS
  useEffect(() => {
    const processPaymentReturn = async () => {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("status");
      const code = params.get("code");
      const cancel = params.get("cancel");

      // Nếu thanh toán Thành công
      if ((status === "PAID" || code === "00") && cancel !== "true") {
        const storedIdsStr = localStorage.getItem("pendingInvoiceIds");

        if (storedIdsStr) {
          const ids = JSON.parse(storedIdsStr);
          // Lặp qua mảng ID để đánh dấu Đã nộp cho tất cả hóa đơn trong phiên
          for (const id of ids) {
            await dispatch(payInvoice(id));
          }
          toast.success("Thanh toán thành công qua PayOS!");
          localStorage.removeItem("pendingInvoiceIds");
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname + "?module=finance",
          );
        }
      }
      // Nếu user bấm Hủy
      else if (cancel === "true" || status === "CANCELLED") {
        toast.error("Bạn đã hủy giao dịch thanh toán.");
        localStorage.removeItem("pendingInvoiceIds");
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + "?module=finance",
        );
      }

      dispatch(fetchInvoices());
    };

    processPaymentReturn();
  }, [dispatch]);

  const unpaidInvoices = invoices.filter((inv) => inv.status === "Unpaid");
  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // NÚT THANH TOÁN TẤT CẢ
  const handlePayAll = () => {
    if (unpaidInvoices.length === 0) {
      toast.info("Bạn không có khoản nợ nào cần thanh toán!");
      return;
    }
    setPaymentSession({
      isBulk: true,
      invoices: unpaidInvoices,
      totalAmount: unpaidTotal,
    });
  };

  // NÚT THANH TOÁN LẺ TỪNG DÒNG
  const handlePaySingle = (inv: Invoice) => {
    setPaymentSession({
      isBulk: false,
      invoices: [inv],
      totalAmount: inv.amount,
    });
  };

  const handlePayment = async () => {
    if (!paymentSession) return;

    setIsProcessing(true);

    if (paymentMethod === "mock") {
      // Demo: Chạy vòng lặp thanh toán hết
      for (const inv of paymentSession.invoices) {
        await dispatch(payInvoice(inv.id));
      }
      setPaymentSession(null);
      toast.success("Thanh toán mô phỏng thành công!");
      dispatch(fetchInvoices());
    } else if (paymentMethod === "vietqr") {
      try {
        // Lưu MẢNG các ID cần thanh toán vào LocalStorage
        const ids = paymentSession.invoices.map((i) => i.id);
        localStorage.setItem("pendingInvoiceIds", JSON.stringify(ids));

        // Lấy ID đầu tiên làm mã tham chiếu cho PayOS
        const mainId = paymentSession.invoices[0].id;
        const pseudoId = paymentSession.isBulk
          ? Number(`999${mainId}`)
          : mainId;

        const res = await api.post("/payments/payos/create", {
          invoiceId: pseudoId,
          amount: paymentSession.totalAmount,
          description: paymentSession.isBulk
            ? "THANH TOAN TOAN BO HOC PHI"
            : `HOC PHI ${mainId}`,
        });

        if (res.data && res.data.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
        } else {
          toast.error("Lỗi: Không lấy được link thanh toán từ PayOS");
        }
      } catch (error) {
        console.error(error);
        toast.error("Có lỗi xảy ra khi kết nối với server thanh toán!");
      }
    }

    setIsProcessing(false);
  };

  const bankBin = "970436";
  const bankAccount = "1234567890";
  const accountName = "TRUONG DAI HOC EDU PORTAL";
  const qrDesc = paymentSession?.isBulk
    ? "NOP TOAN BO HOC PHI"
    : `NOP HOC PHI ${paymentSession?.invoices[0]?.id}`;

  const qrUrl = paymentSession
    ? `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact.jpg?amount=${paymentSession.totalAmount}&addInfo=${encodeURIComponent(qrDesc)}&accountName=${encodeURIComponent(accountName)}`
    : "";

  return (
    <div className="space-y-6">
      {paymentSession &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-primary p-6 text-white flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">Thanh toán học phí</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {paymentSession.isBulk
                      ? `Gộp ${paymentSession.invoices.length} hóa đơn`
                      : `Mã hóa đơn: ${paymentSession.invoices[0].id}`}
                  </p>
                </div>
                <button
                  onClick={() => setPaymentSession(null)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">
                      Số tiền cần thanh toán
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(paymentSession.totalAmount)}
                    </p>
                  </div>

                  <div className="pt-2">
                    <p className="font-semibold text-slate-800 mb-3 text-sm">
                      Chọn phương thức
                    </p>
                    <div className="space-y-2">
                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "vietqr" ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"}`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          className="hidden"
                          checked={paymentMethod === "vietqr"}
                          onChange={() => setPaymentMethod("vietqr")}
                        />
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                          <QrCode size={18} />
                        </div>
                        <span className="font-medium text-sm">
                          App Ngân hàng (VietQR)
                        </span>
                      </label>

                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "mock" ? "border-slate-400 bg-slate-50" : "border-slate-100 hover:border-slate-200"}`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          className="hidden"
                          checked={paymentMethod === "mock"}
                          onChange={() => setPaymentMethod("mock")}
                        />
                        <div className="w-8 h-8 bg-slate-200 text-slate-500 rounded-lg flex items-center justify-center">
                          <CreditCard size={18} />
                        </div>
                        <span className="font-medium text-sm">Chế độ Demo</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center text-center border border-slate-100">
                  {paymentMethod === "vietqr" ? (
                    <>
                      <img
                        src={qrUrl}
                        alt="VietQR"
                        className="w-48 h-48 mix-blend-multiply mb-3"
                      />
                      <p className="text-xs text-slate-500 font-medium">
                        Mở App Ngân hàng bất kỳ để quét mã.
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Hệ thống sẽ tự động chuyển trang khi nhấn Thanh toán
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mb-3">
                        <AlertCircle size={32} />
                      </div>
                      <p className="text-sm font-medium text-slate-700">
                        Chế độ Mô phỏng
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Dùng để test tính năng gộp hóa đơn.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-primary hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : paymentMethod === "vietqr" ? (
                    "Tiến hành thanh toán PayOS"
                  ) : (
                    "Tiến hành thanh toán"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Học phí & Tài chính
          </h1>
          <p className="text-slate-500">
            Quản lý các khoản phí và lịch sử thanh toán
          </p>
        </div>
        {/* NÚT THANH TOÁN TẤT CẢ */}
        <button
          onClick={handlePayAll}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/30"
        >
          <CreditCard size={18} />
          Thanh toán tất cả
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="lg:col-span-3 py-12 text-center text-slate-500">
            <div className="flex justify-center items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Đang tải dữ liệu...
            </div>
          </div>
        ) : (
          <>
            <div className="lg:col-span-1 space-y-6">
              <div className="card p-6 bg-primary text-white border-none relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
                    Tổng công nợ hiện tại
                  </p>
                  <h2 className="text-3xl font-bold mb-6">
                    {formatCurrency(unpaidTotal)}
                  </h2>
                  <div className="flex items-center gap-2 text-sm bg-white/10 p-3 rounded-lg border border-white/20">
                    <AlertCircle size={18} className="text-amber-300" />
                    <span>
                      Bạn có {unpaidInvoices.length} khoản chưa thanh toán
                    </span>
                  </div>
                </div>
                <div className="absolute -right-8 -bottom-8 opacity-10">
                  <Wallet size={160} />
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  Lưu ý thanh toán
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                    <p className="text-sm text-slate-600">
                      Học phí phải được thanh toán trước ngày 15 của tháng bắt
                      đầu học kỳ.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                    <p className="text-sm text-slate-600">
                      Sinh viên nợ học phí quá hạn sẽ bị khóa tài khoản đăng ký
                      môn học.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                    <p className="text-sm text-slate-600">
                      Mọi thắc mắc vui lòng liên hệ Phòng Kế hoạch - Tài chính.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <History size={18} className="text-primary" />
                    Lịch sử hóa đơn
                  </h3>
                  <button className="text-xs font-bold text-primary hover:underline">
                    Xem tất cả
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="px-6 py-4">Nội dung</th>
                        <th className="px-6 py-4">Số tiền</th>
                        <th className="px-6 py-4">Hạn thanh toán</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-slate-500"
                          >
                            Không có dữ liệu hóa đơn
                          </td>
                        </tr>
                      ) : (
                        invoices.map((inv) => (
                          <tr
                            key={inv.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800 text-sm">
                                {inv.title}
                              </p>
                              <p className="text-[10px] text-slate-400 uppercase font-medium">
                                ID: {inv.id}
                              </p>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700 text-sm">
                              {formatCurrency(inv.amount)}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {inv.dueDate}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  inv.status === "Paid"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {inv.status === "Paid" ? (
                                  <CheckCircle2 size={12} />
                                ) : (
                                  <AlertCircle size={12} />
                                )}
                                {inv.status === "Paid" ? "Đã nộp" : "Chưa nộp"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {inv.status === "Unpaid" ? (
                                <button
                                  onClick={() => handlePaySingle(inv)}
                                  className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Thanh toán
                                </button>
                              ) : (
                                <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all">
                                  <Download size={18} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
