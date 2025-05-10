
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Award } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface QuizSubmission {
  id: string;
  answers: Record<string, number>;
  score: number;
  submitted_at: string;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correct_option_index: number;
  points: number;
}

interface QuizDetails {
  id: string;
  title: string;
  description: string;
  subject: {
    name: string;
  };
}

const QuizResults = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [scorePercentage, setScorePercentage] = useState(0);
  
  useEffect(() => {
    const fetchResults = async () => {
      if (!id || !currentUser) return;

      try {
        setLoading(true);
        
        // Get quiz details
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select(`
            id, 
            title, 
            description,
            subject:subjects(name)
          `)
          .eq("id", id)
          .single();
          
        if (quizError) throw quizError;
        setQuiz(quizData);
        
        // Get submission
        const { data: submissionData, error: submissionError } = await supabase
          .from("quiz_submissions")
          .select("*")
          .eq("quiz_id", id)
          .eq("student_id", currentUser.id)
          .order('submitted_at', { ascending: false })
          .maybeSingle();
          
        if (submissionError) throw submissionError;
        
        if (!submissionData) {
          toast.error("No quiz submission found");
          navigate(`/quizzes/${id}`);
          return;
        }
        
        // Parse the JSON answers if they're stored as a string
        const parsedAnswers = typeof submissionData.answers === 'string' 
          ? JSON.parse(submissionData.answers) 
          : submissionData.answers;
        
        const parsedSubmission: QuizSubmission = {
          id: submissionData.id,
          answers: parsedAnswers,
          score: submissionData.score,
          submitted_at: submissionData.submitted_at
        };
        
        setSubmission(parsedSubmission);
        
        // Get questions
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", id);
          
        if (questionsError) throw questionsError;
        
        // Transform questions data
        const formattedQuestions = questionsData.map((q: any) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')
        }));
        
        setQuestions(formattedQuestions);
        
        // Calculate total possible points
        const totalPossiblePoints = formattedQuestions.reduce((sum, q) => sum + q.points, 0);
        setTotalPoints(totalPossiblePoints);
        
        // Calculate score percentage
        if (submissionData.score !== null && totalPossiblePoints > 0) {
          setScorePercentage(Math.round((submissionData.score / totalPossiblePoints) * 100));
        }
        
      } catch (error) {
        console.error("Error loading quiz results:", error);
        toast.error("Failed to load quiz results");
        navigate("/quizzes");
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [id, currentUser, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading quiz results...</p>
          </div>
        </main>
      </div>
    );
  }

  // Calculate correct and incorrect answers for pie chart
  const correctCount = questions.filter(q => 
    submission?.answers?.[q.id] === q.correct_option_index
  ).length;
  
  const incorrectCount = questions.filter(q => 
    submission?.answers?.[q.id] !== undefined && 
    submission?.answers?.[q.id] !== q.correct_option_index
  ).length;
  
  const pieChartData = [
    { name: "correct", value: correctCount, color: "#10b981" }, // green
    { name: "incorrect", value: incorrectCount, color: "#ef4444" } // red
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{quiz?.title} - Results</h1>
          <p className="text-muted-foreground">{quiz?.subject?.name}</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Your Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {submission?.score} / {totalPoints}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Percentage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {scorePercentage}%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg">
                {submission?.submitted_at && new Date(submission.submitted_at).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {questions.length > 0 && submission?.answers && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={90}
                        innerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-8 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                      <span>Correct ({correctCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                      <span>Incorrect ({incorrectCount})</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Question Review</CardTitle>
                <CardDescription>Review your answers and correct solutions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Your Answer</TableHead>
                      <TableHead>Correct Answer</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question) => {
                      const userAnswerIndex = submission?.answers?.[question.id];
                      const isCorrect = userAnswerIndex === question.correct_option_index;
                      
                      return (
                        <TableRow key={question.id}>
                          <TableCell className="font-medium max-w-xs truncate">
                            {question.text}
                          </TableCell>
                          <TableCell>
                            {userAnswerIndex !== undefined ? 
                              question.options[userAnswerIndex] : 
                              "Not answered"}
                          </TableCell>
                          <TableCell>
                            {question.options[question.correct_option_index]}
                          </TableCell>
                          <TableCell>
                            {isCorrect ? question.points : 0} / {question.points}
                          </TableCell>
                          <TableCell>
                            {isCorrect ? (
                              <span className="flex items-center text-green-600">
                                <Check className="mr-1" size={16} />
                                Correct
                              </span>
                            ) : (
                              <span className="flex items-center text-red-600">
                                <X className="mr-1" size={16} />
                                Incorrect
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <div className="mt-6 flex justify-center">
              <Button onClick={() => navigate("/quizzes")}>
                Return to Quizzes
              </Button>
            </div>
          </>
        )}
        
        {scorePercentage >= 70 && (
          <div className="fixed bottom-4 right-4">
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg flex items-center">
              <Award className="mr-2" />
              <span>Congratulations! You passed the quiz with {scorePercentage}%</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizResults;
