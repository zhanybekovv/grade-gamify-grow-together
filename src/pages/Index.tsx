
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Book, Award, Users } from "lucide-react";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-edu-primary rounded-full p-1.5">
                <Book size={20} className="text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">EduGame</span>
            </div>
            
            <div>
              <Button 
                onClick={() => navigate("/login")} 
                className="bg-edu-primary hover:bg-edu-primary/90"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main>
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Learn, Play, <span className="text-edu-primary">Grow</span> Together
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              An interactive education platform that transforms learning through gamification. 
              Engage students and track progress with fun, competitive quizzes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate("/login")} 
                size="lg"
                className="bg-edu-primary hover:bg-edu-primary/90"
              >
                Get Started Now
              </Button>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-edu-gray rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Book size={32} className="text-edu-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Create Subjects & Quizzes</h3>
                <p className="text-gray-600">Teachers can easily create subjects and interactive quizzes to engage students.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-edu-gray rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users size={32} className="text-edu-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Join & Participate</h3>
                <p className="text-gray-600">Students request to join classes and compete in interactive quizzes to earn points.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-edu-gray rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Award size={32} className="text-edu-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Track & Reward</h3>
                <p className="text-gray-600">Follow progress through leaderboards and recognize achievement with points and grades.</p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-edu-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Ready to Transform Learning?</h2>
            <Button 
              onClick={() => navigate("/login")} 
              size="lg"
              className="bg-edu-primary hover:bg-edu-primary/90"
            >
              Sign In Now
            </Button>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-white rounded-full p-1.5">
              <Book size={20} className="text-edu-primary" />
            </div>
            <span className="font-bold text-xl">EduGame</span>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} EduGame. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
