import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface Resource {
  id: number;
  title: string;
  type: string;
  url: string;
  classId: number;
  uploadDate: string;
}

interface ResourceState {
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ResourceState = {
  resources: [],
  isLoading: false,
  error: null,
};

export const fetchResources = createAsyncThunk(
  'resources/fetchResources',
  async (classId: string | number | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get('/resources', { params: { classId } });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch resources');
    }
  }
);

export const createResource = createAsyncThunk(
  'resources/createResource',
  async (data: Partial<Resource>, { rejectWithValue }) => {
    try {
      const response = await api.post('/resources', data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create resource');
    }
  }
);

export const deleteResource = createAsyncThunk(
  'resources/deleteResource',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/resources/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete resource');
    }
  }
);

export const updateResource = createAsyncThunk(
  'resources/updateResource',
  async ({ id, title }: { id: number; title: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/resources/${id}`, { title });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update resource');
    }
  }
);

const resourceSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchResources.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resources = action.payload;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createResource.fulfilled, (state, action) => {
        state.resources.push(action.payload);
      })
      .addCase(deleteResource.fulfilled, (state, action) => {
        state.resources = state.resources.filter(r => r.id !== action.payload);
      })
      .addCase(updateResource.fulfilled, (state, action) => {
        const index = state.resources.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.resources[index] = action.payload;
        }
      });
  },
});

export default resourceSlice.reducer;
