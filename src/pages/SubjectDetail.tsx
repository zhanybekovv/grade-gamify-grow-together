
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";
import { Book, Plus, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Subject {
  id: string;
  name: string;
  description: string;
  teacher_id: string;
  created_at: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  created_at: string;
}

const SubjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjectAndQuizzes = async () => {
      setLoading(true);
      try {
        if (!id) return;

        // Fetch subject details
        const { data: subjectData, error: subjectError } = await supabase
          .from("subjects")
          .select("*")
          .eq("id", id)
          .single();

        if (subjectError) {
          throw subjectError;
        }

        setSubject(subjectData);
        
        // Check if current user is the teacher
        if (currentUser && subjectData.teacher_id === currentUser.id) {
          setIsTeacher(true);
        }

        // Fetch quizzes for this subject
        const { data: quizzesData, error: quizzesError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("subject_id", id)
          .order("created_at", { ascending: false });

        if (quizzesError) {
          throw quizzesError;
        }

        setQuizzes(quizzesData || []);
      } catch (error) {
        console.error("Error fetching subject data:", error);
        toast.error("Failed to load subject details");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectAndQuizzes();
  }, [id, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading subject details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p>Subject not found</p>
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
            <h1 className="text-2xl font-bold">{subject.name}</h1>
            <p className="text-muted-foreground">{subject.description}</p>
          </div>
          
          {isTeacher && (
            <Button 
              onClick={() => navigate(`/subjects/${id}/quiz/new`)} 
              className="self-start"
            >
              <Plus size={18} className="mr-2" /> Add Quiz
            </Button>
          )}
        </div>

        <section>
          <h2 className="text-xl font-bold mb-4">Quizzes</h2>
          
          {quizzes.length === 0 ? (
            <Card className="bg-muted/40">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto bg-edu-gray rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <FileText size={24} className="text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No Quizzes Yet</h3>
                <p className="text-sm text-muted-foreground">
                  {isTeacher 
                    ? "Create your first quiz for this subject" 
                    : "No quizzes have been added to this subject yet"}
                </p>
                
                {isTeacher && (
                  <Button 
                    className="mt-4" 
                    onClick={() => navigate(`/subjects/${id}/quiz/new`)}
                  >
                    <Plus size={18} className="mr-2" /> Create Quiz
                  </Button>
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
                    <CardContent className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-edu-gray text-edu-primary">
                        Quiz
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              
              {isTeacher && (
                <Link to={`/subjects/${id}/quiz/new`} className="block group">
                  <Card className="h-full border-dashed border-2 flex items-center justify-center p-6 group-hover:border-edu-primary transition-all">
                    <div className="text-center">
                      <div className="mx-auto bg-edu-gray rounded-full w-12 h-12 flex items-center justify-center mb-2 group-hover:bg-edu-primary/10">
                        <Plus size={24} className="text-edu-primary" />
                      </div>
                      <h3 className="font-medium mb-1">Create New Quiz</h3>
                      <p className="text-sm text-gray-500">Add a quiz to this subject</p>
                    </div>
                  </Card>
                </Link>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SubjectDetail;
