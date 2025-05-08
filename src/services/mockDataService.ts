
import { User, Teacher, Student, Subject, Quiz, Question } from "../types";

// Generate unique IDs
let idCounter = 1;
const generateId = () => `id-${idCounter++}`;

// Create sample users
const teacherIds = [generateId(), generateId()];
const studentIds = [generateId(), generateId(), generateId(), generateId()];

// Create sample subjects
const subjectIds = [generateId(), generateId(), generateId()];

// Create sample quizzes
const quizIds = [generateId(), generateId(), generateId(), generateId()];

// Create sample questions
const sampleQuestions: Question[] = [
  {
    id: generateId(),
    text: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctOptionIndex: 2,
    points: 10,
  },
  {
    id: generateId(),
    text: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctOptionIndex: 1,
    points: 10,
  },
  {
    id: generateId(),
    text: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctOptionIndex: 1,
    points: 5,
  },
  {
    id: generateId(),
    text: "What is the largest planet in our solar system?",
    options: ["Earth", "Jupiter", "Mars", "Venus"],
    correctOptionIndex: 1,
    points: 15,
  }
];

// Mock quizzes
const mockQuizzes: Quiz[] = [
  {
    id: quizIds[0],
    title: "Basic Math Quiz",
    description: "Test your basic math knowledge",
    subjectId: subjectIds[0],
    questions: [sampleQuestions[2]],
    students: [studentIds[0], studentIds[1]],
    pendingStudents: [studentIds[2]],
  },
  {
    id: quizIds[1],
    title: "Literature Quiz",
    description: "Test your knowledge of classic literature",
    subjectId: subjectIds[1],
    questions: [sampleQuestions[1]],
    students: [studentIds[1]],
    pendingStudents: [],
  },
  {
    id: quizIds[2],
    title: "Geography Quiz",
    description: "Test your geography knowledge",
    subjectId: subjectIds[0],
    questions: [sampleQuestions[0]],
    students: [],
    pendingStudents: [studentIds[0], studentIds[3]],
  },
  {
    id: quizIds[3],
    title: "Science Quiz",
    description: "Test your science knowledge",
    subjectId: subjectIds[2],
    questions: [sampleQuestions[3]],
    students: [studentIds[2], studentIds[3]],
    pendingStudents: [],
  },
];

// Mock subjects
const mockSubjects: Subject[] = [
  {
    id: subjectIds[0],
    name: "Mathematics",
    description: "Learn about numbers, equations, and mathematical concepts",
    teacherId: teacherIds[0],
    quizzes: [mockQuizzes[0], mockQuizzes[2]],
    students: [studentIds[0], studentIds[1]],
    pendingStudents: [studentIds[2]],
  },
  {
    id: subjectIds[1],
    name: "English Literature",
    description: "Explore classic and modern literature",
    teacherId: teacherIds[1],
    quizzes: [mockQuizzes[1]],
    students: [studentIds[1]],
    pendingStudents: [studentIds[3]],
  },
  {
    id: subjectIds[2],
    name: "Science",
    description: "Discover the wonders of science",
    teacherId: teacherIds[0],
    quizzes: [mockQuizzes[3]],
    students: [studentIds[2], studentIds[3]],
    pendingStudents: [],
  },
];

// Mock teachers
const mockTeachers: Teacher[] = [
  {
    id: teacherIds[0],
    name: "Ms. Johnson",
    email: "johnson@school.edu",
    type: "teacher",
    subjects: [mockSubjects[0], mockSubjects[2]],
  },
  {
    id: teacherIds[1],
    name: "Mr. Smith",
    email: "smith@school.edu",
    type: "teacher",
    subjects: [mockSubjects[1]],
  },
];

// Mock students
const mockStudents: Student[] = [
  {
    id: studentIds[0],
    name: "Alice Brown",
    email: "alice@student.edu",
    type: "student",
    enrolledSubjects: [subjectIds[0]],
    enrolledQuizzes: [quizIds[0]],
    pendingSubjects: [],
    pendingQuizzes: [quizIds[2]],
    totalPoints: 25,
  },
  {
    id: studentIds[1],
    name: "Bob Wilson",
    email: "bob@student.edu",
    type: "student",
    enrolledSubjects: [subjectIds[0], subjectIds[1]],
    enrolledQuizzes: [quizIds[0], quizIds[1]],
    pendingSubjects: [],
    pendingQuizzes: [],
    totalPoints: 45,
  },
  {
    id: studentIds[2],
    name: "Charlie Davis",
    email: "charlie@student.edu",
    type: "student",
    enrolledSubjects: [subjectIds[2]],
    enrolledQuizzes: [quizIds[3]],
    pendingSubjects: [subjectIds[0]],
    pendingQuizzes: [quizIds[0]],
    totalPoints: 30,
  },
  {
    id: studentIds[3],
    name: "Diana Evans",
    email: "diana@student.edu",
    type: "student",
    enrolledSubjects: [subjectIds[2]],
    enrolledQuizzes: [quizIds[3]],
    pendingSubjects: [subjectIds[1]],
    pendingQuizzes: [],
    totalPoints: 35,
  },
];

// Combine users
const mockUsers: User[] = [...mockTeachers, ...mockStudents];

// Mock data service
class MockDataService {
  private users: User[] = [...mockUsers];
  private teachers: Teacher[] = [...mockTeachers];
  private students: Student[] = [...mockStudents];
  private subjects: Subject[] = [...mockSubjects];
  private quizzes: Quiz[] = [...mockQuizzes];
  
  // User methods
  getAllUsers(): User[] {
    return this.users;
  }
  
  getUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }
  
  getUserByEmail(email: string): User | undefined {
    return this.users.find(user => user.email === email);
  }
  
  // Teacher methods
  getAllTeachers(): Teacher[] {
    return this.teachers;
  }
  
  getTeacherById(id: string): Teacher | undefined {
    return this.teachers.find(teacher => teacher.id === id);
  }
  
  // Student methods
  getAllStudents(): Student[] {
    return this.students;
  }
  
  getStudentById(id: string): Student | undefined {
    return this.students.find(student => student.id === id);
  }
  
  // Subject methods
  getAllSubjects(): Subject[] {
    return this.subjects;
  }
  
  getSubjectById(id: string): Subject | undefined {
    return this.subjects.find(subject => subject.id === id);
  }
  
  getSubjectsByTeacherId(teacherId: string): Subject[] {
    return this.subjects.filter(subject => subject.teacherId === teacherId);
  }
  
  // Quiz methods
  getAllQuizzes(): Quiz[] {
    return this.quizzes;
  }
  
  getQuizById(id: string): Quiz | undefined {
    return this.quizzes.find(quiz => quiz.id === id);
  }
  
  getQuizzesBySubjectId(subjectId: string): Quiz[] {
    return this.quizzes.filter(quiz => quiz.subjectId === subjectId);
  }
  
  // Add a new subject
  addSubject(subject: Omit<Subject, "id">): Subject {
    const newSubject: Subject = {
      ...subject,
      id: generateId(),
    };
    this.subjects.push(newSubject);
    return newSubject;
  }
  
  // Add a new quiz
  addQuiz(quiz: Omit<Quiz, "id">): Quiz {
    const newQuiz: Quiz = {
      ...quiz,
      id: generateId(),
    };
    this.quizzes.push(newQuiz);
    
    // Update the subject with the new quiz
    const subject = this.subjects.find(s => s.id === newQuiz.subjectId);
    if (subject) {
      subject.quizzes.push(newQuiz);
    }
    
    return newQuiz;
  }
  
  // Request to join a subject
  requestJoinSubject(studentId: string, subjectId: string): boolean {
    const student = this.students.find(s => s.id === studentId);
    const subject = this.subjects.find(s => s.id === subjectId);
    
    if (!student || !subject) return false;
    
    if (!student.pendingSubjects.includes(subjectId)) {
      student.pendingSubjects.push(subjectId);
    }
    
    if (!subject.pendingStudents.includes(studentId)) {
      subject.pendingStudents.push(studentId);
    }
    
    return true;
  }
  
  // Request to join a quiz
  requestJoinQuiz(studentId: string, quizId: string): boolean {
    const student = this.students.find(s => s.id === studentId);
    const quiz = this.quizzes.find(q => q.id === quizId);
    
    if (!student || !quiz) return false;
    
    if (!student.pendingQuizzes.includes(quizId)) {
      student.pendingQuizzes.push(quizId);
    }
    
    if (!quiz.pendingStudents.includes(studentId)) {
      quiz.pendingStudents.push(studentId);
    }
    
    return true;
  }
  
  // Accept a student's request to join a subject
  acceptSubjectRequest(teacherId: string, studentId: string, subjectId: string): boolean {
    const subject = this.subjects.find(s => s.id === subjectId && s.teacherId === teacherId);
    const student = this.students.find(s => s.id === studentId);
    
    if (!subject || !student) return false;
    
    // Remove from pending lists
    subject.pendingStudents = subject.pendingStudents.filter(id => id !== studentId);
    student.pendingSubjects = student.pendingSubjects.filter(id => id !== subjectId);
    
    // Add to enrolled lists
    if (!subject.students.includes(studentId)) {
      subject.students.push(studentId);
    }
    
    if (!student.enrolledSubjects.includes(subjectId)) {
      student.enrolledSubjects.push(subjectId);
    }
    
    return true;
  }
  
  // Accept a student's request to join a quiz
  acceptQuizRequest(teacherId: string, studentId: string, quizId: string): boolean {
    const quiz = this.quizzes.find(q => q.id === quizId);
    const student = this.students.find(s => s.id === studentId);
    
    if (!quiz || !student) return false;
    
    // Find the subject to verify teacher ownership
    const subject = this.subjects.find(s => s.id === quiz.subjectId && s.teacherId === teacherId);
    if (!subject) return false;
    
    // Remove from pending lists
    quiz.pendingStudents = quiz.pendingStudents.filter(id => id !== studentId);
    student.pendingQuizzes = student.pendingQuizzes.filter(id => id !== quizId);
    
    // Add to enrolled lists
    if (!quiz.students.includes(studentId)) {
      quiz.students.push(studentId);
    }
    
    if (!student.enrolledQuizzes.includes(quizId)) {
      student.enrolledQuizzes.push(quizId);
    }
    
    return true;
  }
  
  // Reject a student's request to join a subject
  rejectSubjectRequest(teacherId: string, studentId: string, subjectId: string): boolean {
    const subject = this.subjects.find(s => s.id === subjectId && s.teacherId === teacherId);
    const student = this.students.find(s => s.id === studentId);
    
    if (!subject || !student) return false;
    
    // Remove from pending lists
    subject.pendingStudents = subject.pendingStudents.filter(id => id !== studentId);
    student.pendingSubjects = student.pendingSubjects.filter(id => id !== subjectId);
    
    return true;
  }
  
  // Reject a student's request to join a quiz
  rejectQuizRequest(teacherId: string, studentId: string, quizId: string): boolean {
    const quiz = this.quizzes.find(q => q.id === quizId);
    const student = this.students.find(s => s.id === studentId);
    
    if (!quiz || !student) return false;
    
    // Find the subject to verify teacher ownership
    const subject = this.subjects.find(s => s.id === quiz.subjectId && s.teacherId === teacherId);
    if (!subject) return false;
    
    // Remove from pending lists
    quiz.pendingStudents = quiz.pendingStudents.filter(id => id !== studentId);
    student.pendingQuizzes = student.pendingQuizzes.filter(id => id !== quizId);
    
    return true;
  }

  // Get leaderboard for a subject
  getSubjectLeaderboard(subjectId: string) {
    const subject = this.subjects.find(s => s.id === subjectId);
    if (!subject) return [];
    
    return subject.students.map(studentId => {
      const student = this.students.find(s => s.id === studentId);
      return {
        studentId,
        studentName: student?.name || "Unknown",
        points: student?.totalPoints || 0,
      };
    }).sort((a, b) => b.points - a.points);
  }
}

// Export a singleton instance
const mockDataService = new MockDataService();
export default mockDataService;
