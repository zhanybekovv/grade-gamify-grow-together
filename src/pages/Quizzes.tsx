
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
  }
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
        if (userType === 'teacher' && currentUser) {
          const { data: teacherSubjects } = await supabase
            .from("subjects")
            .select("id")
            .eq("teacher_id", currentUser.id);
          
          if (teacherSubjects && teacherSubjects.length > 0) {
            const subjectIds = teacherSubjects.map(subject => subject.id);
            query = query.in("subject_id", subjectIds);
          }
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setQuizzes(data || []);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast.error("Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [currentUser, userType]);

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
                      
                      <Badge variant="outline" className="bg-edu-gray text-edu-primary">
                        Quiz
                      </Badge>
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
