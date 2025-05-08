
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import TeacherDashboard from "../components/dashboards/TeacherDashboard";
import StudentDashboard from "../components/dashboards/StudentDashboard";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Small delay to ensure user data is loaded
    if (currentUser) {
      setIsLoading(false);
    } else {
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);
  
  const userType = currentUser?.user_metadata?.type || 'student';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-edu-primary"></div>
          </div>
        ) : (
          userType === "teacher" ? <TeacherDashboard /> : <StudentDashboard />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
