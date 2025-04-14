
import React, { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col min-h-screen w-full">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center">
            <div className="flex items-center">
              <Link 
                to="/" 
                className="text-xl font-bold bg-brand-gradient bg-clip-text text-transparent mr-8 hover:opacity-80 transition-opacity"
              >
                Rank & Rent Finder
              </Link>
            </div>
            
            <nav className="hidden md:flex space-x-4 ml-auto">
              <Link 
                to="/" 
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors", 
                  isActive("/") 
                    ? "bg-brand-gradient text-white" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              
              <Link 
                to="/search" 
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors", 
                  isActive("/search") 
                    ? "bg-brand-gradient text-white" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </Link>
            </nav>
            
            {/* Mobile Navigation Links */}
            <div className="md:hidden flex items-center space-x-2 ml-auto">
              <Link 
                to="/" 
                className={cn(
                  "p-2 rounded-md", 
                  isActive("/") 
                    ? "bg-brand-gradient text-white" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Home className="h-5 w-5" />
              </Link>
              
              <Link 
                to="/search" 
                className={cn(
                  "p-2 rounded-md", 
                  isActive("/search") 
                    ? "bg-brand-gradient text-white" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Search className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Optional Footer */}
      <footer className="py-4 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Rank & Rent
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;

interface AppLayoutProps {
  children: ReactNode;
}

