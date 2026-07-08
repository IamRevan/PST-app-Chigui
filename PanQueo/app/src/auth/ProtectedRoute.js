import { useAuth } from './AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <LoginScreen />;
  return children;
};
