import { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Clock,
  FileText,
  Upload,
  CheckCircle,
  Edit,
  Play,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import api from "../../services/api";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";

export default function ExamManagement() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);

  // Submit grading
  const [gradingSubmission, setGradingSubmission] = useState<any | null>(null);
  const [scoreInput, setScoreInput] = useState<string>("");

  // Form State
  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    isLockdown: false,
  });

  const fetchExams = async () => {
    try {
      const [examsRes, coursesRes] = await Promise.all([
        api.get("/exams/teacher"),
        api.get("/courses"),
      ]);
      setExams(examsRes.data);
      // Filter courses where teacher is assigned
      setCourses(
        coursesRes.data.filter(
          (c: any) => String(c.teacherId) === String(user?.id),
        ),
      );
    } catch (error) {
      toast.error("Lỗi khi tải danh sách bài thi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/exams", formData);
      toast.success("Tạo bài thi thành công!");
      setShowCreateModal(false);
      fetchExams();
    } catch (error) {
      toast.error("Lỗi khi tạo bài thi");
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    examId: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Parse data
        const questions = data.map((row: any) => {
          if (row.Type === "ESSAY") {
            return {
              type: "ESSAY",
              content: row.Question,
              points: parseFloat(row.Points) || 10,
            };
          } else {
            return {
              type: "MULTIPLE_CHOICE",
              content: row.Question,
              options: [
                row.OptionA,
                row.OptionB,
                row.OptionC,
                row.OptionD,
              ].filter(Boolean),
              correctAnswer: row.CorrectAnswer,
              points: parseFloat(row.Points) || 1,
            };
          }
        });

        await api.post(`/exams/${examId}/questions`, { questions });
        toast.success(`Đã tải lên ${questions.length} câu hỏi`);
        fetchExams();
      } catch (err) {
        toast.error(
          "File Excel không đúng định dạng. Cần các cột: Type, Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, Points",
        );
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const publishExam = async (id: number) => {
    try {
      await api.put(`/exams/${id}/publish`, { status: "PUBLISHED" });
      toast.success("Đã xuất bản bài thi");
      fetchExams();
    } catch (error) {
      toast.error("Lỗi xuất bản");
    }
  };

  const loadSubmissions = async (exam: any) => {
    try {
      const res = await api.get(`/exams/${exam.id}/submissions`);
      setSelectedExam({
        ...exam,
        submissionData: res.data.submissions,
        questionsData: res.data.questions,
      });
    } catch (error) {
      toast.error("Lỗi tải bài nộp");
    }
  };

  const saveGrade = async () => {
    try {
      await api.put(`/exams/submissions/${gradingSubmission.id}/grade`, {
        score: parseFloat(scoreInput),
      });
      toast.success("Chấm điểm thành công");
      setGradingSubmission(null);
      setScoreInput("");
      loadSubmissions(selectedExam);
      fetchExams();
    } catch (error) {
      toast.error("Lỗi khi chấm điểm");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-indigo-600" /> Quản lý Khảo thí
          </h1>
          <p className="text-slate-500 mt-1">
            Tạo bài thi trực tuyến, môi trường chống gian lận và tự động chấm
            điểm
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          + Tạo Bài Thi Mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">
            Danh sách bài thi
          </h2>
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            </div>
          ) : exams.length === 0 ? (
            <div className="card p-8 text-center text-slate-500">
              Chưa có bài thi nào
            </div>
          ) : (
            exams.map((exam) => (
              <div
                key={exam.id}
                className={`card p-5 cursor-pointer transition-all border-2 ${selectedExam?.id === exam.id ? "border-indigo-500 shadow-md ring-2 ring-indigo-100" : "border-transparent hover:border-slate-200"}`}
                onClick={() => loadSubmissions(exam)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-lg">
                    {exam.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      exam.status === "PUBLISHED"
                        ? "bg-emerald-100 text-emerald-700"
                        : exam.status === "COMPLETED"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {exam.status === "PUBLISHED"
                      ? "Đang diễn ra"
                      : exam.status === "DRAFT"
                        ? "Bản nháp"
                        : "Đã kết thúc"}
                  </span>
                </div>
                <div className="text-sm text-slate-600 space-y-1 mb-4">
                  <p>
                    <span className="font-medium text-slate-700">Môn học:</span>{" "}
                    {exam.course?.name}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">
                      Thời gian:
                    </span>{" "}
                    {new Date(exam.startTime).toLocaleString("vi-VN")} -{" "}
                    {new Date(exam.endTime).toLocaleString("vi-VN")}
                  </p>
                  {exam.isLockdown && (
                    <p className="text-rose-600 font-bold flex items-center gap-1 text-xs">
                      <Lock size={12} /> Lockdown Browser Bật
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-slate-700">Câu hỏi:</span>{" "}
                    {exam.questions?.length || 0} câu
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">Bài nộp:</span>{" "}
                    {exam.submissions?.length || 0} bài
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                  {exam.status === "DRAFT" && (
                    <>
                      <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2">
                        <Upload size={16} /> Upload Excel
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, exam.id)}
                        />
                      </label>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          publishExam(exam.id);
                        }}
                        disabled={
                          !exam.questions || exam.questions.length === 0
                        }
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Play size={16} /> Xuất bản
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">
            Quản lý & Chấm điểm
          </h2>
          {!selectedExam ? (
            <div className="card p-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 border border-slate-200 border-dashed">
              <FileText size={48} className="mb-4 opacity-50" />
              <p>Chọn một bài thi để xem chi tiết và chấm điểm</p>
            </div>
          ) : (
            <div className="card p-6">
              <h3 className="font-bold text-xl text-slate-800 mb-4 flex items-center gap-2">
                Bài thi: {selectedExam.title}
              </h3>

              {!selectedExam.submissionData ||
              selectedExam.submissionData.length === 0 ? (
                <div className="text-center p-6 text-slate-500 bg-slate-50 rounded-xl">
                  Chưa có bài nộp nào.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-4 font-bold text-slate-600 text-sm pb-2">
                    <div className="col-span-2">Sinh viên</div>
                    <div>Tình trạng</div>
                    <div className="text-right">Điểm</div>
                  </div>
                  {selectedExam.submissionData.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="grid grid-cols-4 items-center py-3"
                    >
                      <div className="col-span-2">
                        <p className="font-bold text-slate-800 flex items-center gap-2">
                          {sub.student.name}
                          {sub.cheatingAttempts > 0 && (
                            <span
                              className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                              title={`${sub.cheatingAttempts} lần vi phạm trong quá trình làm bài`}
                            >
                              <AlertTriangle size={10} /> {sub.cheatingAttempts}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          {sub.student.username}
                        </p>
                      </div>
                      <div>
                        {sub.status === "GRADED" ? (
                          <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">
                            Đã chấm ({sub.score}đ)
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold text-xs bg-amber-50 px-2 py-1 rounded flex items-center gap-1 w-fit">
                            <Clock size={12} /> Chờ duyệt
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <button
                          onClick={() => setGradingSubmission(sub)}
                          className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium rounded text-sm"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Chấm bài: {gradingSubmission.student.name}
                </h2>
                <div className="flex items-center gap-3">
                  <p className="text-slate-500 text-sm">
                    Điểm hiện tại:{" "}
                    {gradingSubmission.score !== null
                      ? gradingSubmission.score
                      : "Chưa có"}
                  </p>
                  {gradingSubmission.cheatingAttempts > 0 && (
                    <p className="text-rose-600 font-bold text-sm bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertTriangle size={14} /> Vi phạm quay cóp/click chuột
                      phải/tab: {gradingSubmission.cheatingAttempts} lần
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {selectedExam.questionsData?.map((q: any, idx: number) => {
                const studentAns = gradingSubmission.answers[q.id];
                const isCorrect =
                  q.type === "MULTIPLE_CHOICE"
                    ? studentAns === q.correctAnswer
                    : null;

                return (
                  <div
                    key={q.id}
                    className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <p className="font-medium text-slate-800">
                        <span className="text-indigo-600 font-bold mr-1">
                          Câu {idx + 1}:
                        </span>{" "}
                        {q.content}
                      </p>
                      <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {q.points}đ
                      </span>
                    </div>

                    {q.type === "MULTIPLE_CHOICE" ? (
                      <div className="space-y-2">
                        {q.options?.map((opt: string, i: number) => {
                          const isSelected = studentAns === opt;
                          const isTheCorrect = opt === q.correctAnswer;
                          return (
                            <div
                              key={i}
                              className={`p-2 rounded text-sm flex items-center justify-between border
                                ${
                                  isSelected && isTheCorrect
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                    : isSelected && !isTheCorrect
                                      ? "bg-rose-50 border-rose-200 text-rose-800"
                                      : isTheCorrect
                                        ? "bg-emerald-50/50 border-emerald-100 border-dashed text-emerald-700"
                                        : "bg-slate-50 border-slate-100 text-slate-600"
                                }
                              `}
                            >
                              <span>
                                {String.fromCharCode(65 + i)}. {opt}
                              </span>
                              {isSelected && isTheCorrect && (
                                <CheckCircle
                                  size={16}
                                  className="text-emerald-500"
                                />
                              )}
                              {isSelected && !isTheCorrect && (
                                <AlertTriangle
                                  size={16}
                                  className="text-rose-500"
                                />
                              )}
                            </div>
                          );
                        })}
                        <p
                          className={`text-sm font-bold mt-2 ${isCorrect ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          Hệ thống chấm:{" "}
                          {isCorrect
                            ? `${q.points} / ${q.points}đ`
                            : `0 / ${q.points}đ`}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Bài nộp tự luận:
                        </h4>
                        <div className="p-4 bg-yellow-50/50 border border-yellow-200/50 rounded-lg whitespace-pre-wrap text-sm text-slate-700 min-h-[100px]">
                          {studentAns || (
                            <span className="text-slate-400 italic">
                              Không có câu trả lời
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="font-bold text-slate-700">
                  Tổng điểm chốt:
                </label>
                <input
                  type="number"
                  step="0.25"
                  className="input-field w-24 py-1.5"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  placeholder={gradingSubmission.score?.toString() || "0"}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 text-slate-600 font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={saveGrade}
                  className="btn-primary"
                  disabled={!scoreInput}
                >
                  Lưu điểm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 text-center">
                  Tạo Bài Thi Mới
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateExam} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Môn học
                  </label>
                  <input
                    required
                    type="text"
                    className="input-field"
                    placeholder="Nhập tên môn học..."
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData({ ...formData, courseId: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tên bài thi
                  </label>
                  <input
                    required
                    type="text"
                    className="input-field"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Thời gian bắt đầu
                  </label>
                  <input
                    required
                    type="datetime-local"
                    className="input-field"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Thời gian kết thúc
                  </label>
                  <input
                    required
                    type="datetime-local"
                    className="input-field"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl mt-4">
                  <input
                    type="checkbox"
                    id="lockdown"
                    className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500"
                    checked={formData.isLockdown}
                    onChange={(e) =>
                      setFormData({ ...formData, isLockdown: e.target.checked })
                    }
                  />
                  <label
                    htmlFor="lockdown"
                    className="font-bold text-rose-800 flex items-center gap-2"
                  >
                    <Lock size={16} /> Bật Lockdown Browser (Chống gian lận)
                  </label>
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full mt-6 py-3 text-lg"
                >
                  Tạo mới
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
