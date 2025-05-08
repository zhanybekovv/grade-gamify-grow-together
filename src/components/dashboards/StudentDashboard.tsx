
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Book, Award, User } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import "./styles.css";

interface Subject {
  id: string;
  name: string;
  description: string;
  quizzes_count: number;
}

interface TopStudent {
  id: string;
  name: string;
  total_points: number;
}

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const [enrolledSubjects, setEnrolledSubjects] = useState<Subject[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!currentUser?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch profile for total points
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("total_points")
          .eq("id", currentUser.id)
          .single();
          
        if (profileError) throw profileError;
        
        if (profileData) {
          setTotalPoints(profileData.total_points || 0);
        }
        
        // Get enrolled subject IDs
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("subject_enrollments")
          .select("subject_id")
          .eq("student_id", currentUser.id)
          .eq("status", "approved");
        
        if (enrollmentsError) throw enrollmentsError;
        
        // Fetch enrolled subjects data
        if (enrollments && enrollments.length > 0) {
          const subjectIds = enrollments.map(enrollment => enrollment.subject_id);
          
          const { data: subjects, error: subjectsError } = await supabase
            .from("subjects")
            .select("id, name, description")
            .in("id", subjectIds);
          
          if (subjectsError) throw subjectsError;
          
          if (subjects) {
            const enhancedSubjects = await Promise.all(subjects.map(async (subject) => {
              // Get quizzes count
              const { count: quizzesCount, error: quizzesError } = await supabase
                .from("quizzes")
                .select("*", { count: 'exact', head: true })
                .eq("subject_id", subject.id);
              
              if (quizzesError) console.error("Error fetching quizzes:", quizzesError);
              
              return {
                ...subject,
                quizzes_count: quizzesCount || 0
              };
            }));
            
            setEnrolledSubjects(enhancedSubjects);
          }
        }
        
        // Get pending requests count (both subjects and quizzes)
        const { count: pendingSubjects, error: pendingSubjectsError } = await supabase
          .from("subject_enrollments")
          .select("*", { count: 'exact', head: true })
          .eq("student_id", currentUser.id)
          .eq("status", "pending");
        
        if (pendingSubjectsError) throw pendingSubjectsError;
        
        const { count: pendingQuizzes, error: pendingQuizzesError } = await supabase
          .from("quiz_enrollments")
          .select("*", { count: 'exact', head: true })
          .eq("student_id", currentUser.id)
          .eq("status", "pending");
        
        if (pendingQuizzesError) throw pendingQuizzesError;
        
        setPendingRequests((pendingSubjects || 0) + (pendingQuizzes || 0));
        
        // Fetch top students by points
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from("profiles")
          .select("id, name, total_points")
          .order("total_points", { ascending: false })
          .limit(5);
        
        if (leaderboardError) throw leaderboardError;
        
        if (leaderboardData) {
          setTopStudents(leaderboardData);
        }
        
      } catch (error) {
        console.error("Error fetching student data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentData();
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
              <span>Enrolled Subjects</span>
            </CardTitle>
            <CardDescription className="text-white/80">
              Classes you're taking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{enrolledSubjects.length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-edu-secondary to-edu-secondary/80 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award size={20} />
              <span>Total Points</span>
            </CardTitle>
            <CardDescription className="text-white/80">
              Your achievement score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalPoints}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} className="text-edu-primary" />
              <span>Pending Requests</span>
            </CardTitle>
            <CardDescription>
              Awaiting approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingRequests}</p>
          </CardContent>
        </Card>
      </section>
      
      <section>
        <h2 className="text-xl font-bold mb-4">Your Classes</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrolledSubjects.map((subject) => (
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
                    <Badge variant="outline" className="bg-edu-gray text-edu-primary">
                      {subject.quizzes_count} Quizzes
                    </Badge>
                    
                    <div className="flex items-center gap-1.5">
                      <Award size={16} className="text-edu-warning" />
                      <span className="text-sm font-medium">{totalPoints} Points</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          
          <Link to="/subjects" className="block group">
            <Card className="h-full border-dashed border-2 flex items-center justify-center p-6 group-hover:border-edu-primary transition-all">
              <div className="text-center">
                <div className="mx-auto bg-edu-gray rounded-full w-12 h-12 flex items-center justify-center mb-2 group-hover:bg-edu-primary/10">
                  <Book size={24} className="text-edu-primary" />
                </div>
                <h3 className="font-medium mb-1">Explore Classes</h3>
                <p className="text-sm text-gray-500">Find new subjects to join</p>
              </div>
            </Card>
          </Link>
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-bold mb-4">Leaderboards</h2>
        <Card>
          <CardHeader>
            <CardTitle>Top Students</CardTitle>
            <CardDescription>Students with the highest points across all classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topStudents.map((student, index) => (
                <div key={student.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`avatar-circle w-8 h-8 ${
                      index === 0 ? "bg-yellow-500" : 
                      index === 1 ? "bg-gray-400" : 
                      index === 2 ? "bg-amber-700" : "bg-edu-primary"
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{student.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-edu-warning" />
                    <span className="font-bold">{student.total_points} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default StudentDashboard;
