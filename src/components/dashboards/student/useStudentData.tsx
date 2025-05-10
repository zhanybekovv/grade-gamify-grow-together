
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchStudentData, fetchActiveQuizzes } from "@/redux/slices/studentSlice";

export const useStudentData = () => {
  const { currentUser } = useAuth();
  const dispatch = useAppDispatch();
  const { 
    enrolledSubjects, 
    pendingSubjects, 
    enrolledQuizzes, 
    activeQuizzes, 
    points, 
    loading,
    dataFetched 
  } = useAppSelector(state => state.student);

  useEffect(() => {
    if (!currentUser || dataFetched) return;
    
    // Only fetch data if not already fetched
    dispatch(fetchStudentData(currentUser.id));
    
    // Set up real-time listener for active quiz sessions
    const channel = supabase
      .channel('public:active_quiz_sessions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'active_quiz_sessions' 
      }, () => {
        if (currentUser) {
          // Only fetch active quizzes data when changes detected
          dispatch(fetchActiveQuizzes(currentUser.id));
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, dataFetched, dispatch]);

  return {
    enrolledSubjects,
    pendingSubjects,
    enrolledQuizzes,
    activeQuizzes,
    loading,
    points
  };
};
