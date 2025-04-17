
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface UserCredits {
  id: string;
  user_id: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  amount: number;
  credits_purchased: number;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

// Get user credits
export const getUserCredits = async (): Promise<number> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      console.log("User not authenticated");
      return 0;
    }
    
    // Use type assertion to work around TypeScript limitations 
    // until the generated types are updated
    const { data, error } = await (supabase
      .from('user_credits') as any)
      .select('credits')
      .eq('user_id', user.user.id)
      .single();

    if (error) {
      console.error("Error fetching user credits:", error);
      if (error.code === 'PGRST116') {
        // No credits found, which means the user hasn't purchased any yet
        return 0;
      }
      throw error;
    }

    return data?.credits || 0;
  } catch (error) {
    console.error("Error in getUserCredits:", error);
    return 0;
  }
};

// Get user purchase history
export const getPurchaseHistory = async (): Promise<Purchase[]> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      console.log("User not authenticated");
      return [];
    }
    
    // Use type assertion to work around TypeScript limitations
    const { data, error } = await (supabase
      .from('purchases') as any)
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching purchase history:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getPurchaseHistory:", error);
    return [];
  }
};

// Initialize checkout for purchasing credits
export const initiateCheckout = async (priceId: string, quantity: number = 1) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits.",
        variant: "destructive",
      });
      return null;
    }
    
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId, quantity },
    });

    if (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Checkout Error",
        description: "Could not initialize checkout. Please try again.",
        variant: "destructive",
      });
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in initiateCheckout:", error);
    toast({
      title: "Checkout Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive",
    });
    return null;
  }
};

// Use credits for a search - returns true if successful, false if not enough credits
export const useCreditsForSearch = async (keywordResults: number): Promise<boolean> => {
  // First check if user has enough credits
  const currentCredits = await getUserCredits();
  
  if (currentCredits < keywordResults) {
    toast({
      title: "Not enough credits",
      description: `You need ${keywordResults} credits but only have ${currentCredits}. Please purchase more credits.`,
      variant: "destructive",
    });
    return false;
  }

  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use credits.",
        variant: "destructive",
      });
      return false;
    }
    
    // Update user credits
    const { error } = await (supabase
      .from('user_credits') as any)
      .update({ credits: currentCredits - keywordResults })
      .eq('user_id', user.user.id);

    if (error) {
      console.error("Error updating user credits:", error);
      toast({
        title: "Error",
        description: "Could not use credits. Please try again.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in useCreditsForSearch:", error);
    toast({
      title: "Error",
      description: "An unexpected error occurred while using credits.",
      variant: "destructive",
    });
    return false;
  }
};

// Record search usage
export const recordSearchUsage = async (keyword: string, resultsCount: number): Promise<void> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      console.log("User not authenticated, not recording search usage");
      return;
    }
    
    const { error } = await (supabase
      .from('search_usage') as any)
      .insert({
        keyword,
        results_count: resultsCount,
        user_id: user.user.id
      });

    if (error) {
      console.error("Error recording search usage:", error);
    }
  } catch (error) {
    console.error("Error in recordSearchUsage:", error);
  }
};

// Verify payment success from URL parameter
export const verifyPaymentSuccess = async (sessionId: string): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      console.log("User not authenticated, cannot verify payment");
      return false;
    }
    
    // Check if we have a completed payment record
    const { data, error } = await (supabase
      .from('purchases') as any)
      .select('status')
      .eq('stripe_session_id', sessionId)
      .single();

    if (error) {
      console.error("Error verifying payment:", error);
      
      // If the record doesn't exist yet, the payment might still be processing
      if (error.code === 'PGRST116') {
        console.log("Purchase record not found, payment may still be processing");
      }
      return false;
    }

    return data?.status === 'completed';
  } catch (error) {
    console.error("Error in verifyPaymentSuccess:", error);
    return false;
  }
};
