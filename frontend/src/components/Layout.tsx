import React, { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { LogOut, Home, Users, Plus, Info, Settings, BarChart2, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

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

  const NavLinks = ({ className = "" }: { className?: string }) => (
    <div className={`flex ${className}`}>
      <Link to="/">
        <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary hover:bg-accent w-full md:w-auto justify-start md:justify-center">
          <Home size={16} className="mr-2" />
          Home
        </Button>
      </Link>
      <Link to="/current-team">
        <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary hover:bg-accent w-full md:w-auto justify-start md:justify-center">
          <Users size={16} className="mr-2" />
          Current Team
        </Button>
      </Link>
      <Link to="/new-work">
        <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary hover:bg-accent w-full md:w-auto justify-start md:justify-center">
          <Plus size={16} className="mr-2" />
          New Work
        </Button>
      </Link>
      <Link to="/reports">
        <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary hover:bg-accent w-full md:w-auto justify-start md:justify-center">
          <BarChart2 size={16} className="mr-2" />
          Reports
        </Button>
      </Link>
      <Link to="/about">
        <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary hover:bg-accent w-full md:w-auto justify-start md:justify-center">
          <Info size={16} className="mr-2" />
          About
        </Button>
      </Link>
      <Link to="/settings">
        <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary hover:bg-accent w-full md:w-auto justify-start md:justify-center">
          <Settings size={16} className="mr-2" />
          Settings
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b-2 border-primary shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-primary truncate">IRIS Recognition System</h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">MNREGA Worker Management Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium text-foreground truncate max-w-[150px]">{user?.name}</p>
                <p className="text-sm text-muted-foreground truncate max-w-[150px]">{user?.role}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hover:bg-destructive hover:text-destructive-foreground">
                <LogOut size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
              
              {/* Mobile Menu */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[250px] pt-12">
                    <NavLinks className="flex-col space-y-2" />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="bg-secondary border-b hidden md:block">
        <div className="container mx-auto px-4">
          <NavLinks className="space-x-1" />
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
            © {new Date().getFullYear()} IRIS Recognition System | Government of India | MNREGA Portal
          </p>

        </div>
      </footer>
    </div>
  );
};

export default Layout;