
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  student_name: string;
  student_id: string;
  score: number;
  submitted_at: string;
}

interface QuizLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentUserId?: string;
}

const QuizLeaderboard = ({ leaderboard, currentUserId }: QuizLeaderboardProps) => {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 1:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 2:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>;
    }
  };

  if (leaderboard.length === 0) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Quiz Leaderboard
        </CardTitle>
        <CardDescription>Top performers on this quiz</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.student_id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                entry.student_id === currentUserId 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {getRankIcon(index)}
                <div>
                  <p className="font-medium">{entry.student_name}</p>
                  <p className="text-xs text-gray-500">
                    Submitted: {new Date(entry.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={index < 3 ? "default" : "outline"}>
                  {entry.score} points
                </Badge>
                {entry.student_id === currentUserId && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    You
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizLeaderboard;
