
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Book } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email)) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-edu-primary rounded-full p-4">
              <Book size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">EduGame</h1>
          <p className="text-gray-600">Learn, play, and grow together</p>
        </div>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Enter your email to access your account
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    placeholder="youremail@example.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="text-sm text-gray-500 pt-2">
                  <p>For demo purposes, use one of these emails:</p>
                  <ul className="mt-2 space-y-1">
                    <li className="flex items-center gap-2">
                      <User size={14} className="text-edu-primary" />
                      <span>johnson@school.edu (Teacher)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <User size={14} className="text-edu-primary" />
                      <span>smith@school.edu (Teacher)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <User size={14} className="text-edu-primary" />
                      <span>alice@student.edu (Student)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <User size={14} className="text-edu-primary" />
                      <span>bob@student.edu (Student)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button type="submit" className="w-full bg-edu-primary hover:bg-edu-primary/90">
                Sign In
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
