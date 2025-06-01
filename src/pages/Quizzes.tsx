
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";
import { Book, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Quiz {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  created_at: string;
  subject: {
    name: string;
  };
  status?: 'completed' | 'active' | 'not_started';
}

const Quizzes = () => {
  const { currentUser } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const userType = currentUser?.user_metadata?.type || 'student';

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from("quizzes")
          .select(`
            *,
            subject:subjects(name)
          `);

        // If the user is a teacher, only fetch quizzes from their subjects
        if (userType === 'teacher' && currentUser?.id) {
          const { data: teacherSubjects } = await supabase
            .from("subjects")
            .select("id")
            .eq("teacher_id", currentUser.id);
          
          if (teacherSubjects && teacherSubjects.length > 0) {
            const subjectIds = teacherSubjects.map(subject => subject.id);
            query = query.in("subject_id", subjectIds);
          }
        }

        const { data: quizzesData, error } = await query;

        if (error) {
          throw error;
        }

        let quizzesWithStatus = quizzesData || [];

        // For students, get quiz statuses
        if (userType === 'student' && currentUser?.id && quizzesData?.length > 0) {
          const quizIds = quizzesData.map(quiz => quiz.id);

          // Get completed quizzes
          const { data: submissions } = await supabase
            .from("quiz_submissions")
            .select("quiz_id")
            .eq("student_id", currentUser.id)
            .in("quiz_id", quizIds);

          const completedQuizIds = submissions?.map(sub => sub.quiz_id) || [];

          // Get active quiz sessions
          const { data: activeSessions } = await supabase
            .from("active_quiz_sessions")
            .select("quiz_id")
            .eq("status", "active")
            .in("quiz_id", quizIds);

          const activeQuizIds = activeSessions?.map(session => session.quiz_id) || [];

          // Add status to each quiz
          quizzesWithStatus = quizzesData.map(quiz => ({
            ...quiz,
            status: completedQuizIds.includes(quiz.id) 
              ? 'completed' as const
              : activeQuizIds.includes(quiz.id)
              ? 'active' as const
              : 'not_started' as const
          }));
        }

        setQuizzes(quizzesWithStatus);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast.error("Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [currentUser?.id, userType]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
            Completed
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
            Active
          </Badge>
        );
      case 'not_started':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
            Not Started
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-edu-gray text-edu-primary">
            Quiz
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {userType === 'teacher' ? 'My Quizzes' : 'Available Quizzes'}
            </h1>
            <p className="text-muted-foreground">
              {userType === 'teacher' 
                ? 'Manage your teaching quizzes' 
                : 'Browse and participate in quizzes'}
            </p>
          </div>
          
          {userType === 'teacher' && (
            <Link to="/subjects">
              <Button className="self-start">
                <Plus size={18} className="mr-2" /> Create Quiz
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <Card className="bg-muted/40">
            <CardContent className="pt-6 text-center">
              <div className="mx-auto bg-edu-gray rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <FileText size={24} className="text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No Quizzes Found</h3>
              <p className="text-sm text-muted-foreground">
                {userType === 'teacher' 
                  ? "You haven't created any quizzes yet" 
                  : "There are no quizzes available right now"}
              </p>
              
              {userType === 'teacher' && (
                <Link to="/subjects">
                  <Button className="mt-4">
                    <Plus size={18} className="mr-2" /> Create Quiz
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <Link to={`/quizzes/${quiz.id}`} key={quiz.id} className="block group">
                <Card className="h-full group-hover:border-edu-primary group-hover:shadow-md transition-all">
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {quiz.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        <span>Subject: {quiz.subject?.name || 'Unknown'}</span>
                      </div>
                      
                      {getStatusBadge(quiz.status)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Quizzes;
