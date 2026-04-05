import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api"; // Dùng api thật gọi MySQL
import { Grade } from "../../types";

interface GradeState {
  grades: Grade[];
  isLoading: boolean;
  error: string | null;
}

const initialState: GradeState = {
  grades: [], // Bắt đầu bằng mảng rỗng, không dùng mockGrades nữa
  isLoading: false,
  error: null,
};

// Hàm lấy dữ liệu điểm từ Backend (MySQL)
export const fetchGrades = createAsyncThunk(
  "grades/fetchGrades",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/grades");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Lỗi lấy dữ liệu điểm số");
    }
  },
);

// Hàm cập nhật điểm lên Backend
export const updateGradeAsync = createAsyncThunk(
  "grades/updateGradeAsync",
  async (gradeData: any, { rejectWithValue }) => {
    try {
      const response = await api.put(`/grades/${gradeData.id}`, gradeData);
      return response.data; // Trả về dữ liệu điểm đã cập nhật thành công
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Lỗi cập nhật điểm số");
    }
  },
);

const gradeSlice = createSlice({
  name: "grades",
  initialState,
  reducers: {
    // Giữ lại hàm này để dùng cho update giao diện tạm thời (Optimistic update) nếu cần
    updateGrade: (state, action) => {
      const index = state.grades.findIndex((g) => g.id === action.payload.id);
      if (index !== -1) {
        state.grades[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Xử lý trạng thái khi đang fetch điểm
      .addCase(fetchGrades.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // Khi fetch điểm thành công từ MySQL
      .addCase(fetchGrades.fulfilled, (state, action) => {
        state.isLoading = false;
        state.grades = action.payload;
      })
      // Khi bị lỗi
      .addCase(fetchGrades.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Cập nhật lại state sau khi PUT điểm thành công lên Backend
      .addCase(updateGradeAsync.fulfilled, (state, action) => {
        const index = state.grades.findIndex((g) => g.id === action.payload.id);
        if (index !== -1) {
          state.grades[index] = action.payload;
        }
      });
  },
});

export const { updateGrade } = gradeSlice.actions;
export default gradeSlice.reducer;
