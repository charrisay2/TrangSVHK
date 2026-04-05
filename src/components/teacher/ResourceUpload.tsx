import { useState, DragEvent, useEffect, ChangeEvent } from "react";
import { createPortal } from "react-dom"; // ĐÃ THÊM
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Search,
  Plus,
  FileCode,
  File as FileIcon,
  Edit2,
  Check,
  X as CloseIcon,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import {
  fetchResources,
  createResource,
  deleteResource,
  updateResource,
} from "../../redux/slices/resourceSlice";
import { fetchCourses } from "../../redux/slices/courseSlice";
import { toast } from "sonner"; // ĐÃ THÊM

interface ResourceUploadProps {
  teacherId: string | number;
}

export default function ResourceUpload({ teacherId }: ResourceUploadProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { resources, isLoading: resourcesLoading } = useSelector(
    (state: RootState) => state.resources,
  );
  const { classes } = useSelector((state: RootState) => state.courses);

  const [selectedClass, setSelectedClass] = useState<string | number>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // ĐÃ THÊM: State cho Modal xác nhận xóa
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    type: "danger" | "info";
  } | null>(null);

  const teacherClasses = classes.filter(
    (c) => String(c.teacherId) === String(teacherId),
  );

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  useEffect(() => {
    if (teacherClasses.length > 0 && !selectedClass) {
      setSelectedClass(teacherClasses[0].id);
    }
  }, [teacherClasses, selectedClass]);

  useEffect(() => {
    if (selectedClass) {
      dispatch(fetchResources(selectedClass));
    }
  }, [dispatch, selectedClass]);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedClass) {
      toast.warning("Vui lòng chọn lớp học trước khi tải lên");
      return;
    }

    setIsUploading(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const fileExtension = file.name.split(".").pop()?.toUpperCase() || "FILE";
    let type = "OTHER";
    if (["PDF"].includes(fileExtension)) type = "PDF";
    if (["PPTX", "PPT"].includes(fileExtension)) type = "SLIDE";
    if (["DOCX", "DOC"].includes(fileExtension)) type = "DOC";

    const resultAction = await dispatch(
      createResource({
        title: file.name,
        type,
        url: "#",
        classId: Number(selectedClass),
      }),
    );

    setIsUploading(false);

    if (createResource.fulfilled.match(resultAction)) {
      toast.success("Tải lên tài liệu thành công!");
    } else {
      toast.error("Tải lên thất bại: " + resultAction.payload);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDelete = async (id: number) => {
    // THAY THẾ window.confirm
    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa",
      message: "Bạn có chắc chắn muốn xóa tài liệu này?",
      type: "danger",
      action: async () => {
        await dispatch(deleteResource(id));
        toast.success("Xóa tài liệu thành công!");
      },
    });
  };

  const startEditing = (id: number, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const saveEdit = async (id: number) => {
    if (!editTitle.trim()) return;
    const resultAction = await dispatch(
      updateResource({ id, title: editTitle }),
    );
    if (updateResource.fulfilled.match(resultAction)) {
      setEditingId(null);
      toast.success("Cập nhật tên tài liệu thành công!");
    } else {
      toast.error("Lưu thất bại: " + resultAction.payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal Custom Xác Nhận */}
      {confirmDialog?.isOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div
                  className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    confirmDialog.type === "danger"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-primary"
                  }`}
                >
                  {confirmDialog.type === "danger" ? (
                    <AlertCircle size={32} />
                  ) : (
                    <HelpCircle size={32} />
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {confirmDialog.title}
                </h3>
                <p className="text-slate-600 mb-6">{confirmDialog.message}</p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={async () => {
                      await confirmDialog.action();
                      setConfirmDialog(null);
                    }}
                    className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl transition-colors ${
                      confirmDialog.type === "danger"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-primary hover:bg-blue-700"
                    }`}
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Tài liệu học tập
          </h1>
          <p className="text-slate-500">
            Quản lý và chia sẻ tài liệu giảng dạy với sinh viên
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input-field py-2"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="" disabled>
              Chọn lớp học
            </option>
            {teacherClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`card p-8 border-2 border-dashed flex flex-col items-center text-center transition-all ${
              isDragging ? "border-primary bg-blue-50" : "border-slate-200"
            } ${isUploading ? "opacity-50 cursor-wait" : ""}`}
          >
            <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-4">
              {isUploading ? (
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Upload size={32} />
              )}
            </div>
            <h3 className="font-bold text-slate-800 mb-2">
              {isUploading ? "Đang tải lên..." : "Tải lên tài liệu mới"}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Kéo và thả tệp vào đây hoặc nhấn để chọn tệp từ máy tính
            </p>
            <input
              type="file"
              className="hidden"
              id="file-upload"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className={`btn-primary cursor-pointer inline-flex items-center gap-2 ${isUploading ? "pointer-events-none" : ""}`}
            >
              <Plus size={18} /> Chọn tệp
            </label>
            <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">
              Hỗ trợ: PDF, DOCX, PPTX (Max 20MB)
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-800">Tài liệu đã tải lên</h3>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Tìm tài liệu..."
                className="input-field py-1.5 pl-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            {resourcesLoading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-slate-500">Đang tải tài liệu...</p>
              </div>
            ) : (
              resources.map((res) => (
                <div
                  key={res.id}
                  className="card p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        res.type === "PDF"
                          ? "bg-red-50 text-red-500"
                          : res.type === "SLIDE"
                            ? "bg-amber-50 text-amber-500"
                            : "bg-blue-50 text-blue-500"
                      }`}
                    >
                      {res.type === "PDF" ? (
                        <FileText size={20} />
                      ) : res.type === "SLIDE" ? (
                        <FileCode size={20} />
                      ) : (
                        <FileIcon size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingId === res.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="input-field py-1 text-sm flex-1"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(res.id)}
                            className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                            title="Lưu lại"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Hủy"
                          >
                            <CloseIcon size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h4 className="text-sm font-bold text-slate-800 truncate">
                            {res.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            {res.type} • {res.uploadDate}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {editingId !== res.id && (
                      <>
                        <button
                          onClick={() => startEditing(res.id, res.title)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                          title="Chỉnh sửa tên"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                          title="Tải về"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(res.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            {!resourcesLoading && resources.length === 0 && (
              <div className="py-12 text-center card bg-slate-50 border-dashed">
                <p className="text-slate-400 font-medium">
                  Chưa có tài liệu nào cho lớp học này
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
