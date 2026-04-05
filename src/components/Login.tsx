import { useState, FormEvent, useEffect } from "react";
import { Eye, EyeOff, Lock, User, X, Facebook, Phone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useDispatch } from "react-redux";
import ReCAPTCHA from "react-google-recaptcha";
import { loginSuccess } from "../redux/slices/authSlice";
import api from "../services/api";
import { toast } from "sonner"; // ĐÃ THÊM TOAST

interface LoginProps {
  onLogin: (username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!captchaValue) {
      toast.warning(
        "Vui lòng xác nhận bạn không phải là người máy (reCAPTCHA).",
      ); // THAY THẾ ALERT
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/login", { username, password });

      dispatch(
        loginSuccess({
          user: response.data.user,
          token: response.data.token,
        }),
      );

      if (rememberMe) {
        localStorage.setItem("rememberedUsername", username);
      } else {
        localStorage.removeItem("rememberedUsername");
      }

      onLogin(username);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-main relative">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-[440px]"
      >
        <div className="card p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Lock size={32} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">
              Cổng thông tin Sinh viên
            </p>
            <h1 className="text-3xl font-bold text-primary">ĐĂNG NHẬP</h1>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Mã sinh viên / Tên đăng nhập
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập mã sinh viên"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  Ghi nhớ đăng nhập
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPwd(true)}
                className="text-sm font-medium text-primary hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            <div className="flex justify-center">
              <ReCAPTCHA
                sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                onChange={(val) => setCaptchaValue(val)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Đăng nhập</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => setShowContact(true)}
                className="text-primary font-semibold hover:underline"
              >
                Liên hệ phòng đào tạo
              </button>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPwd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">
                  Quên mật khẩu
                </h3>
                <button
                  onClick={() => setShowForgotPwd(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-slate-600 mb-4 text-sm">
                  Vui lòng nhập mã sinh viên hoặc email của bạn. Chúng tôi sẽ
                  gửi hướng dẫn khôi phục mật khẩu qua email.
                </p>
                <input
                  type="text"
                  placeholder="Mã sinh viên / Email"
                  className="input-field mb-4"
                />
                <button
                  onClick={() => {
                    toast.success("Yêu cầu khôi phục mật khẩu đã được gửi!"); // THAY THẾ ALERT
                    setShowForgotPwd(false);
                  }}
                  className="btn-primary w-full py-2.5"
                >
                  Gửi yêu cầu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contact Training Dept Modal */}
      <AnimatePresence>
        {showContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">
                  Liên hệ Phòng Đào Tạo
                </h3>
                <button
                  onClick={() => setShowContact(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-600 text-sm mb-2">
                  Nếu bạn cần hỗ trợ về tài khoản, vui lòng liên hệ với Phòng
                  Đào Tạo qua các kênh sau:
                </p>

                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Facebook size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      Fanpage Phòng Đào Tạo
                    </p>
                    <p className="text-xs text-slate-500">
                      facebook.com/phongdaotao.uni
                    </p>
                  </div>
                </a>

                <a
                  href="tel:02838123456"
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      Hotline Hỗ Trợ
                    </p>
                    <p className="text-xs text-slate-500">
                      028 38 123 456 (Giờ hành chính)
                    </p>
                  </div>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
