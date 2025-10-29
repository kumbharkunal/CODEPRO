import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Review {
  _id: string;
  pullRequestTitle: string;
  pullRequestNumber: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  filesAnalyzed: number;
  issuesFound: number;
  qualityScore?: number;
  createdAt: string;
}

interface ReviewState {
  reviews: Review[];
  loading: boolean;
  error: string | null;
}

const initialState: ReviewState = {
  reviews: [],
  loading: false,
  error: null,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    setReviews: (state, action: PayloadAction<Review[]>) => {
      state.reviews = action.payload;
      state.loading = false;
      state.error = null;
    },
    addReview: (state, action: PayloadAction<Review>) => {
      state.reviews.unshift(action.payload); // Add to beginning
    },
    updateReview: (state, action: PayloadAction<Review>) => {
      const index = state.reviews.findIndex(r => r._id === action.payload._id);
      if (index !== -1) {
        state.reviews[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setReviews, addReview, updateReview, setLoading, setError } = reviewSlice.actions;
export default reviewSlice.reducer;