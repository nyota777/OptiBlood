import React from 'react';
import { User, UserRole } from '../../App';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { ThemeToggle } from '../ui/theme-toggle';
import { 
  Hospital, 
  Shield, 
  Heart, 
  Users, 
  FileText, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  user: User;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function Layout({ user, currentView, onNavigate, onLogout, children, isDarkMode, onToggleTheme }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'staff':
        return <Users className="h-5 w-5" />;
      case 'admin':
        return <Shield className="h-5 w-5" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'staff':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
    }
  };

  const getNavigationItems = () => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: Hospital },
      { id: 'donors', label: 'Donors', icon: Users },
      { id: 'inventory', label: 'Inventory', icon: Heart },
      { id: 'emails', label: 'Emails', icon: Bell },
      { id: 'reports', label: 'Reports', icon: FileText }
    ];

    return items;
  };

  const navigationItems = getNavigationItems();

  const Sidebar = ({ className = '' }: { className?: string }) => (
    <div className={`bg-white border-r border-gray-200 ${className}`}>
      {/* Logo and Branding */}
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-lg">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">OptiBlood</h1>
            <p className="text-sm text-gray-500">AI Blood Management</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* User Profile */}
      <div className="p-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
              {getRoleIcon(user.role)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-sm text-gray-500 truncate">{user.hospitalName}</p>
            </div>
          </div>
          <div className="mt-2">
            <Badge className={`${getRoleColor(user.role)} text-xs`}>
              {user.role.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Navigation */}
      <nav className="px-4 pb-4">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? "default" : "ghost"}
              className={`w-full justify-start ${
                currentView === item.id 
                  ? "bg-red-600 text-white hover:bg-red-700" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                onNavigate(item.id);
                setSidebarOpen(false);
              }}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          <Button
            variant="ghost"
            className={`w-full justify-start ${
              currentView === 'profile' || currentView === 'settings'
                ? "bg-red-600 text-white hover:bg-red-700" 
                : "text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => onNavigate('profile')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:bg-red-50"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80">
        <Sidebar className="h-full" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-80 max-w-xs">
            <Sidebar className="h-full" />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-red-600" />
                <h1 className="text-lg font-semibold text-gray-900">OptiBlood</h1>
              </div>
            </div>
            <Badge className={`${getRoleColor(user.role)} text-xs`}>
              {user.role.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}