import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 1. LẤY DỮ LIỆU AN TOÀN BẰNG TRY...CATCH
const storedToken = localStorage.getItem("token");
let storedUser = null;

try {
  const userString = localStorage.getItem("user");
  // Đảm bảo chuỗi không phải rác hoặc undefined
  if (userString && userString !== "undefined" && userString !== "null") {
    storedUser = JSON.parse(userString);
  }
} catch (error) {
  console.error("Lỗi đọc dữ liệu user từ localStorage:", error);
  // Nếu dữ liệu hỏng, tự động dọn rác
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}

const initialState: AuthState = {
  user: storedUser,
  token: storedUser ? storedToken : null,
  isAuthenticated: !!storedUser && !!storedToken,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{ user: User; token: string }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;

      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
  },
});

export const { loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
