
import React from "react";
import {
  DashboardStats,
  ActiveQuizzes,
  ProgressChart,
  RecentActivity,
  useStudentData
} from "./student";

const StudentDashboard = () => {
  const {
    enrolledSubjects,
    pendingSubjects,
    enrolledQuizzes,
    activeQuizzes,
    loading,
    points
  } = useStudentData();

  return (
    <div>
      <DashboardStats 
        subjectsCount={enrolledSubjects.length}
        quizzesCount={enrolledQuizzes.length}
        points={points}
        loading={loading}
      />

      <ActiveQuizzes quizzes={activeQuizzes} />

      <div className="grid gap-6 md:grid-cols-2">
        <ProgressChart 
          subjectsCount={enrolledSubjects.length}
          quizzesCount={enrolledQuizzes.length}
          points={points}
          loading={loading}
        />
        <RecentActivity 
          enrolledSubjects={enrolledSubjects}
          pendingSubjects={pendingSubjects}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default StudentDashboard;
