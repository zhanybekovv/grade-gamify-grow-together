
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProgressChartProps {
  subjectsCount: number;
  quizzesCount: number;
  points: number;
  loading: boolean;
}

const ProgressChart = ({ subjectsCount, quizzesCount, points, loading }: ProgressChartProps) => {
  const chartData = [
    { name: "Subjects", value: subjectsCount, color: "#4f46e5" },
    { name: "Quizzes", value: quizzesCount, color: "#8b5cf6" },
    { name: "Points", value: points / 10, color: "#06b6d4" },
  ];

  return (
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
  );
};

export default ProgressChart;
