import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Play, Clock, Users, Award, Trophy, Medal, UserPlus } from "lucide-react";
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

interface QuizEnrollmentStatus {
  isEnrolled: boolean;
  isPending: boolean;
}

interface LeaderboardEntry {
  student_name: string;
  student_id: string;
  score: number;
  submitted_at: string;
}

const QuizDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionScore, setSubmissionScore] = useState<number | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>({
    isEnrolled: false,
    isPending: false
  });
  const [quizEnrollmentStatus, setQuizEnrollmentStatus] = useState<QuizEnrollmentStatus>({
    isEnrolled: false,
    isPending: false
  });
  const [activeSession, setActiveSession] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const userType = currentUser?.user_metadata?.type || 'student';

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!id || !currentUser) return;

      try {
        setLoading(true);

        // Fetch quiz with subject details
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select(`
            *,
            subject:subjects(name, teacher_id)
          `)
          .eq("id", id)
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
          .eq("quiz_id", id);

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
            .eq("quiz_id", id)
            .eq("student_id", currentUser.id)
            .maybeSingle();

          if (submissionData) {
            setHasSubmitted(true);
            setSubmissionScore(submissionData.score);
          }

          // Check subject enrollment status
          const { data: enrollmentData } = await supabase
            .from("subject_enrollments")
            .select("status")
            .eq("subject_id", quizData.subject_id)
            .eq("student_id", currentUser.id)
            .maybeSingle();

          if (enrollmentData) {
            setEnrollmentStatus({
              isEnrolled: enrollmentData.status === 'approved',
              isPending: enrollmentData.status === 'pending'
            });
          }

          // Check quiz enrollment status
          const { data: quizEnrollmentData } = await supabase
            .from("quiz_enrollments")
            .select("status")
            .eq("quiz_id", id)
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
          .eq("quiz_id", id)
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
            .eq("quiz_id", id)
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
  }, [id, currentUser, userType, hasSubmitted, isTeacher]);

  const startQuizSession = async () => {
    try {
      const { error } = await supabase
        .from("active_quiz_sessions")
        .insert({
          quiz_id: id,
          teacher_id: currentUser?.id,
          status: "active"
        });

      if (error) throw error;

      toast.success("Quiz session started successfully");
      
      // Refresh the active session data
      const { data: sessionData } = await supabase
        .from("active_quiz_sessions")
        .select("*")
        .eq("quiz_id", id)
        .eq("status", "active")
        .single();

      setActiveSession(sessionData);
    } catch (error) {
      console.error("Error starting quiz session:", error);
      toast.error("Failed to start quiz session");
    }
  };

  const stopQuizSession = async () => {
    try {
      const { error } = await supabase
        .from("active_quiz_sessions")
        .update({ status: "ended", end_time: new Date().toISOString() })
        .eq("quiz_id", id)
        .eq("status", "active");

      if (error) throw error;

      toast.success("Quiz session ended successfully");
      setActiveSession(null);
    } catch (error) {
      console.error("Error stopping quiz session:", error);
      toast.error("Failed to stop quiz session");
    }
  };

  const requestQuizEnrollment = async () => {
    try {
      const { error } = await supabase
        .from("quiz_enrollments")
        .insert({
          quiz_id: id,
          student_id: currentUser?.id,
          status: "pending"
        });

      if (error) throw error;

      toast.success("Quiz enrollment request sent successfully");
      setQuizEnrollmentStatus({ isEnrolled: false, isPending: true });
    } catch (error) {
      console.error("Error requesting quiz enrollment:", error);
      toast.error("Failed to send quiz enrollment request");
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 1:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 2:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading quiz details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p>Quiz not found</p>
          </div>
        </main>
      </div>
    );
  }

  // Determine if student can access quiz
  const canAccessQuiz = enrollmentStatus.isEnrolled || quizEnrollmentStatus.isEnrolled;
  const hasAnyEnrollmentRequest = enrollmentStatus.isPending || quizEnrollmentStatus.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground">{quiz.description}</p>
          <p className="text-sm text-muted-foreground mt-1">Subject: {quiz.subject.name}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Quiz Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                Quiz Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Questions:</span>
                <Badge variant="outline">{questions.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Points:</span>
                <Badge variant="outline">
                  {questions.reduce((sum, q) => sum + q.points, 0)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created:</span>
                <span className="text-sm">{new Date(quiz.created_at).toLocaleDateString()}</span>
              </div>
              
              {activeSession && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className="bg-green-100 text-green-800">
                    <Clock size={14} className="mr-1" />
                    Active Session
                  </Badge>
                </div>
              )}

              {hasSubmitted && submissionScore !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your Score:</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {submissionScore} points
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                {isTeacher ? "Manage your quiz" : "Take the quiz or view results"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isTeacher ? (
                <>
                  {!activeSession ? (
                    <Button onClick={startQuizSession} className="w-full">
                      <Play size={18} className="mr-2" />
                      Start Quiz Session
                    </Button>
                  ) : (
                    <Button onClick={stopQuizSession} variant="destructive" className="w-full">
                      <Clock size={18} className="mr-2" />
                      End Quiz Session
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/monitor-quiz/${id}`)}
                    className="w-full"
                  >
                    <Users size={18} className="mr-2" />
                    Monitor Quiz
                  </Button>
                </>
              ) : (
                <>
                  {!canAccessQuiz ? (
                    <div className="space-y-3">
                      {!hasAnyEnrollmentRequest ? (
                        <>
                          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800 mb-2">
                              You need to be enrolled to take this quiz
                            </p>
                            <p className="text-xs text-yellow-700">
                              You can either join the subject or request access to just this quiz
                            </p>
                          </div>
                          <Button 
                            onClick={requestQuizEnrollment}
                            variant="outline" 
                            className="w-full"
                          >
                            <UserPlus size={18} className="mr-2" />
                            Request Quiz Access
                          </Button>
                        </>
                      ) : (
                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800">
                            {enrollmentStatus.isPending 
                              ? "Your subject enrollment request is pending approval"
                              : "Your quiz enrollment request is pending approval"
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  ) : !activeSession ? (
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">
                        Quiz session is not currently active
                      </p>
                    </div>
                  ) : hasSubmitted ? (
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/quiz-results/${id}`)}
                      className="w-full"
                    >
                      View Results
                    </Button>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <Play size={18} className="mr-2" />
                          Take Quiz
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Start Quiz: {quiz.title}</DialogTitle>
                          <DialogDescription>
                            This quiz has {questions.length} questions worth a total of{" "}
                            {questions.reduce((sum, q) => sum + q.points, 0)} points.
                            Make sure you have a stable internet connection.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline">Cancel</Button>
                          <Button onClick={() => navigate(`/take-quiz/${id}`)}>
                            Start Quiz
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard for completed quizzes */}
        {(hasSubmitted || isTeacher) && leaderboard.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Quiz Leaderboard
              </CardTitle>
              <CardDescription>Top performers on this quiz</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.student_id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      entry.student_id === currentUser?.id 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getRankIcon(index)}
                      <div>
                        <p className="font-medium">{entry.student_name}</p>
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(entry.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={index < 3 ? "default" : "outline"}>
                        {entry.score} points
                      </Badge>
                      {entry.student_id === currentUser?.id && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          You
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default QuizDetail;
