
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Question {
  id: string;
  text: string;
  options: string[];
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
}

const TakeQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!id || !currentUser) return;

      try {
        setLoading(true);
        
        // Check if quiz is active
        const { data: activeSession, error: activeSessionError } = await supabase
          .from("active_quiz_sessions")
          .select("*")
          .eq("quiz_id", id)
          .eq("status", "active")
          .maybeSingle();
          
        if (activeSessionError) throw activeSessionError;
        if (!activeSession) {
          toast.error("This quiz is not currently active");
          navigate(`/quizzes/${id}`);
          return;
        }
        
        // Check if student is enrolled
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
          navigate(`/quizzes/${id}`);
          return;
        }
        
        // Get quiz details
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("id, title, description")
          .eq("id", id)
          .single();
          
        if (quizError) throw quizError;
        setQuiz(quizData);
        
        // Get questions for this quiz
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("id, text, options, points")
          .eq("quiz_id", id);
          
        if (questionsError) throw questionsError;
        
        // Transform question options from JSON to arrays
        const formattedQuestions = questionsData.map((q: any) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')
        }));
        
        setQuestions(formattedQuestions);
        
        // Set a default quiz time limit (30 minutes)
        setTimeRemaining(30 * 60);
        
      } catch (error) {
        console.error("Error loading quiz:", error);
        toast.error("Failed to load quiz");
        navigate("/quizzes");
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizData();
  }, [id, currentUser, navigate]);
  
  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining === null || loading) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time runs out
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, loading]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleSubmitQuiz = async () => {
    if (!currentUser || !id || submitting) return;
    
    try {
      setSubmitting(true);
      
      // Here we'd calculate the score, but in a real app the scoring would happen server-side to prevent cheating
      // For demo purposes, we'll just submit the answers
      
      const submission = {
        quiz_id: id,
        student_id: currentUser.id,
        answers: answers,
        submitted_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from("quiz_submissions")
        .insert(submission);
        
      if (error) throw error;
      
      toast.success("Quiz submitted successfully!");
      navigate(`/quizzes/${id}/results`);
      
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };
  
  const currentQuestion = questions[currentQuestionIndex];
  const answeredQuestions = Object.keys(answers).length;
  
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{quiz?.title}</h1>
            <p className="text-muted-foreground">Answer all questions to complete the quiz</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge className={timeRemaining && timeRemaining < 300 ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
              Time Remaining: {timeRemaining !== null ? formatTime(timeRemaining) : "–:–"}
            </Badge>
            
            <Badge className="bg-green-100 text-green-800">
              {answeredQuestions}/{questions.length} Answered
            </Badge>
          </div>
        </div>
        
        {currentQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
                <Badge>{currentQuestion.points} points</Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-lg font-medium mb-4">{currentQuestion.text}</p>
              
              <RadioGroup 
                value={answers[currentQuestion.id]?.toString()} 
                onValueChange={(value) => handleAnswerSelect(currentQuestion.id, parseInt(value))}
                className="space-y-3"
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="text-base">
                      {String.fromCharCode(65 + index)}. {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              {currentQuestionIndex < questions.length - 1 ? (
                <Button onClick={handleNextQuestion}>
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmitQuiz}
                  disabled={answeredQuestions < questions.length || submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Submit Quiz
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
        
        <div className="grid grid-cols-10 gap-2">
          {questions.map((_, index) => (
            <Button
              key={index}
              variant={answers[questions[index]?.id] !== undefined ? "default" : "outline"}
              className={`h-10 w-10 p-0 ${currentQuestionIndex === index ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setCurrentQuestionIndex(index)}
            >
              {index + 1}
            </Button>
          ))}
        </div>
        
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleSubmitQuiz}
            disabled={answeredQuestions < questions.length || submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default TakeQuiz;
