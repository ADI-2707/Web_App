import { createContext, useContext, useState, useEffect } from "react";
import { isAuthenticated, getUser } from "./auth";
import api, { injectLoader } from "./api"; // Import injectLoader
import Loader from "../Components/Loader"; // Ensure correct path

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [user, setUser] = useState(getUser());
  const [globalLoading, setGlobalLoading] = useState(false);

  // Link the API interceptor to this state
  useEffect(() => {
    injectLoader(setGlobalLoading);
  }, []);

  const login = (userData) => {
    setAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    setAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ authenticated, user, login, logout, globalLoading, setGlobalLoading }}
    >
      {children}
      {/* The loader is now global and controlled by network activity */}
      <Loader isLoading={globalLoading} />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);