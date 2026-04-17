import { useState, useRef, useEffect } from "react";
import { X, Send, User as UserIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// API Key mới cứng của bạn
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export default function AIChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Xin chào, tôi là Trợ lý Thông minh đại diện cho Cố vấn học tập. Tôi có thể giúp gì cho bạn hôm nay?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant", // Model mới nhất
            messages: [
              {
                role: "system",
                content:
                  'Bạn là một cố vấn học tập AI tận tâm của Học viện hàng không. Tên của bạn là CVHT. Hãy trả lời ngắn gọn, thân thiện, xưng "mình" và gọi "bạn", luôn bằng tiếng Việt.',
              },
              ...newMessages.map((m) => ({ role: m.role, content: m.content })),
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `Lỗi HTTP: ${response.status}`,
        );
      }

      const data = await response.json();
      if (data.choices && data.choices[0]?.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.choices[0].message.content },
        ]);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Xin lỗi, kết nối API thất bại. Chi tiết lỗi: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center cursor-pointer z-50 transition-all border border-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
      >
        {isOpen ? (
          <X size={28} className="text-slate-600" />
        ) : (
          <>
            {/* ĐÃ CẬP NHẬT LOGO VAA Ở NÚT BẤM */}
            <img
              src="/logo-vaa.png"
              alt="VAA Logo"
              className="w-8 h-8 object-contain mb-0.5"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <span className="text-[10px] font-bold text-slate-800 leading-none mt-1">
              CVHT
            </span>
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-28 right-6 w-[350px] h-[500px] max-h-[75vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-100"
          >
            <div className="bg-primary p-4 text-white flex items-center gap-3 shrink-0 shadow-md z-10">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 p-1">
                {/* ĐÃ CẬP NHẬT LOGO VAA Ở HEADER KHUNG CHAT */}
                <img
                  src="/logo-vaa.png"
                  alt="VAA"
                  className="w-full h-full object-contain"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">CVHT AI VAA</h3>
                <p className="text-[10px] text-blue-100 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Luôn sẵn sàng hỗ trợ
                </p>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === "user"
                          ? "bg-slate-200 text-slate-600"
                          : "bg-white p-1 shadow-sm"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <UserIcon size={16} />
                      ) : (
                        <img
                          src="/logo-vaa.png"
                          alt="AI"
                          className="w-full h-full object-contain"
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-sm shadow-sm ${
                        msg.role === "user"
                          ? "bg-primary text-white rounded-tr-sm whitespace-pre-wrap"
                          : "bg-white text-slate-700 border border-slate-100 rounded-tl-sm whitespace-pre-wrap"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%] flex-row">
                    <div className="w-8 h-8 rounded-full bg-white p-1 shadow-sm flex items-center justify-center shrink-0">
                      <img
                        src="/logo-vaa.png"
                        alt="AI"
                        className="w-full h-full object-contain"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                      <Loader2
                        size={16}
                        className="text-primary animate-spin"
                      />
                      <span className="text-xs text-slate-500">
                        Đang suy nghĩ...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi mình bất cứ điều gì..."
                  className="w-full bg-slate-100 border-none outline-none py-3 pl-4 pr-12 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all text-slate-700"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-1.5 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[9px] text-center text-slate-400 mt-2">
                Powered by Groq LLAMA 3.1
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
