import React, { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { PasswordReset } from './components/auth/PasswordReset';
import { StaffDashboard } from './components/dashboards/StaffDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { InventoryManagement } from './components/modules/InventoryManagement';
import { DonorManagement } from './components/modules/DonorManagement';
import { ReportsAnalytics } from './components/modules/ReportsAnalytics';
import { EmailNotifications } from './components/modules/EmailNotifications';
import { Settings } from './components/modules/Settings';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';

export type UserRole = 'staff' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hospitalName: string;
}

export interface AppState {
  currentView: string;
  user: User | null;
  isAuthenticated: boolean;
  isDarkMode: boolean;
}

export default function App() {
  const [state, setState] = useState<AppState>({
    currentView: 'login',
    user: null,
    isAuthenticated: false,
    isDarkMode: false
  });

  // Handle OAuth callback and URL parameters
  React.useEffect(() => {
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');

    if (view === 'auth-callback' && token && userParam) {
      try {
        // Parse user data
        const userData = JSON.parse(decodeURIComponent(userParam));
        
        // Store token and user
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        // Update state to authenticated
        setState(prev => ({
          ...prev,
          user: {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            hospitalName: userData.hospital_name
          },
          isAuthenticated: true,
          currentView: 'dashboard'
        }));

        // Show success message
        toast.success(`Welcome, ${userData.name}! Signed in with Google.`);

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        toast.error('Failed to complete Google sign-in. Please try again.');
        // Redirect to login on error
        window.history.replaceState({}, document.title, window.location.pathname + '?view=login&error=oauth_parse_failed');
      }
    } else if (error) {
      // Handle OAuth errors
      const errorView = view || 'login';
      setState(prev => ({ ...prev, currentView: errorView }));
      
      // Show error message based on error type
      if (error === 'oauth_failed') {
        toast.error('Google sign-in failed. Please try again.');
      } else if (error === 'oauth_callback_failed') {
        toast.error('Failed to process Google sign-in. Please try again.');
      }
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (view) {
      // Handle other view parameters
      setState(prev => ({ ...prev, currentView: view }));
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check for existing authentication
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser && !state.isAuthenticated) {
      try {
        const user = JSON.parse(storedUser);
        setState(prev => ({
          ...prev,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            hospitalName: user.hospital_name || user.hospitalName
          },
          isAuthenticated: true,
          currentView: 'dashboard'
        }));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []); // Run once on mount

  // Apply dark mode class to document
  React.useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDarkMode]);

  const toggleTheme = () => {
    setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };

  // Handle login - uses actual user data from backend
  const handleLogin = (email: string, password: string, role?: UserRole, userData?: any) => {
    // Get user data from localStorage (set by Login component after successful API call)
    const storedUser = localStorage.getItem('user');
    let user: User;

    if (storedUser) {
      // Use actual user data from backend
      const parsedUser = JSON.parse(storedUser);
      user = {
        id: parsedUser.id,
        name: parsedUser.name,
        email: parsedUser.email,
        role: parsedUser.role as UserRole,
        hospitalName: parsedUser.hospital_name || 'OptiBlood System'
      };
    } else if (userData) {
      // Use provided user data
      user = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role as UserRole,
        hospitalName: userData.hospital_name || 'OptiBlood System'
      };
    } else {
      // Fallback to mock (shouldn't happen in production)
      user = {
        id: '1',
        name: 'User',
        email: email,
        role: role || 'staff',
        hospitalName: role === 'admin' ? 'OptiBlood System Admin' : 'City General Hospital'
      };
    }

    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: true,
      currentView: 'dashboard' // Admin will see AdminDashboard based on role check in renderContent
    }));
  };

  const handleRegister = (userData: any) => {
    handleLogin(userData.email, userData.password, userData.role);
  };

  const handleLogout = () => {
    setState(prev => ({
      ...prev,
      currentView: 'login',
      user: null,
      isAuthenticated: false
    }));
  };

  const navigateTo = (view: string) => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  const renderContent = () => {
    if (!state.isAuthenticated) {
      switch (state.currentView) {
        case 'register':
          return <Register onRegister={handleRegister} onNavigate={navigateTo} isDarkMode={state.isDarkMode} onToggleTheme={toggleTheme} />;
        case 'password-reset':
          return <PasswordReset onNavigate={navigateTo} isDarkMode={state.isDarkMode} onToggleTheme={toggleTheme} />;
        case 'auth-callback':
          // Show loading state while processing OAuth callback
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p>Completing sign in...</p>
              </div>
            </div>
          );
        default:
          return <Login onLogin={handleLogin} onNavigate={navigateTo} isDarkMode={state.isDarkMode} onToggleTheme={toggleTheme} />;
      }
    }

    // Authenticated views
    const dashboardView = () => {
      switch (state.user?.role) {
        case 'admin':
          return <AdminDashboard />;
        case 'staff':
        default:
          return <StaffDashboard />;
      }
    };

    switch (state.currentView) {
      case 'dashboard':
        return state.user?.role === 'admin' 
          ? <AdminDashboard />
          : <StaffDashboard onNavigate={navigateTo} />;
      case 'inventory':
        return <InventoryManagement userRole={state.user?.role || 'staff'} />;
      case 'donors':
        return <DonorManagement userRole={state.user?.role || 'staff'} />;
      case 'emails':
        return <EmailNotifications userRole={state.user?.role || 'staff'} />;
      case 'reports':
        return <ReportsAnalytics userRole={state.user?.role || 'staff'} />;
      case 'profile':
      case 'settings':
        if (!state.user) {
          return <div>Loading...</div>;
        }
        return <Settings 
          userRole={state.user.role || 'staff'} 
          user={state.user}
          isDarkMode={state.isDarkMode}
          onToggleTheme={toggleTheme}
        />;
      default:
        return state.user?.role === 'admin' 
          ? <AdminDashboard />
          : <StaffDashboard onNavigate={navigateTo} />;
    }
  };

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {renderContent()}
        <Toaster />
      </div>
    );
  }

  return (
    <Layout 
      user={state.user!} 
      currentView={state.currentView}
      onNavigate={navigateTo}
      onLogout={handleLogout}
      isDarkMode={state.isDarkMode}
      onToggleTheme={toggleTheme}
    >
      {renderContent()}
      <Toaster />
    </Layout>
  );
}