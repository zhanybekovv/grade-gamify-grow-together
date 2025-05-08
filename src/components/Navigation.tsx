
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Book, Award, LogOut } from "lucide-react";

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!currentUser) return null;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="bg-edu-primary rounded-full p-1.5">
              <Book size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">EduGame</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-gray-700 hover:text-edu-primary font-medium">
                Dashboard
              </Link>
              
              {currentUser.type === "teacher" ? (
                <>
                  <Link to="/subjects" className="text-gray-700 hover:text-edu-primary font-medium">
                    My Subjects
                  </Link>
                  <Link to="/requests" className="text-gray-700 hover:text-edu-primary font-medium">
                    Requests
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/explore" className="text-gray-700 hover:text-edu-primary font-medium">
                    Explore
                  </Link>
                  <Link to="/leaderboards" className="text-gray-700 hover:text-edu-primary font-medium">
                    Leaderboards
                  </Link>
                </>
              )}
            </nav>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="bg-gray-100 rounded-full h-9 w-9 flex items-center justify-center">
                  <User size={18} className="text-edu-primary" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium line-clamp-1">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{currentUser.type}</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="Logout"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
