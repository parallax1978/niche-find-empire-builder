
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { CheckCircle, Search, ArrowRight, Loader2 } from "lucide-react";
import { verifyPaymentSuccess, getUserCredits } from "@/services/creditsService";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      setIsVerifying(true);
      try {
        if (sessionId) {
          const success = await verifyPaymentSuccess(sessionId);
          setPaymentVerified(success);
          
          // Get updated credits
          const userCredits = await getUserCredits();
          setCredits(userCredits);
        } else {
          setPaymentVerified(false);
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setPaymentVerified(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Container>
        <div className="py-16 md:py-24">
          <div className="max-w-lg mx-auto text-center">
            {isVerifying ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-16 w-16 text-[#5414C2] animate-spin" />
                <h1 className="text-3xl font-bold mb-4">Verifying your payment...</h1>
                <p className="text-gray-600">Please wait while we confirm your purchase.</p>
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
                  <p className="text-yellow-800">We couldn't verify your payment. If you completed a purchase, it may take a few moments to process.</p>
                </div>
                
                <h1 className="text-2xl font-bold">Payment Verification Failed</h1>
                <p className="text-gray-600">If you believe this is an error, please check your account page in a few minutes or contact support.</p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild variant="outline">
                    <Link to="/account">
                      Check Account
                    </Link>
                  </Button>
                  <Button asChild>
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
