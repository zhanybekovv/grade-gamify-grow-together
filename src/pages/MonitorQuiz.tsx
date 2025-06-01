
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Student {
  id: string;
  name: string;
  status: "not_started" | "in_progress" | "completed";
  submission_time?: string;
}

interface QuizSession {
  id: string;
  start_time: string;
  status: string;
}

const MonitorQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  
  useEffect(() => {
    const fetchQuizMonitorData = async () => {
      if (!id || !currentUser?.id) return;
      
      try {
        setLoading(true);
        
        // Verify user is the teacher for this quiz
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select(`
            title,
            subject:subjects(teacher_id)
          `)
          .eq("id", id)
          .single();
          
        if (quizError) throw quizError;
        if (quizData.subject.teacher_id !== currentUser.id) {
          toast.error("You don't have permission to monitor this quiz");
          navigate("/quizzes");
          return;
        }
        
        setQuizTitle(quizData.title);
        
        // Get active quiz session
        const { data: sessionData, error: sessionError } = await supabase
          .from('active_quiz_sessions')
          .select('*')
          .eq('quiz_id', id)
          .eq('status', 'active')
          .maybeSingle();
          
        if (sessionError) throw sessionError;
        if (!sessionData) {
          toast.error("This quiz is not currently active");
          navigate(`/quizzes/${id}`);
          return;
        }
        
        // Explicitly set the session data with the correct type
        setQuizSession({
          id: sessionData.id,
          start_time: sessionData.start_time,
          status: sessionData.status
        });
        
        // Get enrolled students - fixed the query to avoid profile self-reference
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("quiz_enrollments")
          .select(`
            student_id,
            student_profiles:profiles(name)
          `)
          .eq("quiz_id", id)
          .eq("status", "approved");
          
        if (enrollmentsError) throw enrollmentsError;
        
        // Get submissions to track progress
        const { data: submissions, error: submissionsError } = await supabase
          .from('quiz_submissions')
          .select('student_id, submitted_at')
          .eq('quiz_id', id);
          
        if (submissionsError) throw submissionsError;
        
        // Get students who have started but not submitted the quiz (in progress)
        const { data: inProgressData, error: inProgressError } = await supabase
          .from('active_quiz_participation')
          .select('student_id, status')
          .eq('quiz_id', id)
          .eq('status', 'in_progress');
          
        if (inProgressError) {
          console.error("Error fetching in-progress students:", inProgressError);
          // Continue execution even if this query fails
        }
        
        // Format student data with submission status
        const formattedStudents: Student[] = enrollments.map((enrollment: any) => {
          const studentId = enrollment.student_id;
          const submission = submissions?.find((s: any) => s.student_id === studentId);
          const inProgress = inProgressData?.find((p: any) => p.student_id === studentId);
          
          let status: "not_started" | "in_progress" | "completed" = "not_started";
          
          if (submission) {
            status = "completed";
          } else if (inProgress) {
            status = "in_progress";
          }
          
          return {
            id: studentId,
            name: enrollment.student_profiles.name,
            status: status,
            submission_time: submission?.submitted_at,
          };
        });
        
        setEnrolledStudents(formattedStudents);
        setCompletedCount(formattedStudents.filter(s => s.status === "completed").length);
        setInProgressCount(formattedStudents.filter(s => s.status === "in_progress").length);
        
      } catch (error) {
        console.error("Error loading quiz monitor data:", error);
        toast.error("Failed to load quiz monitoring data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizMonitorData();
    
    // Set up a polling interval to refresh data
    const interval = setInterval(fetchQuizMonitorData, 10000);
    return () => clearInterval(interval);
    
  }, [id, currentUser?.id, navigate]);
  
  const handleEndQuiz = async () => {
    if (!quizSession?.id) return;
    
    try {
      // Update the quiz session status to "ended" instead of "completed"
      const { error } = await supabase
        .from('active_quiz_sessions')
        .update({ 
          status: "ended",
          end_time: new Date().toISOString()
        })
        .eq("id", quizSession.id);
        
      if (error) throw error;
      
      toast.success("Quiz has been ended");
      navigate(`/quizzes/${id}/results`);
      
    } catch (error) {
      console.error("Error ending quiz:", error);
      toast.error("Failed to end quiz");
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading quiz monitor...</p>
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
            <h1 className="text-2xl font-bold">Monitoring: {quizTitle}</h1>
            <p className="text-muted-foreground">Track student progress in real-time</p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">End Quiz</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will end the quiz for all students. Any student who hasn't submitted will have their current answers auto-submitted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEndQuiz}>End Quiz</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Started</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {quizSession?.start_time ? new Date(quizSession.start_time).toLocaleTimeString() : "N/A"}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Enrolled Students</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {enrolledStudents.length}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>In Progress</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {inProgressCount}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Completed</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {completedCount}
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Student Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {enrolledStudents.length > 0 ? (
              <div className="space-y-4">
                {enrolledStudents.map(student => (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{student.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {student.status === "completed" && (
                        <p className="text-sm text-gray-600">
                          Submitted: {new Date(student.submission_time!).toLocaleTimeString()}
                        </p>
                      )}
                      <Badge
                        className={
                          student.status === "completed" 
                            ? "bg-green-100 text-green-800" 
                            : student.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {student.status === "completed" 
                          ? "Completed" 
                          : student.status === "in_progress"
                          ? "In Progress"
                          : "Not Started"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No students enrolled in this quiz</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MonitorQuiz;
