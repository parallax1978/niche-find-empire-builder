
import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ReceiptText, AlertCircle, RefreshCcw } from "lucide-react";
import { getUserCredits, getPurchaseHistory, Purchase } from "@/services/creditsService";
import CreditsDisplay from "@/components/CreditsDisplay";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Account = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);
  const [authCheckFailed, setAuthCheckFailed] = useState<boolean>(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Set a timeout to avoid infinite loading
    const timeoutId = setTimeout(() => {
      console.log("Loading timeout triggered after 10 seconds");
      setLoadingTimeout(true);
    }, 10000); // 10 seconds timeout
    
    const checkAuth = async () => {
      try {
        console.log("Checking auth status...");
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Error checking auth:", error);
          toast({
            title: "Authentication Error",
            description: "Unable to verify your account. Please try signing in again.",
            variant: "destructive",
          });
          setIsAuthenticated(false);
          setAuthChecked(true);
          setAuthCheckFailed(true);
          setIsLoading(false);
          return;
        }
        
        const isLoggedIn = !!data.user;
        console.log("Auth check complete, user logged in:", isLoggedIn);
        
        if (!isLoggedIn) {
          console.log("User not logged in, redirecting to auth page");
          setIsAuthenticated(false);
          setAuthChecked(true);
          setIsLoading(false);
          navigate("/auth", { replace: true });
          return;
        }
        
        // User is authenticated
        setIsAuthenticated(true);
        setAuthChecked(true);
        
        // Fetch account data
        await loadData();
      } catch (err) {
        console.error("Unexpected error during auth check:", err);
        setAuthChecked(true);
        setIsAuthenticated(false);
        setAuthCheckFailed(true);
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      const isLoggedIn = !!session?.user;
      
      if (isLoggedIn !== isAuthenticated) {
        console.log("Authentication state changed, updating UI");
        setIsAuthenticated(isLoggedIn);
        
        if (!isLoggedIn && authChecked) {
          setIsLoading(false);
          navigate("/auth", { replace: true });
        } else if (isLoggedIn && authChecked) {
          // Use setTimeout to avoid immediate Supabase call in the callback
          setTimeout(() => {
            loadData();
          }, 0);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [navigate]);
  
  const loadData = async () => {
    console.log("Loading account data...");
    setIsLoading(true);
    
    try {
      const purchaseHistory = await getPurchaseHistory();
      console.log("Purchase history loaded:", purchaseHistory);
      setPurchases(purchaseHistory);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading account data:", error);
      toast({
        title: "Data Loading Error",
        description: "Could not load your account data. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "Unknown date";
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handleRefresh = () => {
    console.log("Manual refresh initiated");
    window.location.reload();
  };

  // Show loading timeout message if loading takes too long
  if (loadingTimeout && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Container>
          <div className="py-16 text-center">
            <div className="max-w-md mx-auto">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Loading is taking longer than expected</h1>
              <p className="mb-6">There may be an issue with loading your account data.</p>
              <Button onClick={handleRefresh}>Refresh Page</Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }
  
  // Show auth check failed message
  if (authCheckFailed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Container>
          <div className="py-16 text-center">
            <div className="max-w-md mx-auto">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
              <p className="mb-6">We couldn't verify your account. Please try signing in again.</p>
              <Button onClick={() => navigate("/auth", { replace: true })}>Go to Sign In</Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#5414C2] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Container>
          <div className="py-16 text-center">
            <div className="max-w-md mx-auto">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
              <p className="mb-6">Please sign in to view your account details.</p>
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Container>
        <div className="py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 bg-brand-gradient bg-clip-text text-transparent">Account</h1>
            
            <Tabs defaultValue="credits" className="space-y-6">
              <TabsList>
                <TabsTrigger value="credits">Credits</TabsTrigger>
                <TabsTrigger value="purchases">Purchase History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="credits" className="space-y-6">
                <CreditsDisplay onPurchaseComplete={loadData} />
                
                <Card>
                  <CardHeader>
                    <CardTitle>How Credits Work</CardTitle>
                    <CardDescription>Understanding our credit system</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Base Package</h3>
                      <p className="text-sm text-muted-foreground">Our base package includes 100 credits for $37.00, which allows you to find up to 100 keyword opportunities.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-1">Additional Credits</h3>
                      <p className="text-sm text-muted-foreground">Need more credits? You can purchase additional credits for $0.75 each. Buy in bulk to find even more opportunities.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-1">Credit Usage</h3>
                      <p className="text-sm text-muted-foreground">Each search result uses 1 credit. Credits are deducted only when search results are found and displayed.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="purchases">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ReceiptText className="h-5 w-5 text-[#5414C2]" />
                        <CardTitle>Purchase History</CardTitle>
                      </div>
                      {!isLoading && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={loadData}
                          className="gap-1"
                        >
                          <RefreshCcw className="h-3.5 w-3.5" />
                          Refresh
                        </Button>
                      )}
                    </div>
                    <CardDescription>Your recent credit purchases</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-[#5414C2]" />
                      </div>
                    ) : purchases.length > 0 ? (
                      <Table>
                        <TableCaption>Your purchase history</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Credits</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {purchases.map((purchase) => (
                            <TableRow key={purchase.id}>
                              <TableCell>{formatDate(purchase.created_at)}</TableCell>
                              <TableCell>{purchase.credits_purchased}</TableCell>
                              <TableCell>{formatCurrency(purchase.amount)}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(purchase.status)}`}>
                                  {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No purchase history found.</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={loadData}
                        >
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Refresh History
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Account;
