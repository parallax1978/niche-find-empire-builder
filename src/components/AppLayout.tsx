
import React, { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Compass, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import CreditsDisplay from "@/components/CreditsDisplay";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(!!data.user);
    };
    
    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center">
            <div className="flex items-center">
              <Link 
                to="/" 
                className="text-xl font-bold bg-brand-gradient bg-clip-text text-transparent mr-8 hover:opacity-80 transition-opacity flex items-center gap-2"
              >
                <Compass className="h-6 w-6 text-[#5414C2]" />
                Rank & Rent Finder
              </Link>
            </div>
            
            <nav className="hidden md:flex space-x-4 ml-auto items-center">
              {isAuthenticated && <CreditsDisplay minimal />}
              
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

              {isAuthenticated ? (
                <>
                  <Link 
                    to="/account" 
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors", 
                      isActive("/account") 
                        ? "bg-brand-gradient text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <User className="h-4 w-4" />
                    <span>Account</span>
                  </Link>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    className="flex items-center gap-1.5"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </>
              ) : (
                <Link 
                  to="/auth" 
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors", 
                    isActive("/auth") 
                      ? "bg-brand-gradient text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <User className="h-4 w-4" />
                  <span>Login / Sign Up</span>
                </Link>
              )}
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

              {isAuthenticated ? (
                <>
                  <Link 
                    to="/account" 
                    className={cn(
                      "p-2 rounded-md", 
                      isActive("/account") 
                        ? "bg-brand-gradient text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <User className="h-5 w-5" />
                  </Link>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Link 
                  to="/auth" 
                  className={cn(
                    "p-2 rounded-md", 
                    isActive("/auth") 
                      ? "bg-brand-gradient text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <User className="h-5 w-5" />
                </Link>
              )}
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
