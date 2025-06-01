
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  created_at: string;
  subject: {
    name: string;
    teacher_id: string;
  };
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correct_option_index: number;
  points: number;
}

interface QuizInformationProps {
  quiz: Quiz;
  questions: Question[];
  activeSession: any;
  hasSubmitted: boolean;
  submissionScore: number | null;
}

const QuizInformation = ({ 
  quiz, 
  questions, 
  activeSession, 
  hasSubmitted, 
  submissionScore 
}: QuizInformationProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users size={20} />
          Quiz Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Questions:</span>
          <Badge variant="outline">{questions.length}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Points:</span>
          <Badge variant="outline">
            {questions.reduce((sum, q) => sum + q.points, 0)}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Created:</span>
          <span className="text-sm">{new Date(quiz.created_at).toLocaleDateString()}</span>
        </div>
        
        {activeSession && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge className="bg-green-100 text-green-800">
              <Clock size={14} className="mr-1" />
              Active Session
            </Badge>
          </div>
        )}

        {hasSubmitted && submissionScore !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Your Score:</span>
            <Badge className="bg-blue-100 text-blue-800">
              {submissionScore} points
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizInformation;
