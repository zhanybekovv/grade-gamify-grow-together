
import { useAuth } from "../../context/AuthContext";
import mockDataService from "../../services/mockDataService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Book, Award, User } from "lucide-react";
import { Link } from "react-router-dom";

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const studentId = currentUser?.id || "";
  
  const student = mockDataService.getStudentById(studentId);
  if (!student) return <div>Student not found</div>;
  
  const enrolledSubjects = student.enrolledSubjects.map(id => 
    mockDataService.getSubjectById(id)
  ).filter(Boolean);
  
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-edu-primary to-edu-primary/80 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book size={20} />
              <span>Enrolled Subjects</span>
            </CardTitle>
            <CardDescription className="text-white/80">
              Classes you're taking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{student.enrolledSubjects.length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-edu-secondary to-edu-secondary/80 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award size={20} />
              <span>Total Points</span>
            </CardTitle>
            <CardDescription className="text-white/80">
              Your achievement score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{student.totalPoints}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} className="text-edu-primary" />
              <span>Pending Requests</span>
            </CardTitle>
            <CardDescription>
              Awaiting approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {student.pendingSubjects.length + student.pendingQuizzes.length}
            </p>
          </CardContent>
        </Card>
      </section>
      
      <section>
        <h2 className="text-xl font-bold mb-4">Your Classes</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrolledSubjects.map((subject) => (
            subject && (
              <Link to={`/subjects/${subject.id}`} key={subject.id} className="block group">
                <Card className="h-full group-hover:border-edu-primary group-hover:shadow-md transition-all">
                  <CardHeader>
                    <CardTitle>{subject.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {subject.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-edu-gray text-edu-primary">
                        {subject.quizzes.filter(q => student.enrolledQuizzes.includes(q.id)).length} Quizzes
                      </Badge>
                      
                      <div className="flex items-center gap-1.5">
                        <Award size={16} className="text-edu-warning" />
                        <span className="text-sm font-medium">{student.totalPoints} Points</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          ))}
          
          <Link to="/explore" className="block group">
            <Card className="h-full border-dashed border-2 flex items-center justify-center p-6 group-hover:border-edu-primary transition-all">
              <div className="text-center">
                <div className="mx-auto bg-edu-gray rounded-full w-12 h-12 flex items-center justify-center mb-2 group-hover:bg-edu-primary/10">
                  <Book size={24} className="text-edu-primary" />
                </div>
                <h3 className="font-medium mb-1">Explore Classes</h3>
                <p className="text-sm text-gray-500">Find new subjects to join</p>
              </div>
            </Card>
          </Link>
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-bold mb-4">Leaderboards</h2>
        <Card>
          <CardHeader>
            <CardTitle>Top Students</CardTitle>
            <CardDescription>Students with the highest points across all classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDataService.getAllStudents()
                .sort((a, b) => b.totalPoints - a.totalPoints)
                .slice(0, 5)
                .map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`avatar-circle w-8 h-8 ${
                        index === 0 ? "bg-yellow-500" : 
                        index === 1 ? "bg-gray-400" : 
                        index === 2 ? "bg-amber-700" : "bg-edu-primary"
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{student.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award size={16} className="text-edu-warning" />
                      <span className="font-bold">{student.totalPoints} pts</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default StudentDashboard;
