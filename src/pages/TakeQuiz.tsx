import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: string;
  text: string;
  options: string[];
  correct_option_index: number;
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  subject_id: string;
}

const TakeQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [participationId, setParticipationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!id || !currentUser?.id) return;

      try {
        setLoading(true);

        // First, check if user has already submitted this quiz
        const { data: existingSubmission, error: submissionError } = await supabase
          .from("quiz_submissions")
          .select("id")
          .eq("quiz_id", id)
          .eq("student_id", currentUser.id)
          .maybeSingle();

        if (submissionError) throw submissionError;

        if (existingSubmission) {
          toast.success("Quiz already completed. Redirecting to results...");
          navigate(`/quizzes/${id}/results`);
          return;
        }

        // Check if user is enrolled and quiz is active
        const { data: enrollment, error: enrollmentError } = await supabase
          .from("quiz_enrollments")
          .select("*")
          .eq("quiz_id", id)
          .eq("student_id", currentUser.id)
          .eq("status", "approved")
          .maybeSingle();

        if (enrollmentError) throw enrollmentError;

        if (!enrollment) {
          toast.error("You are not enrolled in this quiz");
          navigate("/quizzes");
          return;
        }

        // Check if quiz has an active session
        const { data: session, error: sessionError } = await supabase
          .from("active_quiz_sessions")
          .select("*")
          .eq("quiz_id", id)
          .eq("status", "active")
          .maybeSingle();

        if (sessionError) throw sessionError;

        if (!session) {
          toast.error("This quiz is not currently active");
          navigate("/quizzes");
          return;
        }

        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", id)
          .single();

        if (quizError) throw quizError;

        setQuiz(quizData);

        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", id)
          .order("created_at");

        if (questionsError) throw questionsError;

        const formattedQuestions: Question[] = questionsData.map((q: any) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          correct_option_index: q.correct_option_index,
          points: q.points,
        }));

        setQuestions(formattedQuestions);

        // Record quiz participation start
        const { data: participationData, error: participationError } = await supabase
          .from("active_quiz_participation")
          .insert({
            quiz_id: id,
            student_id: currentUser.id,
            status: "in_progress"
          })
          .select("id")
          .single();

        if (participationError) {
          console.error("Error recording participation:", participationError);
        } else {
          setParticipationId(participationData.id);
        }

        // Calculate time remaining (assuming 30 minutes quiz duration)
        const startTime = new Date(session.start_time).getTime();
        const quizDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
        const endTime = startTime + quizDuration;
        const now = new Date().getTime();
        const remaining = Math.max(0, endTime - now);

        setTimeRemaining(remaining);

      } catch (error) {
        console.error("Error loading quiz:", error);
        toast.error("Failed to load quiz");
        navigate("/quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [id, currentUser?.id, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1000) {
          handleSubmit();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Update last activity every 30 seconds
  useEffect(() => {
    if (!participationId) return;

    const updateActivity = async () => {
      try {
        await supabase
          .from("active_quiz_participation")
          .update({ last_activity: new Date().toISOString() })
          .eq("id", participationId);
      } catch (error) {
        console.error("Error updating activity:", error);
      }
    };

    const interval = setInterval(updateActivity, 30000);
    return () => clearInterval(interval);
  }, [participationId]);

  const handleAnswerChange = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (!quiz || !currentUser?.id || submitting) return;

    try {
      setSubmitting(true);

      // Calculate score
      let totalScore = 0;
      const submissionAnswers: Record<string, number> = {};

      questions.forEach(question => {
        const userAnswer = answers[question.id];
        submissionAnswers[question.id] = userAnswer ?? -1;
        
        if (userAnswer === question.correct_option_index) {
          totalScore += question.points;
        }
      });

      // Submit answers
      const { error: submissionError } = await supabase
        .from("quiz_submissions")
        .insert({
          quiz_id: quiz.id,
          student_id: currentUser.id,
          answers: submissionAnswers,
          score: totalScore,
        });

      if (submissionError) throw submissionError;

      // Remove from active participation
      if (participationId) {
        const { error: participationError } = await supabase
          .from("active_quiz_participation")
          .delete()
          .eq("id", participationId);

        if (participationError) {
          console.error("Error removing participation:", participationError);
        }
      }

      toast.success("Quiz submitted successfully!");
      navigate(`/quizzes/${quiz.id}/results`);

    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading quiz...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
            <p className="text-muted-foreground">This quiz could not be loaded.</p>
            <Button onClick={() => navigate("/quizzes")} className="mt-4">
              Back to Quizzes
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            {timeRemaining !== null && (
              <div className="text-lg font-semibold text-red-600">
                Time: {formatTime(timeRemaining)}
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-6">{currentQuestion.text}</p>
            
            <RadioGroup
              value={answers[currentQuestion.id]?.toString() || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length !== questions.length}
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            >
              Next
            </Button>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Answered: {Object.keys(answers).length} of {questions.length} questions
          </p>
        </div>
      </main>
    </div>
  );
};

export default TakeQuiz;
