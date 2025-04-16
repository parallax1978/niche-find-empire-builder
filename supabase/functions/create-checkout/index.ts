
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Stripe with the secret key
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { priceId, quantity = 1 } = await req.json();

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Missing priceId parameter" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
        auth: { persistSession: false }
      }
    );

    // Get user from supabase auth
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized, no valid user session found" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Map the package type to the actual Stripe price ID
    // You'll need to replace these with your actual Stripe price IDs
    const stripePriceId = priceId;

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId,
          quantity: quantity,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/search`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        userId: user.id,
      },
    });

    // Create a pending purchase record in the database
    const creditsToAdd = priceId === "base-package" ? 100 : quantity;
    const amount = priceId === "base-package" ? 37.00 : (0.75 * quantity);

    // Create Supabase admin client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Insert purchase record
    const { error: purchaseError } = await supabaseAdmin
      .from("purchases")
      .insert({
        user_id: user.id,
        amount,
        credits_purchased: creditsToAdd,
        stripe_session_id: session.id,
        status: "pending",
      });

    if (purchaseError) {
      console.error("Error creating purchase record:", purchaseError);
      // Proceed anyway as the webhook will update our records
    }

    // Return the session ID to the client
    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        sessionUrl: session.url 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
