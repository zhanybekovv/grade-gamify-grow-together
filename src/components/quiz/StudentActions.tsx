
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Play, UserPlus } from "lucide-react";

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

interface EnrollmentStatus {
  isEnrolled: boolean;
  isPending: boolean;
}

interface StudentActionsProps {
  quiz: Quiz;
  questions: Question[];
  hasSubmitted: boolean;
  activeSession: any;
  subjectEnrollmentStatus: EnrollmentStatus;
  quizEnrollmentStatus: EnrollmentStatus;
  onRequestQuizEnrollment: () => void;
}

const StudentActions = ({ 
  quiz,
  questions,
  hasSubmitted,
  activeSession,
  subjectEnrollmentStatus,
  quizEnrollmentStatus,
  onRequestQuizEnrollment
}: StudentActionsProps) => {
  const navigate = useNavigate();
  
  // Students need BOTH subject AND quiz enrollment to access quizzes
  const canAccessQuiz = subjectEnrollmentStatus.isEnrolled && quizEnrollmentStatus.isEnrolled;
  const hasAnyPendingRequest = subjectEnrollmentStatus.isPending || quizEnrollmentStatus.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>Take the quiz or view results</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!canAccessQuiz ? (
          <div className="space-y-3">
            {!hasAnyPendingRequest ? (
              <>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800 mb-2">
                    You need both subject and quiz enrollment to take this quiz
                  </p>
                  <p className="text-xs text-yellow-700">
                    Subject enrolled: {subjectEnrollmentStatus.isEnrolled ? "✓" : "✗"} | 
                    Quiz enrolled: {quizEnrollmentStatus.isEnrolled ? "✓" : "✗"}
                  </p>
                </div>
                {!quizEnrollmentStatus.isEnrolled && (
                  <Button 
                    onClick={onRequestQuizEnrollment}
                    variant="outline" 
                    className="w-full"
                  >
                    <UserPlus size={18} className="mr-2" />
                    Request Quiz Access
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  {subjectEnrollmentStatus.isPending 
                    ? "Your subject enrollment request is pending approval"
                    : "Your quiz enrollment request is pending approval"
                  }
                </p>
              </div>
            )}
          </div>
        ) : !activeSession ? (
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              Quiz session is not currently active
            </p>
          </div>
        ) : hasSubmitted ? (
          <Button 
            variant="outline" 
            onClick={() => navigate(`/quiz-results/${quiz.id}`)}
            className="w-full"
          >
            View Results
          </Button>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Play size={18} className="mr-2" />
                Take Quiz
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Quiz: {quiz.title}</DialogTitle>
                <DialogDescription>
                  This quiz has {questions.length} questions worth a total of{" "}
                  {questions.reduce((sum, q) => sum + q.points, 0)} points.
                  Make sure you have a stable internet connection.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline">Cancel</Button>
                <Button onClick={() => navigate(`/quizzes/${quiz.id}/take`)}>
                  Start Quiz
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentActions;
