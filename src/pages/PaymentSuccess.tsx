
import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { CheckCircle, Search, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { verifyPaymentSuccess, getUserCredits } from "@/services/creditsService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Check authentication status first
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Authentication error:", error);
          toast({
            title: "Authentication Error",
            description: "Please sign in to verify your payment",
            variant: "destructive",
          });
          navigate("/auth", { replace: true });
          return;
        }
        
        setIsAuthenticated(!!data.user);
        
        if (!data.user) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to verify your payment",
            variant: "destructive",
          });
          navigate("/auth", { replace: true });
          return;
        }
        
        // Proceed with payment verification
        verifyPayment();
      } catch (err) {
        console.error("Unexpected auth error:", err);
        toast({
          title: "Authentication Error",
          description: "An unexpected error occurred. Please try signing in again.",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      }
    };
    
    const verifyPayment = async () => {
      setIsVerifying(true);
      try {
        if (sessionId) {
          // Try multiple verification attempts with delays
          let success = false;
          let attempts = 0;
          const maxAttempts = 5;
          
          while (!success && attempts < maxAttempts) {
            attempts++;
            setAttemptCount(attempts);
            console.log(`Verification attempt ${attempts}/${maxAttempts} for session ${sessionId}`);
            
            success = await verifyPaymentSuccess(sessionId);
            
            if (success) {
              console.log("Payment verification successful");
              setPaymentVerified(true);
              // Get updated credits
              const userCredits = await getUserCredits();
              console.log("Updated user credits:", userCredits);
              setCredits(userCredits);
              
              toast({
                title: "Payment Successful",
                description: "Your credits have been added to your account",
              });
              break;
            } else if (attempts < maxAttempts) {
              // Wait before trying again (exponential backoff)
              const delay = 2000 * Math.min(attempts, 3);
              console.log(`Waiting ${delay}ms before next attempt`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          
          // If still not successful after all attempts
          if (!success) {
            console.log("Payment verification failed after all attempts");
            setPaymentVerified(false);
            toast({
              title: "Payment Verification Delayed",
              description: "Your payment may still be processing. Please check your account page in a few minutes.",
              variant: "default",
            });
          }
        } else {
          console.error("No session ID provided");
          setPaymentVerified(false);
          toast({
            title: "Invalid Session",
            description: "No session ID was provided to verify the payment",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setPaymentVerified(false);
        toast({
          title: "Verification Error",
          description: "An unexpected error occurred while verifying your payment",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    checkAuth();
  }, [sessionId, navigate, toast]);

  const handleRetryVerification = async () => {
    setIsVerifying(true);
    setAttemptCount(prev => prev + 1);
    
    try {
      if (sessionId) {
        console.log(`Manual retry verification for session ${sessionId}`);
        const success = await verifyPaymentSuccess(sessionId);
        
        if (success) {
          console.log("Manual retry successful");
          setPaymentVerified(true);
          const userCredits = await getUserCredits();
          setCredits(userCredits);
          
          toast({
            title: "Payment Verified",
            description: "Your credits have been added to your account",
          });
        } else {
          console.log("Manual retry failed");
          toast({
            title: "Verification Still Pending",
            description: "Your payment is still being processed. Please check again later.",
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error("Error in manual verification:", error);
      toast({
        title: "Verification Error",
        description: "An error occurred during verification",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container>
        <div className="py-16 md:py-24">
          <div className="max-w-lg mx-auto text-center">
            {isVerifying ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-16 w-16 text-[#5414C2] animate-spin" />
                <h1 className="text-3xl font-bold mb-4">Verifying your payment...</h1>
                <p className="text-gray-600">Please wait while we confirm your purchase. This may take a moment.</p>
                {attemptCount > 0 && (
                  <p className="text-sm text-gray-500">Attempt {attemptCount} of 5</p>
                )}
              </div>
            ) : paymentVerified ? (
              <div className="flex flex-col items-center space-y-6">
                <CheckCircle className="h-20 w-20 text-green-500" />
                <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
                <p className="text-xl mb-2">Thank you for your purchase.</p>
                
                {credits !== null && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
                    <p className="text-gray-600 mb-2">Your current balance:</p>
                    <p className="text-4xl font-bold text-[#5414C2]">{credits} credits</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg">
                    <Link to="/search">
                      <Search className="mr-2 h-5 w-5" />
                      Start Searching
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/account">
                      View Account
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-6">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                  <p className="text-yellow-800">We couldn't verify your payment immediately. If you completed a purchase, it may take a few minutes to process.</p>
                </div>
                
                <h1 className="text-2xl font-bold">Payment Verification Delayed</h1>
                <p className="text-gray-600 mb-6">Your payment is being processed. Please check your account page in a few minutes or try refreshing this page.</p>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Button onClick={handleRetryVerification} disabled={isVerifying} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Retry Verification
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/account">
                      Check Account
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link to="/search">
                      Return to Search
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default PaymentSuccess;
