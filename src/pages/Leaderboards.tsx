
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface QuizLeaderboardEntry {
  student_name: string;
  student_id: string;
  score: number;
  submitted_at: string;
  quiz_title: string;
  quiz_id: string;
}

interface SubjectLeaderboardEntry {
  student_name: string;
  student_id: string;
  total_score: number;
  quiz_count: number;
  average_score: number;
  subject_name: string;
  subject_id: string;
}

const Leaderboards = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizLeaderboards, setQuizLeaderboards] = useState<QuizLeaderboardEntry[]>([]);
  const [subjectLeaderboards, setSubjectLeaderboards] = useState<SubjectLeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      if (!currentUser?.id) return;

      try {
        setLoading(true);

        // Fetch quiz leaderboards - top scores for each quiz
        const { data: quizData, error: quizError } = await supabase
          .from("quiz_submissions")
          .select(`
            score,
            submitted_at,
            student_id,
            quiz_id,
            quizzes!inner (
              title,
              subject_id,
              subjects!inner (
                name
              )
            ),
            profiles!inner (
              name
            )
          `)
          .order('score', { ascending: false });

        if (quizError) throw quizError;

        // Process quiz data to get best score per student per quiz
        const quizLeaderboardMap = new Map<string, QuizLeaderboardEntry>();
        
        quizData?.forEach((submission: any) => {
          const key = `${submission.quiz_id}-${submission.student_id}`;
          const existing = quizLeaderboardMap.get(key);
          
          if (!existing || submission.score > existing.score) {
            quizLeaderboardMap.set(key, {
              student_name: submission.profiles.name,
              student_id: submission.student_id,
              score: submission.score || 0,
              submitted_at: submission.submitted_at,
              quiz_title: submission.quizzes.title,
              quiz_id: submission.quiz_id,
            });
          }
        });

        const processedQuizData = Array.from(quizLeaderboardMap.values())
          .sort((a, b) => b.score - a.score);

        setQuizLeaderboards(processedQuizData);

        // Fetch subject leaderboards - aggregate scores by subject
        const subjectMap = new Map<string, Map<string, { total: number; count: number; name: string; subjectName: string; subjectId: string }>>();

        quizData?.forEach((submission: any) => {
          const subjectId = submission.quizzes.subject_id;
          const studentId = submission.student_id;
          
          if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, new Map());
          }
          
          const subjectStudents = subjectMap.get(subjectId)!;
          const existing = subjectStudents.get(studentId);
          
          if (!existing) {
            subjectStudents.set(studentId, {
              total: submission.score || 0,
              count: 1,
              name: submission.profiles.name,
              subjectName: submission.quizzes.subjects.name,
              subjectId: subjectId,
            });
          } else {
            existing.total += submission.score || 0;
            existing.count += 1;
          }
        });

        // Convert to subject leaderboard format
        const subjectLeaderboardData: SubjectLeaderboardEntry[] = [];
        
        subjectMap.forEach((students, subjectId) => {
          students.forEach((data, studentId) => {
            subjectLeaderboardData.push({
              student_name: data.name,
              student_id: studentId,
              total_score: data.total,
              quiz_count: data.count,
              average_score: Math.round(data.total / data.count),
              subject_name: data.subjectName,
              subject_id: subjectId,
            });
          });
        });

        setSubjectLeaderboards(
          subjectLeaderboardData.sort((a, b) => b.total_score - a.total_score)
        );

      } catch (error) {
        console.error("Error fetching leaderboards:", error);
        toast.error("Failed to load leaderboards");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboards();
  }, [currentUser?.id]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="h-5 w-5 flex items-center justify-center text-sm font-semibold text-gray-500">#{index + 1}</span>;
    }
  };

  const getRankBadgeVariant = (index: number) => {
    switch (index) {
      case 0:
        return "default";
      case 1:
        return "secondary";
      case 2:
        return "outline";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading leaderboards...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Leaderboards</h1>
          <p className="text-gray-600 mt-2">See how you rank against other students</p>
        </div>

        <Tabs defaultValue="quiz" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quiz">Quiz Leaderboards</TabsTrigger>
            <TabsTrigger value="subject">Subject Leaderboards</TabsTrigger>
          </TabsList>

          <TabsContent value="quiz" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Quiz Scores</CardTitle>
              </CardHeader>
              <CardContent>
                {quizLeaderboards.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No quiz submissions yet</p>
                ) : (
                  <div className="space-y-3">
                    {quizLeaderboards.slice(0, 20).map((entry, index) => (
                      <div
                        key={`${entry.quiz_id}-${entry.student_id}`}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          entry.student_id === currentUser?.id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {getRankIcon(index)}
                          <div>
                            <p className="font-medium">{entry.student_name}</p>
                            <p className="text-sm text-gray-500">{entry.quiz_title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRankBadgeVariant(index)}>
                            {entry.score} points
                          </Badge>
                          {entry.student_id === currentUser?.id && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subject" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subject Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                {subjectLeaderboards.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No subject data available</p>
                ) : (
                  <div className="space-y-3">
                    {subjectLeaderboards.slice(0, 20).map((entry, index) => (
                      <div
                        key={`${entry.subject_id}-${entry.student_id}`}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          entry.student_id === currentUser?.id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {getRankIcon(index)}
                          <div>
                            <p className="font-medium">{entry.student_name}</p>
                            <p className="text-sm text-gray-500">{entry.subject_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <Badge variant={getRankBadgeVariant(index)}>
                              {entry.total_score} total
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {entry.quiz_count} quizzes • Avg: {entry.average_score}
                            </p>
                          </div>
                          {entry.student_id === currentUser?.id && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Leaderboards;
