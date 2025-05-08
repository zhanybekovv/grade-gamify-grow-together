
import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SubjectEnrollment {
  id: string;
  student_id: string;
  subject_id: string;
  status: string;
  created_at: string;
  student: {
    name: string;
    email: string;
  };
  subject: {
    name: string;
    description: string;
  };
}

interface QuizEnrollment {
  id: string;
  student_id: string;
  quiz_id: string;
  status: string;
  created_at: string;
  student: {
    name: string;
    email: string;
  };
  quiz: {
    title: string;
    description: string;
    subject: {
      name: string;
    };
  };
}

const EnrollmentRequests = () => {
  const { currentUser } = useAuth();
  const [subjectRequests, setSubjectRequests] = useState<SubjectEnrollment[]>([]);
  const [quizRequests, setQuizRequests] = useState<QuizEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollmentRequests = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Fetch subject enrollment requests
        const { data: subjectData, error: subjectError } = await supabase
          .from("subject_enrollments")
          .select(`
            *,
            student:profiles!subject_enrollments_student_id_fkey(name, email),
            subject:subjects!subject_enrollments_subject_id_fkey(name, description)
          `)
          .eq("status", "pending")
          .filter("subject.teacher_id", "eq", currentUser.id);
        
        if (subjectError) throw subjectError;
        
        // Fetch quiz enrollment requests
        const { data: quizData, error: quizError } = await supabase
          .from("quiz_enrollments")
          .select(`
            *,
            student:profiles!quiz_enrollments_student_id_fkey(name, email),
            quiz:quizzes!quiz_enrollments_quiz_id_fkey(
              title, 
              description,
              subject:subjects(name)
            )
          `)
          .eq("status", "pending");
        
        if (quizError) throw quizError;
        
        setSubjectRequests(subjectData || []);
        setQuizRequests(quizData || []);
      } catch (error) {
        console.error("Error fetching enrollment requests:", error);
        toast.error("Failed to load enrollment requests");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollmentRequests();
  }, [currentUser]);

  const handleSubjectEnrollment = async (enrollmentId: string, approve: boolean) => {
    try {
      if (approve) {
        await supabase
          .from("subject_enrollments")
          .update({ status: "approved" })
          .eq("id", enrollmentId);
          
        toast.success("Student enrollment approved");
      } else {
        await supabase
          .from("subject_enrollments")
          .update({ status: "rejected" })
          .eq("id", enrollmentId);
          
        toast.success("Student enrollment rejected");
      }
      
      // Update UI
      setSubjectRequests(subjectRequests.filter(req => req.id !== enrollmentId));
    } catch (error) {
      console.error("Error handling enrollment:", error);
      toast.error("Failed to process enrollment");
    }
  };

  const handleQuizEnrollment = async (enrollmentId: string, approve: boolean) => {
    try {
      if (approve) {
        await supabase
          .from("quiz_enrollments")
          .update({ status: "approved" })
          .eq("id", enrollmentId);
          
        toast.success("Quiz enrollment approved");
      } else {
        await supabase
          .from("quiz_enrollments")
          .update({ status: "rejected" })
          .eq("id", enrollmentId);
          
        toast.success("Quiz enrollment rejected");
      }
      
      // Update UI
      setQuizRequests(quizRequests.filter(req => req.id !== enrollmentId));
    } catch (error) {
      console.error("Error handling quiz enrollment:", error);
      toast.error("Failed to process quiz enrollment");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Enrollment Requests</h1>
        
        <Tabs defaultValue="subjects">
          <TabsList className="mb-4">
            <TabsTrigger value="subjects">
              Subject Requests
              {subjectRequests.length > 0 && (
                <Badge className="ml-2 bg-edu-primary">{subjectRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="quizzes">
              Quiz Requests
              {quizRequests.length > 0 && (
                <Badge className="ml-2 bg-edu-primary">{quizRequests.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="subjects">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading requests...</p>
              </div>
            ) : subjectRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No pending subject enrollment requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {subjectRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{request.student?.name}</CardTitle>
                          <CardDescription>{request.student?.email}</CardDescription>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium mb-1">Requesting to join:</p>
                      <p className="text-lg font-medium">{request.subject?.name}</p>
                      <p className="text-sm text-muted-foreground mb-4">{request.subject?.description}</p>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        Requested on {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          className="border-red-200 hover:bg-red-50 text-red-500"
                          onClick={() => handleSubjectEnrollment(request.id, false)}
                        >
                          <X size={16} className="mr-1" /> Reject
                        </Button>
                        <Button 
                          onClick={() => handleSubjectEnrollment(request.id, true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check size={16} className="mr-1" /> Approve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="quizzes">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading requests...</p>
              </div>
            ) : quizRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No pending quiz enrollment requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {quizRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{request.student?.name}</CardTitle>
                          <CardDescription>{request.student?.email}</CardDescription>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium mb-1">Requesting to join quiz:</p>
                      <p className="text-lg font-medium">{request.quiz?.title}</p>
                      <p className="text-sm text-muted-foreground mb-2">{request.quiz?.description}</p>
                      <p className="text-sm">In subject: {request.quiz?.subject?.name}</p>
                      
                      <p className="text-sm text-muted-foreground my-4">
                        Requested on {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          className="border-red-200 hover:bg-red-50 text-red-500"
                          onClick={() => handleQuizEnrollment(request.id, false)}
                        >
                          <X size={16} className="mr-1" /> Reject
                        </Button>
                        <Button 
                          onClick={() => handleQuizEnrollment(request.id, true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check size={16} className="mr-1" /> Approve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default EnrollmentRequests;
