import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import reviewReducer from './slices/reviewSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reviews: reviewReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;