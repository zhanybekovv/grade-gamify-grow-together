
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardStatsProps {
  subjectsCount: number;
  quizzesCount: number;
  points: number;
  loading: boolean;
}

const DashboardStats = ({ subjectsCount, quizzesCount, points, loading }: DashboardStatsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>My Subjects</CardTitle>
          <CardDescription>Enrolled subjects</CardDescription>
        </CardHeader>
        <CardContent className="text-3xl font-bold">
          {loading ? "-" : subjectsCount}
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
          {loading ? "-" : quizzesCount}
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
  );
};

export default DashboardStats;
