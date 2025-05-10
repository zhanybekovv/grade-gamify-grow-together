
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Subject, Quiz } from "./types";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { 
  setEnrolledSubjects, 
  setPendingSubjects, 
  setEnrolledQuizzes, 
  setActiveQuizzes, 
  setPoints, 
  setLoading 
} from "@/redux/slices/studentSlice";

export const useStudentData = () => {
  const { currentUser } = useAuth();
  const dispatch = useAppDispatch();
  const { 
    enrolledSubjects, 
    pendingSubjects, 
    enrolledQuizzes, 
    activeQuizzes, 
    points, 
    loading 
  } = useAppSelector(state => state.student);

  const fetchStudentData = async () => {
    if (!currentUser) return;

    dispatch(setLoading(true));
    try {
      // Fetch student points
      const { data: userData } = await supabase
        .from("profiles")
        .select("total_points")
        .eq("id", currentUser.id)
        .single();

      if (userData) {
        dispatch(setPoints(userData.total_points || 0));
      }

      // Fetch enrolled subjects
      const { data: enrolledSubjectsData } = await supabase
        .from("subject_enrollments")
        .select("subject:subjects(id, name, description)")
        .eq("student_id", currentUser.id)
        .eq("status", "approved");

      if (enrolledSubjectsData) {
        dispatch(setEnrolledSubjects(
          enrolledSubjectsData.map((item) => item.subject as Subject)
        ));
      }

      // Fetch pending subjects
      const { data: pendingSubjectsData } = await supabase
        .from("subject_enrollments")
        .select("subject:subjects(id, name, description)")
        .eq("student_id", currentUser.id)
        .eq("status", "pending");

      if (pendingSubjectsData) {
        dispatch(setPendingSubjects(
          pendingSubjectsData.map((item) => item.subject as Subject)
        ));
      }

      // Fetch enrolled quizzes
      const { data: enrolledQuizzesData } = await supabase
        .from("quiz_enrollments")
        .select("quiz:quizzes(id, title, description, subject:subjects(name))")
        .eq("student_id", currentUser.id)
        .eq("status", "approved");

      if (enrolledQuizzesData) {
        const quizzes = enrolledQuizzesData.map((item) => item.quiz as Quiz);
        dispatch(setEnrolledQuizzes(quizzes));
        
        // Get enrolled quiz IDs to check for active sessions
        const quizIds = quizzes.map(quiz => quiz.id);
        
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
            const activeQuizList = activeQuizDetails.map(quiz => ({
              id: quiz.id,
              title: quiz.title,
              description: quiz.description,
              subject: quiz.subject,
              is_active: true
            }));
            
            dispatch(setActiveQuizzes(activeQuizList));
          } else {
            dispatch(setActiveQuizzes([]));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching student dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchStudentData();
    
    // Set up real-time listener for active quiz sessions
    const channel = supabase
      .channel('public:active_quiz_sessions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'active_quiz_sessions' 
      }, (payload) => {
        console.log('Active quiz sessions changed:', payload);
        // Refresh data when quiz sessions change
        fetchStudentData();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  return {
    enrolledSubjects,
    pendingSubjects,
    enrolledQuizzes,
    activeQuizzes,
    loading,
    points
  };
};
