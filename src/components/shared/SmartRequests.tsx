import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import api from "../../services/api";
import { toast } from "sonner";
import { FileText, CheckCircle, XCircle, Clock, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RequestModel {
  id: number;
  type: "STUDENT_LEAVE" | "TEACHER_SUBSTITUTE";
  requester: { id: number; name: string; username: string };
  targetClass: { id: number; name: string; code: string } | null;
  substituteTeacher: { id: number; name: string } | null;
  reason: string;
  attachmentUrl?: string;
  reviewNote?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export default function SmartRequests() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [requests, setRequests] = useState<RequestModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // For form
  const [reason, setReason] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Auto evaluating system warnings when students view this (not directly related to this component but we update this component's request schema anyway)
  // Let's add state for approving/rejecting dialog
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    id: number | null;
    status: "APPROVED" | "REJECTED";
    note: string;
  }>({
    isOpen: false,
    id: null,
    status: "APPROVED",
    note: "",
  });

  const fetchRequests = async () => {
    try {
      const res = await api.get("/requests");
      setRequests(res.data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách đơn từ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      toast.error("Kích thước tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 10MB.");
      e.target.value = "";
      return;
    }

    setAttachmentFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!reason || !targetClassId) {
        toast.error("Vui lòng điền đủ thông tin");
        return;
      }

      const type =
        user?.role === "STUDENT" ? "STUDENT_LEAVE" : "TEACHER_SUBSTITUTE";

      const formData = new FormData();

      formData.append("type", type);
      formData.append("reason", reason);
      formData.append("targetClassId", targetClassId);

      if (attachmentFile) {
        formData.append("attachment", attachmentFile);
      }

      await api.post("/requests", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Đã gửi đơn thành công");

      setShowForm(false);
      setReason("");
      setTargetClassId("");
      setAttachmentFile(null);

      fetchRequests();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi gửi đơn");
    }
  };

  const handleOpenReview = (id: number, status: "APPROVED" | "REJECTED") => {
    setReviewModal({ isOpen: true, id, status, note: "" });
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModal.id) return;
    try {
      await api.put(`/requests/${reviewModal.id}`, {
        status: reviewModal.status,
        reviewNote: reviewModal.note,
      });
      toast.success("Đã cập nhật trạng thái");
      setReviewModal({ isOpen: false, id: null, status: "APPROVED", note: "" });
      fetchRequests();
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1 w-fit">
            <Clock size={12} /> Chờ duyệt
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 w-fit">
            <CheckCircle size={12} /> Đã duyệt
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1 w-fit">
            <XCircle size={12} /> Đã từ chối
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-indigo-600" /> Đơn từ thông minh
          </h1>
          <p className="text-slate-500 mt-1">
            Quản lý và nộp các loại đơn từ (Xin nghỉ, báo bận, vv.)
          </p>
        </div>
        {(user?.role === "STUDENT" || user?.role === "TEACHER") && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Gửi đơn mới
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card p-6 border-l-4 border-l-indigo-500"
          >
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {user?.role === "STUDENT"
                ? "Đơn xin nghỉ phép"
                : "Đơn báo bận / Dạy thay"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Căn cứ (Mã lớp học / Học phần)
                </label>
                <input
                  type="text"
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="input-field"
                  placeholder="Nhập ID lớp học (đối với sinh viên) hoặc ID môn học (giảng viên)..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lý do
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field min-h-[100px]"
                  placeholder="Trình bày lý do chi tiết..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Minh chứng đính kèm
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="input-field"
                />
                {attachmentFile && (
                  <p className="text-xs text-emerald-600 mt-1 font-bold">
                    Đã đính kèm: {attachmentFile.name}
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold tracking-wide rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                >
                  Gửi đơn
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Chưa có đơn từ nào.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-5 hover:bg-slate-50 transition-colors flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800">
                      {req.type === "STUDENT_LEAVE"
                        ? "Đơn Xin Nghỉ Phép"
                        : "Đơn Báo Bận / Dạy Thay"}
                    </h3>
                    {getStatusBadge(req.status)}
                  </div>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">
                      Người gửi:
                    </span>{" "}
                    {req.requester.name} - {req.requester.username}
                  </p>
                  {req.targetClass && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Lớp:</span>{" "}
                      {req.targetClass.name}
                    </p>
                  )}
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Lý do:</span>{" "}
                    {req.reason}
                  </p>
                  {req.attachmentUrl && (
                    <div className="mt-2">
                      <a
                        href={`https://trangsv.congsinhvieen.id.vn${req.attachmentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <FileText size={16} />
                        Xem minh chứng đính kèm
                      </a>
                    </div>
                  )}
                  {req.status !== "PENDING" && req.reviewNote && (
                    <div className="p-3 bg-slate-100 rounded-lg mt-2">
                      <p className="text-sm text-slate-700">
                        <span className="font-bold">
                          Lý do/Phản hồi của Ban Giám Hiệu:{" "}
                        </span>
                        {req.reviewNote}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-2 block">
                    Gửi lúc: {new Date(req.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>

                {user?.role === "ADMIN" && req.status === "PENDING" && (
                  <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenReview(req.id, "APPROVED")}
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Chấp nhận
                    </button>
                    <button
                      onClick={() => handleOpenReview(req.id, "REJECTED")}
                      className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <XCircle size={16} /> Từ chối
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div
              className={`flex justify-between items-center p-6 border-b border-slate-100 ${reviewModal.status === "APPROVED" ? "bg-emerald-50" : "bg-rose-50"}`}
            >
              <h3
                className={`font-bold text-lg flex items-center gap-2 ${reviewModal.status === "APPROVED" ? "text-emerald-700" : "text-rose-700"}`}
              >
                {reviewModal.status === "APPROVED" ? (
                  <CheckCircle size={20} />
                ) : (
                  <XCircle size={20} />
                )}
                {reviewModal.status === "APPROVED"
                  ? "Chấp nhận yêu cầu"
                  : "Từ chối yêu cầu"}
              </h3>
              <button
                onClick={() =>
                  setReviewModal({ ...reviewModal, isOpen: false })
                }
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitReview} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Lý do / Phản hồi
                </label>
                <textarea
                  className="input-field w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập lý do phản hồi cho sinh viên/giảng viên..."
                  rows={4}
                  value={reviewModal.note}
                  onChange={(e) =>
                    setReviewModal({ ...reviewModal, note: e.target.value })
                  }
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setReviewModal({ ...reviewModal, isOpen: false })
                  }
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 text-white rounded-xl font-bold shadow-sm disabled:opacity-50 ${reviewModal.status === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" : "bg-rose-600 hover:bg-rose-700 shadow-rose-200"}`}
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
