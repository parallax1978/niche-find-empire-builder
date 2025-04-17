
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
    console.log("Create checkout function called");
    
    // Get the request body
    const { priceId, quantity = 1 } = await req.json();

    if (!priceId) {
      console.error("Missing priceId parameter");
      return new Response(
        JSON.stringify({ error: "Missing priceId parameter" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log(`Creating checkout session for price: ${priceId}, quantity: ${quantity}`);

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
      console.error("Unauthorized, no valid user session found:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized, no valid user session found" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log(`User authenticated: ${user.id}, ${user.email}`);

    // Check if customer already exists
    const customers = await stripe.customers.list({ 
      email: user.email,
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log(`Found existing Stripe customer: ${customerId}`);
    } else {
      // Create a new customer if none exists
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
      console.log(`Created new Stripe customer: ${customerId}`);
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
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
      metadata: {
        userId: user.id,
      },
    });
    
    console.log(`Created checkout session: ${session.id}`);

    // Create a pending purchase record in the database
    const creditsToAdd = priceId === "price_1REebyBLSlqVQTdBMTgjVes" ? 100 : quantity;
    const amount = priceId === "price_1REebyBLSlqVQTdBMTgjVes" ? 37.00 : (0.75 * quantity);

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
    } else {
      console.log(`Created pending purchase record with ${creditsToAdd} credits for $${amount}`);
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
