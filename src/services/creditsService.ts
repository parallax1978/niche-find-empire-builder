
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
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
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
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
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
export const initiateCheckout = async (packageType: 'base' | 'additional', quantity: number = 1) => {
  try {
    // The priceId will be mapped to your Stripe prices
    const priceId = packageType === 'base' ? 'base-package' : 'additional-credits';

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
    // Update user credits
    const { error } = await supabase
      .from('user_credits')
      .update({ credits: currentCredits - keywordResults })
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

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
    const { error } = await supabase
      .from('search_usage')
      .insert({
        keyword,
        results_count: resultsCount,
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
    const { data, error } = await supabase
      .from('purchases')
      .select('status')
      .eq('stripe_session_id', sessionId)
      .single();

    if (error) {
      console.error("Error verifying payment:", error);
      return false;
    }

    return data?.status === 'completed';
  } catch (error) {
    console.error("Error in verifyPaymentSuccess:", error);
    return false;
  }
};
