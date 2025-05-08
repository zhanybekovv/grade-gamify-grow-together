
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Book, Award, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import "./styles.css";

interface Subject {
  id: string;
  name: string;
  description: string;
  students_count: number;
  pending_students_count: number;
  quizzes_count: number;
}

const TeacherDashboard = () => {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPendingRequests, setTotalPendingRequests] = useState(0);
  
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!currentUser?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch subjects with student counts
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select(`
            id, 
            name, 
            description
          `)
          .eq("teacher_id", currentUser.id);
        
        if (subjectsError) throw subjectsError;
        
        if (subjectsData) {
          const enhancedSubjects = await Promise.all(subjectsData.map(async (subject) => {
            // Get enrolled students count
            const { count: studentsCount, error: studentsError } = await supabase
              .from("subject_enrollments")
              .select("*", { count: true, head: true })
              .eq("subject_id", subject.id)
              .eq("status", "approved");
            
            if (studentsError) console.error("Error fetching students:", studentsError);
            
            // Get pending enrollment requests count
            const { count: pendingCount, error: pendingError } = await supabase
              .from("subject_enrollments")
              .select("*", { count: true, head: true })
              .eq("subject_id", subject.id)
              .eq("status", "pending");
            
            if (pendingError) console.error("Error fetching pending requests:", pendingError);
            
            // Get quizzes count
            const { count: quizzesCount, error: quizzesError } = await supabase
              .from("quizzes")
              .select("*", { count: true, head: true })
              .eq("subject_id", subject.id);
            
            if (quizzesError) console.error("Error fetching quizzes:", quizzesError);
            
            return {
              ...subject,
              students_count: studentsCount || 0,
              pending_students_count: pendingCount || 0,
              quizzes_count: quizzesCount || 0
            };
          }));
          
          setSubjects(enhancedSubjects);
          
          // Calculate total unique students across all subjects
          if (enhancedSubjects.length > 0) {
            const { data: uniqueStudents, error: uniqueError } = await supabase
              .from("subject_enrollments")
              .select("student_id")
              .eq("status", "approved")
              .in("subject_id", enhancedSubjects.map(s => s.id));
            
            if (uniqueError) throw uniqueError;
            
            // Count unique student IDs
            const uniqueStudentIds = new Set(uniqueStudents?.map(entry => entry.student_id));
            setTotalStudents(uniqueStudentIds.size);
          }
          
          // Calculate total pending requests
          const totalPending = enhancedSubjects.reduce(
            (total, subject) => total + subject.pending_students_count, 0
          );
          setTotalPendingRequests(totalPending);
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeacherData();
  }, [currentUser?.id]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-edu-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-edu-primary to-edu-primary/80 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book size={20} />
              <span>Subjects</span>
            </CardTitle>
            <CardDescription className="text-white/80">
              Subjects you're teaching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{subjects.length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-edu-secondary to-edu-secondary/80 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              <span>Students</span>
            </CardTitle>
            <CardDescription className="text-white/80">
              Total enrolled students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalStudents}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award size={20} className="text-edu-primary" />
              <span>Pending Requests</span>
            </CardTitle>
            <CardDescription>
              Student enrollment requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold">{totalPendingRequests}</p>
              {totalPendingRequests > 0 && (
                <Link to="/requests" className="text-sm text-edu-primary hover:underline">
                  View all
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
      
      <section>
        <h2 className="text-xl font-bold mb-4">Your Subjects</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Link to={`/subjects/${subject.id}`} key={subject.id} className="block group">
              <Card className="h-full group-hover:border-edu-primary group-hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{subject.name}</CardTitle>
                    <Badge variant="outline" className="bg-edu-gray text-edu-primary">
                      {subject.quizzes_count} Quizzes
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {subject.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Users size={16} />
                      <span>{subject.students_count} Students</span>
                    </div>
                    
                    {subject.pending_students_count > 0 && (
                      <Badge className="bg-edu-warning text-white">
                        {subject.pending_students_count} pending
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          
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
        </div>
      </section>
    </div>
  );
};

export default TeacherDashboard;
