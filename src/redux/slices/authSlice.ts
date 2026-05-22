import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import api from '../../services/api';

// --- THÊM LẠI CÁC ASYNC THUNKS TỪ FILE TRÊN ---

interface LoginResponse {
  token: string;
  user: User;
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', { username, password });
      
      // Lưu vào localStorage cả token và user (kết hợp logic file dưới)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }
      const response = await api.get('/auth/me');
      
      // Cập nhật lại user trong localStorage cho đồng bộ
      localStorage.setItem('user', JSON.stringify(response.data));
      
      return response.data;
    } catch (err: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue(err.response?.data?.message || 'Phiên đăng nhập hết hạn');
    }
  }
);

// --- CẤU TRÚC STATE KẾT HỢP ---

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Khởi tạo state từ localStorage (Logic file dưới)
const storedToken = localStorage.getItem("token");
let storedUser: User | null = null;

try {
  const userString = localStorage.getItem("user");
  if (userString && userString !== "undefined" && userString !== "null") {
    storedUser = JSON.parse(userString);
  }
} catch (error) {
  console.error("Lỗi localStorage:", error);
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}

const initialState: AuthState = {
  user: storedUser,
  token: storedUser ? storedToken : null,
  isAuthenticated: !!storedUser && !!storedToken,
  isLoading: false,
  error: null,
  isInitialized: false, // Để false để App.tsx chạy fetchCurrentUser khi load
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Giữ lại loginSuccess từ file dưới nếu bạn dùng trong component Login
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.error = null;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isInitialized = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      // Xử lý loginUser
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Xử lý fetchCurrentUser (Rất quan trọng để duy trì đăng nhập)
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.isInitialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.isInitialized = true;
      });
  },
});

export const { logout, loginSuccess, updateUser } = authSlice.actions;
export default authSlice.reducer;