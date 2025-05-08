
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import TeacherDashboard from "../components/dashboards/TeacherDashboard";
import StudentDashboard from "../components/dashboards/StudentDashboard";

const Dashboard = () => {
  const { currentUser } = useAuth();
  
  const userType = currentUser?.user_metadata?.type || 'student';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {userType === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
      </main>
    </div>
  );
};

export default Dashboard;
