
import { createContext, useContext, useState, ReactNode } from "react";
import { User } from "../types";
import mockDataService from "../services/mockDataService";
import { toast } from "sonner";

interface AuthContextType {
  currentUser: User | null;
  login: (email: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: () => false,
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = (email: string): boolean => {
    const user = mockDataService.getUserByEmail(email);
    if (user) {
      setCurrentUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      return true;
    }
    toast.error("Invalid email. Please try again.");
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    toast.info("You have been logged out.");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        isAuthenticated: currentUser !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
