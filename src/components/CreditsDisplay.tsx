import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, CreditCard, Package } from "lucide-react";
import { getUserCredits, initiateCheckout } from "@/services/creditsService";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface CreditsDisplayProps {
  minimal?: boolean;
  onPurchaseComplete?: () => void;
}

const CreditsDisplay = ({ minimal = false, onPurchaseComplete }: CreditsDisplayProps) => {
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCredits = async () => {
      setIsLoading(true);
      try {
        const userCredits = await getUserCredits();
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

    fetchCredits();
  }, [toast]);

  const handlePurchaseBasePackage = async () => {
    setIsPurchasing(true);
    try {
      const response = await initiateCheckout('price_YOUR_BASE_PACKAGE_PRICE_ID');
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
    setIsPurchasing(true);
    try {
      const response = await initiateCheckout('price_YOUR_ADDITIONAL_CREDITS_PRICE_ID', quantity);
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

  if (isLoading) {
    return minimal ? (
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-yellow-500" />
        <Skeleton className="h-4 w-16" />
      </div>
    ) : (
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

  if (minimal) {
    return (
      <div className="flex items-center gap-2 font-medium">
        <Coins className="h-4 w-4 text-yellow-500" />
        <span>{credits ?? 0} credits</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Credits</CardTitle>
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
