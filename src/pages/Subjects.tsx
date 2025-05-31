
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";
import { Book, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Subject {
  id: string;
  name: string;
  description: string;
  created_at: string;
  teacher_id: string;
  student_count?: number;
}

const Subjects = () => {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const userType = currentUser?.user_metadata?.type || 'student';

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        let query = supabase.from("subjects").select('*');
        
        // If user is a teacher, only show their subjects
        if (userType === 'teacher' && currentUser?.id) {
          query = query.filter('teacher_id', 'eq', currentUser.id);
        }

        const { data: subjectsData, error } = await query
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (subjectsData) {
          // Fetch student counts for each subject
          const subjectsWithCounts = await Promise.all(
            subjectsData.map(async (subject) => {
              const { data: enrollments, error: enrollmentError } = await supabase
                .from("subject_enrollments")
                .select("student_id", { count: "exact" })
                .eq("subject_id", subject.id)
                .eq("status", "approved");

              if (enrollmentError) {
                console.error("Error fetching enrollments for subject:", subject.id, enrollmentError);
                return { ...subject, student_count: 0 };
              }

              return { ...subject, student_count: enrollments?.length || 0 };
            })
          );

          setSubjects(subjectsWithCounts);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast.error("Failed to load subjects");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [currentUser?.id, userType]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {userType === 'teacher' ? 'My Subjects' : 'Available Subjects'}
            </h1>
            <p className="text-muted-foreground">
              {userType === 'teacher' 
                ? 'Manage your teaching subjects' 
                : 'Browse and enroll in subjects'}
            </p>
          </div>
          
          {userType === 'teacher' && (
            <Link to="/subjects/new">
              <Button className="self-start">
                <Plus size={18} className="mr-2" /> New Subject
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading subjects...</p>
          </div>
        ) : subjects.length === 0 ? (
          <Card className="bg-muted/40">
            <CardContent className="pt-6 text-center">
              <div className="mx-auto bg-edu-gray rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <Book size={24} className="text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No Subjects Found</h3>
              <p className="text-sm text-muted-foreground">
                {userType === 'teacher' 
                  ? "You haven't created any subjects yet" 
                  : "There are no subjects available right now"}
              </p>
              
              {userType === 'teacher' && (
                <Link to="/subjects/new">
                  <Button className="mt-4">
                    <Plus size={18} className="mr-2" /> Create Subject
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Link to={`/subjects/${subject.id}`} key={subject.id} className="block group">
                <Card className="h-full group-hover:border-edu-primary group-hover:shadow-md transition-all">
                  <CardHeader>
                    <CardTitle>{subject.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {subject.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Users size={16} />
                        <span>{subject.student_count} Student{subject.student_count !== 1 ? 's' : ''}</span>
                      </div>
                      
                      <Badge variant="outline" className="bg-edu-gray text-edu-primary">
                        Subject
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            
            {userType === 'teacher' && (
              <Link to="/subjects/new" className="block group">
                <Card className="h-full border-dashed border-2 flex items-center justify-center p-6 group-hover:border-edu-primary transition-all">
                  <div className="text-center">
                    <div className="mx-auto bg-edu-gray rounded-full w-12 h-12 flex items-center justify-center mb-2 group-hover:bg-edu-primary/10">
                      <Book size={24} className="text-edu-primary" />
                    </div>
                    <h3 className="font-medium mb-1">Create New Subject</h3>
                    <p className="text-sm text-gray-500">Add a new course or class</p>
                  </div>
                </Card>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Subjects;
