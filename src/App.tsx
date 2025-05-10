
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Subjects from "./pages/Subjects";
import Quizzes from "./pages/Quizzes";
import NewSubject from "./pages/NewSubject";
import SubjectDetail from "./pages/SubjectDetail";
import QuizDetail from "./pages/QuizDetail";
import NewQuiz from "./pages/NewQuiz";
import EnrollmentRequests from "./pages/EnrollmentRequests";
import TakeQuiz from "./pages/TakeQuiz";
import MonitorQuiz from "./pages/MonitorQuiz";
import QuizResults from "./pages/QuizResults";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/subjects" 
                element={
                  <ProtectedRoute>
                    <Subjects />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/subjects/new" 
                element={
                  <ProtectedRoute>
                    <NewSubject />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/subjects/:id" 
                element={
                  <ProtectedRoute>
                    <SubjectDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/subjects/:subjectId/quiz/new" 
                element={
                  <ProtectedRoute>
                    <NewQuiz />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/quizzes" 
                element={
                  <ProtectedRoute>
                    <Quizzes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/quizzes/:id" 
                element={
                  <ProtectedRoute>
                    <QuizDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/quizzes/:id/take" 
                element={
                  <ProtectedRoute>
                    <TakeQuiz />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/quizzes/:id/monitor" 
                element={
                  <ProtectedRoute>
                    <MonitorQuiz />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/quizzes/:id/results" 
                element={
                  <ProtectedRoute>
                    <QuizResults />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/requests" 
                element={
                  <ProtectedRoute>
                    <EnrollmentRequests />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
