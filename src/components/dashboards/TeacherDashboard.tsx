
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import "./styles.css";

interface Subject {
  id: string;
  name: string;
}

interface RequestCount {
  subject_id: string;
  count: number;
}

const TeacherDashboard = () => {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RequestCount[]>([]);
  const [quizCount, setQuizCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!currentUser?.id) return;
      
      setLoading(true);
      try {
        // Fetch teacher subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("id, name")
          .eq("teacher_id", currentUser.id);
          
        if (subjectsError) throw subjectsError;
        
        if (subjectsData) {
          setSubjects(subjectsData);
          
          // Get subject IDs for further queries
          const subjectIds = subjectsData.map((subject) => subject.id);
          
          if (subjectIds.length > 0) {
            // Fetch quiz count for these subjects
            const { data: quizData, error: quizError } = await supabase
              .from("quizzes")
              .select("id", { count: "exact" })
              .in("subject_id", subjectIds);
              
            if (quizError) throw quizError;
            setQuizCount(quizData?.length || 0);
            
            // Fetch students count across all subjects
            const { data: enrollmentsData, error: enrollmentsError } = await supabase
              .from("subject_enrollments")
              .select("student_id")
              .in("subject_id", subjectIds)
              .eq("status", "approved");
              
            if (enrollmentsError) throw enrollmentsError;
            
            // Get unique student IDs
            const uniqueStudentIds = new Set();
            enrollmentsData?.forEach(enrollment => {
              uniqueStudentIds.add(enrollment.student_id);
            });
            
            setStudentsCount(uniqueStudentIds.size);
            
            // Fetch pending enrollment requests
            const { data: pendingData, error: pendingError } = await supabase
              .from("subject_enrollments")
              .select("subject_id")
              .in("subject_id", subjectIds)
              .eq("status", "pending");
            
            if (pendingError) throw pendingError;
            
            // Count pending requests by subject
            const countBySubject: Record<string, number> = {};
            pendingData?.forEach(enrollment => {
              countBySubject[enrollment.subject_id] = (countBySubject[enrollment.subject_id] || 0) + 1;
            });
            
            // Convert to array format
            const pendingCounts = Object.keys(countBySubject).map(subject_id => ({
              subject_id,
              count: countBySubject[subject_id]
            }));
            
            setPendingRequests(pendingCounts);
          }
        }
      } catch (error) {
        console.error("Error fetching teacher dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [currentUser.id]);

  const chartData = [
    { name: "Subjects", value: subjects.length, color: "#4f46e5" },
    { name: "Quizzes", value: quizCount, color: "#8b5cf6" },
    { name: "Students", value: studentsCount, color: "#06b6d4" },
  ];

  // Calculate total pending requests
  const totalPendingRequests = pendingRequests.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>My Subjects</CardTitle>
            <CardDescription>Total subjects created</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {loading ? "-" : subjects.length}
            <span className="text-sm text-muted-foreground ml-2 font-normal">
              subjects
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>My Quizzes</CardTitle>
            <CardDescription>Total quizzes created</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {loading ? "-" : quizCount}
            <span className="text-sm text-muted-foreground ml-2 font-normal">
              quizzes
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>My Students</CardTitle>
            <CardDescription>Total students enrolled</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {loading ? "-" : studentsCount}
            <span className="text-sm text-muted-foreground ml-2 font-normal">
              students
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              {!loading && chartData.some(d => d.value > 0) ? (
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Enrollment Requests</CardTitle>
            {totalPendingRequests > 0 && (
              <Badge className="bg-edu-primary">
                {totalPendingRequests} new
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-edu-primary"></div>
              </div>
            ) : totalPendingRequests > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You have {totalPendingRequests} pending enrollment
                  {totalPendingRequests !== 1 ? "s" : ""} to review
                </p>
                
                <ul className="space-y-2">
                  {pendingRequests.map((item) => {
                    const subject = subjects.find(s => s.id === item.subject_id);
                    return (
                      <li key={item.subject_id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Badge className="bg-yellow-100 text-yellow-800 mr-2">
                            {item.count}
                          </Badge>
                          <span>
                            {subject?.name || "Unknown Subject"}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                
                <Link to="/requests" className="block mt-4">
                  <Button className="w-full">
                    View All Requests
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No pending enrollment requests
                </p>
                <Link to="/subjects/new">
                  <Button>Create New Subject</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
