import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { LogOut, Home, Users, Plus, Info, Settings } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b-2 border-primary shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">IRIS Recognition System</h1>
                <p className="text-sm text-muted-foreground">MNREGA Worker Management Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-foreground">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.role}</p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="hover:bg-destructive hover:text-destructive-foreground">
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-secondary border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <Link to="/">
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary hover:bg-accent">
                <Home size={16} className="mr-2" />
                Home
              </Button>
            </Link>
            <Link to="/current-team">
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary hover:bg-accent">
                <Users size={16} className="mr-2" />
                Current Team
              </Button>
            </Link>
            <Link to="/new-work">
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary hover:bg-accent">
                <Plus size={16} className="mr-2" />
                New Work
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary hover:bg-accent">
                <Info size={16} className="mr-2" />
                About
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary hover:bg-accent">
                <Settings size={16} className="mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        </div>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-auto py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 IRIS Recognition System | Government of India | MNREGA Portal
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;