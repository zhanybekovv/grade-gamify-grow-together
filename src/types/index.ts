
export type UserType = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  avatarUrl?: string;
}

export interface Teacher extends User {
  type: 'teacher';
  subjects: Subject[];
}

export interface Student extends User {
  type: 'student';
  enrolledSubjects: string[];
  enrolledQuizzes: string[];
  pendingSubjects: string[];
  pendingQuizzes: string[];
  totalPoints: number;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  quizzes: Quiz[];
  students: string[];
  pendingStudents: string[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  questions: Question[];
  students: string[];
  pendingStudents: string[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
}

export interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  points: number;
}
