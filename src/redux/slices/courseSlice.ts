import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Class } from '../../types';
import api from '../../services/api';

interface CourseState {
  classes: Class[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  classes: [],
  isLoading: false,
  error: null,
};

export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Class[]>('/courses');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

export const createCourse = createAsyncThunk(
  'courses/createCourse',
  async (courseData: Partial<Class>, { rejectWithValue }) => {
    try {
      const response = await api.post<Class>('/courses', courseData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create course');
    }
  }
);

export const updateCourse = createAsyncThunk(
  'courses/updateCourse',
  async ({ id, data }: { id: number | string; data: Partial<Class> }, { rejectWithValue }) => {
    try {
      const response = await api.put<Class>(`/courses/${id}`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update course');
    }
  }
);

export const deleteCourse = createAsyncThunk(
  'courses/deleteCourse',
  async (id: number | string, { rejectWithValue }) => {
    try {
      await api.delete(`/courses/${id}`);
      return Number(id);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete course');
    }
  }
);

export const registerCourse = createAsyncThunk(
  'courses/registerCourse',
  async (id: number | string, { rejectWithValue }) => {
    try {
      const response = await api.post<Class>(`/courses/${id}/register`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to register course');
    }
  }
);

export const unregisterCourse = createAsyncThunk(
  'courses/unregisterCourse',
  async (id: number | string, { rejectWithValue }) => {
    try {
      const response = await api.post<Class>(`/courses/${id}/unregister`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to unregister course');
    }
  }
);

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.classes = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.classes.push(action.payload);
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        const index = state.classes.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.classes[index] = action.payload;
        }
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.classes = state.classes.filter(c => c.id !== action.payload);
      })
      .addCase(registerCourse.fulfilled, (state, action) => {
        const index = state.classes.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.classes[index] = action.payload;
        }
      })
      .addCase(unregisterCourse.fulfilled, (state, action) => {
        const index = state.classes.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.classes[index] = action.payload;
        }
      });
  },
});

export default courseSlice.reducer;
