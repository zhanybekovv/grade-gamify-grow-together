
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Subject, Quiz } from '@/components/dashboards/student/types';

interface StudentState {
  enrolledSubjects: Subject[];
  pendingSubjects: Subject[];
  enrolledQuizzes: Quiz[];
  activeQuizzes: Quiz[];
  points: number;
  loading: boolean;
}

const initialState: StudentState = {
  enrolledSubjects: [],
  pendingSubjects: [],
  enrolledQuizzes: [],
  activeQuizzes: [],
  points: 0,
  loading: true,
};

export const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    setEnrolledSubjects: (state, action: PayloadAction<Subject[]>) => {
      state.enrolledSubjects = action.payload;
    },
    setPendingSubjects: (state, action: PayloadAction<Subject[]>) => {
      state.pendingSubjects = action.payload;
    },
    setEnrolledQuizzes: (state, action: PayloadAction<Quiz[]>) => {
      state.enrolledQuizzes = action.payload;
    },
    setActiveQuizzes: (state, action: PayloadAction<Quiz[]>) => {
      state.activeQuizzes = action.payload;
    },
    setPoints: (state, action: PayloadAction<number>) => {
      state.points = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setEnrolledSubjects,
  setPendingSubjects,
  setEnrolledQuizzes,
  setActiveQuizzes,
  setPoints,
  setLoading,
} = studentSlice.actions;

export default studentSlice.reducer;
