
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, CreditCard, Package, LogIn, RefreshCw } from "lucide-react";
import { getUserCredits, initiateCheckout } from "@/services/creditsService";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface CreditsDisplayProps {
  minimal?: boolean;
  onPurchaseComplete?: () => void;
}

const CreditsDisplay = ({ minimal = false, onPurchaseComplete }: CreditsDisplayProps) => {
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initial auth check and subscription setup
    const checkAuthAndSetupSubscription = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth error in CreditsDisplay:", error);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        const isLoggedIn = !!data.session?.user;
        console.log("Initial auth check - User logged in:", isLoggedIn);
        setIsAuthenticated(isLoggedIn);
        
        if (isLoggedIn) {
          await fetchCredits();
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Unexpected error in CreditsDisplay auth check:", err);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };
    
    checkAuthAndSetupSubscription();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed in CreditsDisplay:", event, !!session);
      const isLoggedIn = !!session?.user;
      
      if (isLoggedIn !== isAuthenticated) {
        setIsAuthenticated(isLoggedIn);
        
        if (isLoggedIn) {
          // Use setTimeout to avoid immediate Supabase call in the callback
          setTimeout(async () => {
            await fetchCredits();
          }, 0);
        } else {
          setCredits(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthenticated]);

  const fetchCredits = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching user credits in CreditsDisplay component");
      const userCredits = await getUserCredits();
      console.log("Received user credits:", userCredits);
      setCredits(userCredits);
    } catch (error) {
      console.error("Failed to fetch credits:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your credits.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshCredits = async () => {
    await fetchCredits();
    toast({
      title: "Credits Refreshed",
      description: "Your credit balance has been updated."
    });
  };

  const handlePurchaseBasePackage = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits.",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    try {
      console.log("Initiating base package purchase");
      const response = await initiateCheckout('price_1REebyBLSlqVQTdBMTgjVes');
      console.log("Checkout response:", response);
      
      if (response?.sessionUrl) {
        window.location.href = response.sessionUrl;
      } else {
        toast({
          title: "Error",
          description: "Failed to start checkout process.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to initiate checkout:", error);
      toast({
        title: "Error",
        description: "Failed to initiate checkout.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handlePurchaseAdditionalCredits = async (quantity: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits.",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    try {
      console.log(`Initiating purchase of ${quantity} additional credits`);
      const response = await initiateCheckout('price_1REef7BLSlqVQTdBXmVmVoXQ', quantity);
      console.log("Checkout response:", response);
      
      if (response?.sessionUrl) {
        window.location.href = response.sessionUrl;
      } else {
        toast({
          title: "Error",
          description: "Failed to start checkout process.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to initiate checkout:", error);
      toast({
        title: "Error",
        description: "Failed to initiate checkout.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (minimal) {
    if (!isAuthenticated) {
      return null;
    }
    
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-yellow-500" />
          <Skeleton className="h-4 w-16" />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 font-medium">
        <Coins className="h-4 w-4 text-yellow-500" />
        <span>{credits ?? 0} credits</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Credits</CardTitle>
          <CardDescription>Purchase credits to find more keywords</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-center mb-4">Please sign in to view and purchase credits</p>
          <Button asChild>
            <Link to="/auth" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign In / Create Account
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Credits</CardTitle>
          <CardDescription>Purchase credits to find more keywords</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Skeleton className="h-10 w-28" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Credits</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefreshCredits} 
            className="h-8 w-8 p-0"
            title="Refresh credits"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </CardTitle>
        <CardDescription>Purchase credits to find more keywords</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Coins className="h-6 w-6 text-yellow-500" />
            <span>{credits ?? 0} credits</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#5414C2]" />
                  Base Package
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-1">Get 100 credits for:</p>
                <p className="text-xl font-bold">$37.00</p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handlePurchaseBasePackage}
                  disabled={isPurchasing}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Buy Now
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#5414C2]" />
                  Additional Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-1">Each credit costs:</p>
                <p className="text-xl font-bold">$0.75</p>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handlePurchaseAdditionalCredits(20)}
                  disabled={isPurchasing}
                >
                  Buy 20
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handlePurchaseAdditionalCredits(50)}
                  disabled={isPurchasing}
                >
                  Buy 50
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditsDisplay;
