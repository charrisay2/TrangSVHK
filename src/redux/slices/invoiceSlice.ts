import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Invoice } from '../../types';
import api from '../../services/api';

interface InvoiceState {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
}

const initialState: InvoiceState = {
  invoices: [],
  isLoading: false,
  error: null,
};

export const fetchInvoices = createAsyncThunk(
  'invoices/fetchInvoices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Invoice[]>('/invoices');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch invoices');
    }
  }
);

export const payInvoice = createAsyncThunk(
  'invoices/payInvoice',
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await api.put<Invoice>(`/invoices/${id}/pay`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to pay invoice');
    }
  }
);

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(payInvoice.fulfilled, (state, action) => {
        const index = state.invoices.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.invoices[index] = action.payload;
        }
      });
  },
});

export default invoiceSlice.reducer;
