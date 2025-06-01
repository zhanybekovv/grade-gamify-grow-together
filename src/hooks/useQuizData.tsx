
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Quiz {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  created_at: string;
  subject: {
    name: string;
    teacher_id: string;
  };
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correct_option_index: number;
  points: number;
}

interface EnrollmentStatus {
  isEnrolled: boolean;
  isPending: boolean;
}

interface LeaderboardEntry {
  student_name: string;
  student_id: string;
  score: number;
  submitted_at: string;
}

export const useQuizData = (quizId: string) => {
  const { currentUser } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionScore, setSubmissionScore] = useState<number | null>(null);
  const [subjectEnrollmentStatus, setSubjectEnrollmentStatus] = useState<EnrollmentStatus>({
    isEnrolled: false,
    isPending: false
  });
  const [quizEnrollmentStatus, setQuizEnrollmentStatus] = useState<EnrollmentStatus>({
    isEnrolled: false,
    isPending: false
  });
  const [activeSession, setActiveSession] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const userType = currentUser?.user_metadata?.type || 'student';

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!quizId || !currentUser) return;

      try {
        setLoading(true);

        // Fetch quiz with subject details
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select(`
            *,
            subject:subjects(name, teacher_id)
          `)
          .eq("id", quizId)
          .single();

        if (quizError) throw quizError;
        setQuiz(quizData);

        // Check if current user is the teacher
        if (quizData.subject.teacher_id === currentUser.id) {
          setIsTeacher(true);
        }

        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", quizId);

        if (questionsError) throw questionsError;

        const formattedQuestions = questionsData.map((q: any) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')
        }));

        setQuestions(formattedQuestions);

        // Check if student has submitted
        if (userType === 'student') {
          const { data: submissionData } = await supabase
            .from("quiz_submissions")
            .select("score")
            .eq("quiz_id", quizId)
            .eq("student_id", currentUser.id)
            .maybeSingle();

          if (submissionData) {
            setHasSubmitted(true);
            setSubmissionScore(submissionData.score);
          }

          // Check subject enrollment status
          const { data: subjectEnrollmentData } = await supabase
            .from("subject_enrollments")
            .select("status")
            .eq("subject_id", quizData.subject_id)
            .eq("student_id", currentUser.id)
            .maybeSingle();

          if (subjectEnrollmentData) {
            setSubjectEnrollmentStatus({
              isEnrolled: subjectEnrollmentData.status === 'approved',
              isPending: subjectEnrollmentData.status === 'pending'
            });
          }

          // Check quiz enrollment status
          const { data: quizEnrollmentData } = await supabase
            .from("quiz_enrollments")
            .select("status")
            .eq("quiz_id", quizId)
            .eq("student_id", currentUser.id)
            .maybeSingle();

          if (quizEnrollmentData) {
            setQuizEnrollmentStatus({
              isEnrolled: quizEnrollmentData.status === 'approved',
              isPending: quizEnrollmentData.status === 'pending'
            });
          }
        }

        // Check for active quiz session
        const { data: sessionData } = await supabase
          .from("active_quiz_sessions")
          .select("*")
          .eq("quiz_id", quizId)
          .eq("status", "active")
          .maybeSingle();

        setActiveSession(sessionData);

        // Fetch leaderboard data for completed quizzes
        if (hasSubmitted || isTeacher) {
          const { data: leaderboardData, error: leaderboardError } = await supabase
            .from("quiz_submissions")
            .select(`
              score,
              submitted_at,
              student_id,
              profiles!inner(name)
            `)
            .eq("quiz_id", quizId)
            .order("score", { ascending: false })
            .limit(10);

          if (!leaderboardError && leaderboardData) {
            const formattedLeaderboard = leaderboardData.map((entry: any) => ({
              student_name: entry.profiles.name,
              student_id: entry.student_id,
              score: entry.score,
              submitted_at: entry.submitted_at
            }));
            setLeaderboard(formattedLeaderboard);
          }
        }

      } catch (error) {
        console.error("Error fetching quiz data:", error);
        toast.error("Failed to load quiz details");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId, currentUser, userType, hasSubmitted, isTeacher]);

  return {
    quiz,
    questions,
    loading,
    isTeacher,
    hasSubmitted,
    submissionScore,
    subjectEnrollmentStatus,
    quizEnrollmentStatus,
    activeSession,
    leaderboard,
    setActiveSession,
    setQuizEnrollmentStatus
  };
};
