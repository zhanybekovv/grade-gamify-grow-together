
import React from "react";
import { useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import QuizInformation from "@/components/quiz/QuizInformation";
import TeacherActions from "@/components/quiz/TeacherActions";
import StudentActions from "@/components/quiz/StudentActions";
import QuizLeaderboard from "@/components/quiz/QuizLeaderboard";
import { useQuizData } from "@/hooks/useQuizData";
import { useQuizActions } from "@/hooks/useQuizActions";

const QuizDetail = () => {
  const { id } = useParams<{ id: string }>();
  const {
    quiz,
    questions,
    loading,
    isTeacher,
    hasSubmitted,
    submissionScore,
    subjectEnrollmentStatus,
    quizEnrollmentStatus,
    activeSession,
    leaderboard,
    setActiveSession,
    setQuizEnrollmentStatus
  } = useQuizData(id!);

  const { startQuizSession, stopQuizSession, requestQuizEnrollment } = useQuizActions(id!);

  const handleStartSession = async () => {
    try {
      const sessionData = await startQuizSession();
      setActiveSession(sessionData);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleStopSession = async () => {
    try {
      await stopQuizSession();
      setActiveSession(null);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleRequestQuizEnrollment = async () => {
    try {
      const newStatus = await requestQuizEnrollment();
      setQuizEnrollmentStatus(newStatus);
    } catch (error) {
      // Error already handled in hook
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading quiz details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p>Quiz not found</p>
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
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground">{quiz.description}</p>
          <p className="text-sm text-muted-foreground mt-1">Subject: {quiz.subject.name}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <QuizInformation
            quiz={quiz}
            questions={questions}
            activeSession={activeSession}
            hasSubmitted={hasSubmitted}
            submissionScore={submissionScore}
          />

          {isTeacher ? (
            <TeacherActions
              quizId={quiz.id}
              activeSession={activeSession}
              onStartSession={handleStartSession}
              onStopSession={handleStopSession}
            />
          ) : (
            <StudentActions
              quiz={quiz}
              questions={questions}
              hasSubmitted={hasSubmitted}
              activeSession={activeSession}
              subjectEnrollmentStatus={subjectEnrollmentStatus}
              quizEnrollmentStatus={quizEnrollmentStatus}
              onRequestQuizEnrollment={handleRequestQuizEnrollment}
            />
          )}
        </div>

        <QuizLeaderboard leaderboard={leaderboard} currentUserId={quiz.subject.teacher_id} />
      </main>
    </div>
  );
};

export default QuizDetail;
