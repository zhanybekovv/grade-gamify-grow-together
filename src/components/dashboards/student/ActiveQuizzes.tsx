
import React from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: {
    name: string;
  };
  is_active?: boolean;
}

interface ActiveQuizzesProps {
  quizzes: Quiz[];
}

const ActiveQuizzes = ({ quizzes }: ActiveQuizzesProps) => {
  if (quizzes.length === 0) return null;

  return (
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
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="flex items-center justify-between border-b pb-3"
            >
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
  );
};

export default ActiveQuizzes;
