
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Book, FileText, Play } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import "./styles.css";

interface Subject {
  id: string;
  name: string;
  description: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: {
    name: string;
  };
  is_active?: boolean;
}

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const [enrolledSubjects, setEnrolledSubjects] = useState<Subject[]>([]);
  const [pendingSubjects, setPendingSubjects] = useState<Subject[]>([]);
  const [enrolledQuizzes, setEnrolledQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [activeQuizzes, setActiveQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        // Fetch student points
        const { data: userData } = await supabase
          .from("profiles")
          .select("total_points")
          .eq("id", currentUser.id)
          .single();

        if (userData) {
          setPoints(userData.total_points || 0);
        }

        // Fetch enrolled subjects
        const { data: enrolledSubjectsData } = await supabase
          .from("subject_enrollments")
          .select("subject:subjects(id, name, description)")
          .eq("student_id", currentUser.id)
          .eq("status", "approved");

        if (enrolledSubjectsData) {
          setEnrolledSubjects(
            enrolledSubjectsData.map((item) => item.subject as Subject)
          );
        }

        // Fetch pending subjects
        const { data: pendingSubjectsData } = await supabase
          .from("subject_enrollments")
          .select("subject:subjects(id, name, description)")
          .eq("student_id", currentUser.id)
          .eq("status", "pending");

        if (pendingSubjectsData) {
          setPendingSubjects(
            pendingSubjectsData.map((item) => item.subject as Subject)
          );
        }

        // Fetch enrolled quizzes
        const { data: enrolledQuizzesData } = await supabase
          .from("quiz_enrollments")
          .select("quiz:quizzes(id, title, description, subject:subjects(name))")
          .eq("student_id", currentUser.id)
          .eq("status", "approved");

        if (enrolledQuizzesData) {
          const quizzes = enrolledQuizzesData.map((item) => item.quiz as Quiz);
          setEnrolledQuizzes(quizzes);
          
          // Get enrolled quiz IDs to check for active sessions
          const quizIds = quizzes.map(quiz => quiz.id);
          
          if (quizIds.length > 0) {
            // Check which quizzes are active
            const { data: activeQuizData, error: activeQuizError } = await supabase
              .from('active_quiz_sessions')
              .select('quiz_id')
              .in('quiz_id', quizIds)
              .eq('status', 'active');
              
            if (activeQuizError) throw activeQuizError;
            
            if (activeQuizData && activeQuizData.length > 0) {
              const activeQuizIds = activeQuizData.map(session => session.quiz_id);
              const activeQuizList = quizzes
                .filter(quiz => activeQuizIds.includes(quiz.id))
                .map(quiz => ({...quiz, is_active: true}));
              
              setActiveQuizzes(activeQuizList);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching student dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
    
    // Set up real-time listener for active quiz sessions
    const channel = supabase
      .channel('public:active_quiz_sessions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'active_quiz_sessions' 
      }, (payload) => {
        // Refresh data when quiz sessions change
        fetchStudentData();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const chartData = [
    { name: "Subjects", value: enrolledSubjects.length, color: "#4f46e5" },
    { name: "Quizzes", value: enrolledQuizzes.length, color: "#8b5cf6" },
    { name: "Points", value: points / 10, color: "#06b6d4" },
  ];

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>My Subjects</CardTitle>
            <CardDescription>Enrolled subjects</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {loading ? "-" : enrolledSubjects.length}
            <span className="text-sm text-muted-foreground ml-2 font-normal">
              subjects
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>My Quizzes</CardTitle>
            <CardDescription>Enrolled quizzes</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {loading ? "-" : enrolledQuizzes.length}
            <span className="text-sm text-muted-foreground ml-2 font-normal">
              quizzes
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Points</CardTitle>
            <CardDescription>Your accumulated points</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-edu-primary">
            {loading ? "-" : points}
            <span className="text-sm text-muted-foreground ml-2 font-normal">
              points
            </span>
          </CardContent>
        </Card>
      </div>

      {activeQuizzes.length > 0 && (
        <Card className="mb-6 border-green-500">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center">
              <Play size={20} className="mr-2 text-green-600" />
              Active Quizzes
            </CardTitle>
            <CardDescription>
              These quizzes have been started by your teachers and are ready to take
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {activeQuizzes.map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-medium">{quiz.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {quiz.subject?.name}
                    </p>
                  </div>
                  <Link to={`/quizzes/${quiz.id}/take`}>
                    <Button className="bg-green-600 hover:bg-green-700">
                      Take Quiz Now
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              {!loading && chartData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                      label={(entry) => entry.name}
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No data to display</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-edu-primary"></div>
              </div>
            ) : enrolledSubjects.length > 0 || pendingSubjects.length > 0 ? (
              <div className="space-y-4">
                {pendingSubjects.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-medium text-sm text-muted-foreground">
                      Pending Requests
                    </h3>
                    <ul className="space-y-2">
                      {pendingSubjects.slice(0, 3).map((subject) => (
                        <li key={subject.id} className="flex items-center gap-2">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Pending
                          </Badge>
                          <span className="truncate">{subject.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {enrolledSubjects.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-medium text-sm text-muted-foreground">
                      Recent Enrollments
                    </h3>
                    <ul className="space-y-2">
                      {enrolledSubjects.slice(0, 3).map((subject) => (
                        <li
                          key={subject.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <Book size={16} className="mr-2 text-edu-primary" />
                            <span className="truncate">{subject.name}</span>
                          </div>
                          <Link to={`/subjects/${subject.id}`}>
                            <Button size="sm" variant="ghost">
                              View
                            </Button>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You haven't enrolled in any subjects yet
                </p>
                <Link to="/subjects">
                  <Button>Browse Subjects</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
