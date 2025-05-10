
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Subject, Quiz } from '@/components/dashboards/student/types';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StudentState {
  enrolledSubjects: Subject[];
  pendingSubjects: Subject[];
  enrolledQuizzes: Quiz[];
  activeQuizzes: Quiz[];
  points: number;
  loading: boolean;
  dataFetched: boolean;
}

const initialState: StudentState = {
  enrolledSubjects: [],
  pendingSubjects: [],
  enrolledQuizzes: [],
  activeQuizzes: [],
  points: 0,
  loading: false,
  dataFetched: false,
};

// Async thunk for fetching all student data
export const fetchStudentData = createAsyncThunk(
  'student/fetchData',
  async (userId: string, { rejectWithValue }) => {
    try {
      // Fetch student points
      const { data: userData } = await supabase
        .from("profiles")
        .select("total_points")
        .eq("id", userId)
        .single();
      
      // Fetch enrolled subjects
      const { data: enrolledSubjectsData } = await supabase
        .from("subject_enrollments")
        .select("subject:subjects(id, name, description)")
        .eq("student_id", userId)
        .eq("status", "approved");

      // Fetch pending subjects
      const { data: pendingSubjectsData } = await supabase
        .from("subject_enrollments")
        .select("subject:subjects(id, name, description)")
        .eq("student_id", userId)
        .eq("status", "pending");

      // Fetch enrolled quizzes
      const { data: enrolledQuizzesData } = await supabase
        .from("quiz_enrollments")
        .select("quiz:quizzes(id, title, description, subject:subjects(name))")
        .eq("student_id", userId)
        .eq("status", "approved");

      let activeQuizList: Quiz[] = [];
      if (enrolledQuizzesData && enrolledQuizzesData.length > 0) {
        // Get enrolled quiz IDs
        const quizIds = enrolledQuizzesData.map((item) => item.quiz.id);
        
        if (quizIds.length > 0) {
          // Check which quizzes are active
          const { data: activeQuizData, error: activeQuizError } = await supabase
            .from('active_quiz_sessions')
            .select('quiz_id')
            .in('quiz_id', quizIds)
            .eq('status', 'active');
            
          if (activeQuizError) throw activeQuizError;
          
          if (activeQuizData && activeQuizData.length > 0) {
            const activeQuizIds = activeQuizData.map(session => session.quiz_id);
            
            // Get full quiz details for active quizzes
            const { data: activeQuizDetails, error: detailsError } = await supabase
              .from("quizzes")
              .select("*, subject:subjects(name)")
              .in("id", activeQuizIds);
              
            if (detailsError) throw detailsError;
            
            // Map to the correct format with is_active flag
            activeQuizList = activeQuizDetails.map(quiz => ({
              id: quiz.id,
              title: quiz.title,
              description: quiz.description,
              subject: quiz.subject,
              is_active: true
            }));
          }
        }
      }

      return {
        points: userData?.total_points || 0,
        enrolledSubjects: enrolledSubjectsData?.map((item) => item.subject) || [],
        pendingSubjects: pendingSubjectsData?.map((item) => item.subject) || [],
        enrolledQuizzes: enrolledQuizzesData?.map((item) => item.quiz) || [],
        activeQuizzes: activeQuizList,
      };
    } catch (error) {
      console.error("Error fetching student data:", error);
      return rejectWithValue("Failed to fetch student data");
    }
  }
);

// Async thunk specifically for checking active quizzes (to be used for real-time updates)
export const fetchActiveQuizzes = createAsyncThunk(
  'student/fetchActiveQuizzes',
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const { data: enrolledQuizzesData } = await supabase
        .from("quiz_enrollments")
        .select("quiz:quizzes(id, title, description, subject:subjects(name))")
        .eq("student_id", userId)
        .eq("status", "approved");

      let activeQuizList: Quiz[] = [];
      if (enrolledQuizzesData && enrolledQuizzesData.length > 0) {
        const quizIds = enrolledQuizzesData.map((item) => item.quiz.id);
        
        if (quizIds.length > 0) {
          // Check which quizzes are active
          const { data: activeQuizData, error: activeQuizError } = await supabase
            .from('active_quiz_sessions')
            .select('quiz_id')
            .in('quiz_id', quizIds)
            .eq('status', 'active');
            
          if (activeQuizError) throw activeQuizError;
          
          if (activeQuizData && activeQuizData.length > 0) {
            const activeQuizIds = activeQuizData.map(session => session.quiz_id);
            
            // Get full quiz details for active quizzes
            const { data: activeQuizDetails, error: detailsError } = await supabase
              .from("quizzes")
              .select("*, subject:subjects(name)")
              .in("id", activeQuizIds);
              
            if (detailsError) throw detailsError;
            
            // Map to the correct format with is_active flag
            activeQuizList = activeQuizDetails.map(quiz => ({
              id: quiz.id,
              title: quiz.title,
              description: quiz.description,
              subject: quiz.subject,
              is_active: true
            }));
          }
        }
      }

      return activeQuizList;
    } catch (error) {
      console.error("Error fetching active quizzes:", error);
      return rejectWithValue("Failed to fetch active quizzes");
    }
  }
);

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
    resetStudentData: (state) => {
      state.dataFetched = false;
      state.enrolledSubjects = [];
      state.pendingSubjects = [];
      state.enrolledQuizzes = [];
      state.activeQuizzes = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchStudentData
      .addCase(fetchStudentData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStudentData.fulfilled, (state, action) => {
        state.loading = false;
        state.dataFetched = true;
        state.points = action.payload.points;
        state.enrolledSubjects = action.payload.enrolledSubjects;
        state.pendingSubjects = action.payload.pendingSubjects;
        state.enrolledQuizzes = action.payload.enrolledQuizzes;
        state.activeQuizzes = action.payload.activeQuizzes;
      })
      .addCase(fetchStudentData.rejected, (state) => {
        state.loading = false;
        toast.error("Failed to load student data");
      })
      // Handle fetchActiveQuizzes
      .addCase(fetchActiveQuizzes.fulfilled, (state, action) => {
        state.activeQuizzes = action.payload;
      })
      .addCase(fetchActiveQuizzes.rejected, () => {
        toast.error("Failed to update active quizzes");
      });
  },
});

export const {
  setEnrolledSubjects,
  setPendingSubjects,
  setEnrolledQuizzes,
  setActiveQuizzes,
  setPoints,
  setLoading,
  resetStudentData,
} = studentSlice.actions;

export default studentSlice.reducer;
