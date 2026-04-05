import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import gradeReducer from './slices/gradeSlice';
import userReducer from './slices/userSlice';
import invoiceReducer from './slices/invoiceSlice';
import resourceReducer from './slices/resourceSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    grades: gradeReducer,
    users: userReducer,
    invoices: invoiceReducer,
    resources: resourceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
