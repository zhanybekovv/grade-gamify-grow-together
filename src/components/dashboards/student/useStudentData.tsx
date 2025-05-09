
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Subject, Quiz } from "./types";

export const useStudentData = () => {
  const { currentUser } = useAuth();
  const [enrolledSubjects, setEnrolledSubjects] = useState<Subject[]>([]);
  const [pendingSubjects, setPendingSubjects] = useState<Subject[]>([]);
  const [enrolledQuizzes, setEnrolledQuizzes] = useState<Quiz[]>([]);
  const [activeQuizzes, setActiveQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);

  const fetchStudentData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Fetch student points
      const { data: userData } = await supabase
        .from("profiles")
        .select("total_points")
        .eq("id", currentUser.id)
        .single();

      if (userData) {
        setPoints(userData.total_points || 0);
      }

      // Fetch enrolled subjects
      const { data: enrolledSubjectsData } = await supabase
        .from("subject_enrollments")
        .select("subject:subjects(id, name, description)")
        .eq("student_id", currentUser.id)
        .eq("status", "approved");

      if (enrolledSubjectsData) {
        setEnrolledSubjects(
          enrolledSubjectsData.map((item) => item.subject as Subject)
        );
      }

      // Fetch pending subjects
      const { data: pendingSubjectsData } = await supabase
        .from("subject_enrollments")
        .select("subject:subjects(id, name, description)")
        .eq("student_id", currentUser.id)
        .eq("status", "pending");

      if (pendingSubjectsData) {
        setPendingSubjects(
          pendingSubjectsData.map((item) => item.subject as Subject)
        );
      }

      // Fetch enrolled quizzes
      const { data: enrolledQuizzesData } = await supabase
        .from("quiz_enrollments")
        .select("quiz:quizzes(id, title, description, subject:subjects(name))")
        .eq("student_id", currentUser.id)
        .eq("status", "approved");

      if (enrolledQuizzesData) {
        const quizzes = enrolledQuizzesData.map((item) => item.quiz as Quiz);
        setEnrolledQuizzes(quizzes);
        
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
            const activeQuizList = quizzes
              .filter(quiz => activeQuizIds.includes(quiz.id))
              .map(quiz => ({...quiz, is_active: true}));
            
            setActiveQuizzes(activeQuizList);
          } else {
            setActiveQuizzes([]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching student dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
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
