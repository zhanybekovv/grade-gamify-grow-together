
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";
import { FileText, Users, Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

interface Quiz {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  created_at: string;
  subject: {
    name: string;
    teacher_id: string;
  }
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
  enrollmentId?: string;
}

const QuizDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<number>(0);
  const [pendingStudents, setPendingStudents] = useState<number>(0);
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>({
    isEnrolled: false,
    isPending: false
  });
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isConfirmStartOpen, setIsConfirmStartOpen] = useState(false);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      setLoading(true);
      try {
        if (!id || !currentUser) return;

        // Fetch quiz details
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
        if (currentUser && quizData.subject.teacher_id === currentUser.id) {
          setIsTeacher(true);
        }

        // Fetch questions for this quiz
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", id);
        console.log('questionsData', questionsData);
        if (questionsError) throw questionsError;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const questionsWithCorrectType = questionsData.map((question: any) => ({
          ...question,
          options: [...question.options],
          points: question.points || 0
        }))
        setQuestions(questionsWithCorrectType || []);

        // Check enrollment counts
        const { data: enrolledCount, error: enrolledError } = await supabase
          .from("quiz_enrollments")
          .select("*", { count: "exact" })
          .eq("quiz_id", id)
          .eq("status", "approved");

        if (enrolledError) throw enrolledError;
        setEnrolledStudents(enrolledCount?.length || 0);

        const { data: pendingCount, error: pendingError } = await supabase
          .from("quiz_enrollments")
          .select("*", { count: "exact" })
          .eq("quiz_id", id)
          .eq("status", "pending");

        if (pendingError) throw pendingError;
        setPendingStudents(pendingCount?.length || 0);

        // Check enrollment status for students
        if (currentUser && !isTeacher) {
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from("quiz_enrollments")
            .select("*")
            .eq("quiz_id", id)
            .eq("student_id", currentUser.id)
            .single();

          if (!enrollmentError && enrollmentData) {
            setEnrollmentStatus({
              isEnrolled: enrollmentData.status === 'approved',
              isPending: enrollmentData.status === 'pending',
              enrollmentId: enrollmentData.id
            });
          }
        }

        // Check if quiz is active
        // For now, just a placeholder - we'd typically check a status field
        // TODO: Add a status field to quizzes table in a future update
        setIsQuizActive(false);

      } catch (error) {
        console.error("Error fetching quiz details:", error);
        toast.error("Failed to load quiz details");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [id, currentUser, isTeacher]);

  const handleEnrollRequest = async () => {
    try {
      if (!currentUser || !id) return;

      const { error } = await supabase
        .from("quiz_enrollments")
        .insert({
          quiz_id: id,
          student_id: currentUser.id,
          status: 'pending'
        });

      if (error) throw error;

      setEnrollmentStatus({
        isEnrolled: false,
        isPending: true
      });
      
      // Update pending count
      setPendingStudents(prev => prev + 1);
      
      toast.success("Quiz enrollment request sent");
    } catch (error) {
      console.error("Error requesting enrollment:", error);
      toast.error("Failed to send enrollment request");
    }
  };

  const handleCancelRequest = async () => {
    try {
      if (!enrollmentStatus.enrollmentId) return;

      const { error } = await supabase
        .from("quiz_enrollments")
        .delete()
        .eq("id", enrollmentStatus.enrollmentId);

      if (error) throw error;

      setEnrollmentStatus({
        isEnrolled: false,
        isPending: false
      });
      
      // Update pending count
      setPendingStudents(prev => prev - 1);
      
      toast.success("Enrollment request cancelled");
    } catch (error) {
      console.error("Error cancelling enrollment:", error);
      toast.error("Failed to cancel request");
    }
  };

  const handleStartQuiz = async () => {
    try {
      // TODO: Add an actual quiz status field in database
      // For now we'll just simulate it
      setIsQuizActive(true);
      toast.success("Quiz has been started!");
      setIsConfirmStartOpen(false);
      
      // In a real implementation, we would:
      // 1. Update quiz status in database
      // 2. Notify enrolled students
      // 3. Redirect teacher to quiz monitoring page
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast.error("Failed to start quiz");
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <p className="text-muted-foreground">{quiz.description}</p>
            <p className="text-sm text-edu-primary mt-1">
              Subject: {quiz.subject?.name || "Unknown"}
            </p>
          </div>
          
          <div className="flex gap-2">
            {!isTeacher && (
              <>
                {enrollmentStatus.isEnrolled ? (
                  <Badge className="bg-green-100 text-green-800 h-10 px-4 flex items-center">
                    <Users size={16} className="mr-2" /> Enrolled
                  </Badge>
                ) : enrollmentStatus.isPending ? (
                  <>
                    <Badge className="bg-yellow-100 text-yellow-800 h-10 px-4 flex items-center">
                      Pending Approval
                    </Badge>
                    <Button variant="outline" onClick={handleCancelRequest}>
                      Cancel Request
                    </Button>
                  </>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Enroll in Quiz</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enroll in {quiz.title}</DialogTitle>
                        <DialogDescription>
                          Your request will be sent to the teacher for approval.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => {}}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleEnrollRequest}>Send Request</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}

            {isTeacher && (
              <Dialog open={isConfirmStartOpen} onOpenChange={setIsConfirmStartOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={enrolledStudents === 0 || isQuizActive}
                  >
                    <Play size={16} className="mr-2" /> 
                    {isQuizActive ? "Quiz Active" : "Start Quiz"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start Quiz</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to start this quiz for all enrolled students?
                      {pendingStudents > 0 && (
                        <div className="mt-2 text-yellow-600">
                          Note: There are still {pendingStudents} pending enrollment requests.
                        </div>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsConfirmStartOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleStartQuiz}>
                      Start Quiz
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                    <p>{quiz.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Number of Questions</h3>
                    <p>{questions.length}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Points</h3>
                    <p>
                      {questions.reduce((sum, q) => sum + (q.points || 0), 0)} points
                    </p>
                  </div>

                  {isTeacher && (
                    <div className="pt-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Preview Questions</h3>
                      {questions.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {questions.map((question, index) => (
                            <Card key={question.id} className="shadow-sm">
                              <CardContent className="p-4">
                                <p className="font-medium mb-2">
                                  {index + 1}. {question.text}
                                </p>
                                <div className="pl-4 space-y-1">
                                  {question.options.map((option, optIndex) => (
                                    <div key={optIndex} className="flex items-center">
                                      <span className={optIndex === question.correct_option_index ? "text-green-600 font-medium" : ""}>
                                        {String.fromCharCode(65 + optIndex)}. {option}
                                      </span>
                                      {optIndex === question.correct_option_index && (
                                        <Badge className="ml-2 bg-green-100 text-green-800">Correct</Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-2 text-sm text-right text-muted-foreground">
                                  {question.points} points
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No questions added yet</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <Badge className={isQuizActive ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                      {isQuizActive ? "Active" : "Not Started"}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Enrolled Students</h3>
                    <p>{enrolledStudents}</p>
                  </div>
                  
                  {isTeacher && pendingStudents > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Pending Enrollments</h3>
                      <div className="flex items-center">
                        <p>{pendingStudents}</p>
                        <Button 
                          variant="link" 
                          className="text-edu-primary ml-2 p-0 h-auto" 
                          onClick={() => navigate("/requests")}
                        >
                          View Requests
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {!isTeacher && (
                    <div className="pt-4">
                      <p className="text-sm text-muted-foreground">
                        {enrollmentStatus.isEnrolled 
                          ? "You're enrolled in this quiz! Wait for the teacher to start it."
                          : enrollmentStatus.isPending
                          ? "Your enrollment request is pending approval."
                          : "Enroll to participate in this quiz."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuizDetail;
