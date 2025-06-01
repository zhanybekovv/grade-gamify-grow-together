
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Clock, Users } from "lucide-react";

interface TeacherActionsProps {
  quizId: string;
  activeSession: any;
  onStartSession: () => void;
  onStopSession: () => void;
}

const TeacherActions = ({ 
  quizId, 
  activeSession, 
  onStartSession, 
  onStopSession 
}: TeacherActionsProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>Manage your quiz</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!activeSession ? (
          <Button onClick={onStartSession} className="w-full">
            <Play size={18} className="mr-2" />
            Start Quiz Session
          </Button>
        ) : (
          <Button onClick={onStopSession} variant="destructive" className="w-full">
            <Clock size={18} className="mr-2" />
            End Quiz Session
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={() => navigate(`/monitor-quiz/${quizId}`)}
          className="w-full"
        >
          <Users size={18} className="mr-2" />
          Monitor Quiz
        </Button>
      </CardContent>
    </Card>
  );
};

export default TeacherActions;
