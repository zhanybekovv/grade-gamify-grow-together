
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useQuizActions = (quizId: string) => {
  const { currentUser } = useAuth();

  const startQuizSession = async () => {
    try {
      const { error } = await supabase
        .from("active_quiz_sessions")
        .insert({
          quiz_id: quizId,
          teacher_id: currentUser?.id,
          status: "active"
        });

      if (error) throw error;

      toast.success("Quiz session started successfully");
      
      // Refresh the active session data
      const { data: sessionData } = await supabase
        .from("active_quiz_sessions")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("status", "active")
        .single();

      return sessionData;
    } catch (error) {
      console.error("Error starting quiz session:", error);
      toast.error("Failed to start quiz session");
      throw error;
    }
  };

  const stopQuizSession = async () => {
    try {
      const { error } = await supabase
        .from("active_quiz_sessions")
        .update({ status: "ended", end_time: new Date().toISOString() })
        .eq("quiz_id", quizId)
        .eq("status", "active");

      if (error) throw error;

      toast.success("Quiz session ended successfully");
      return null;
    } catch (error) {
      console.error("Error stopping quiz session:", error);
      toast.error("Failed to stop quiz session");
      throw error;
    }
  };

  const requestQuizEnrollment = async () => {
    try {
      const { error } = await supabase
        .from("quiz_enrollments")
        .insert({
          quiz_id: quizId,
          student_id: currentUser?.id,
          status: "pending"
        });

      if (error) throw error;

      toast.success("Quiz enrollment request sent successfully");
      return { isEnrolled: false, isPending: true };
    } catch (error) {
      console.error("Error requesting quiz enrollment:", error);
      toast.error("Failed to send quiz enrollment request");
      throw error;
    }
  };

  return {
    startQuizSession,
    stopQuizSession,
    requestQuizEnrollment
  };
};
