
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

// This webhook should be called by Stripe when a payment is completed
serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature" }), {
      status: 400,
    });
  }

  try {
    // Get the raw body to verify the webhook
    const body = await req.text();
    let event;

    try {
      // Verify the webhook against the Stripe webhook secret
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
      });
    }

    // Create Supabase admin client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata.userId || session.client_reference_id;
        const sessionId = session.id;

        if (!userId) {
          console.error("No userId found in session metadata or client_reference_id");
          break;
        }

        // Get the purchase record
        const { data: purchaseData, error: purchaseError } = await supabaseAdmin
          .from("purchases")
          .select("*")
          .eq("stripe_session_id", sessionId)
          .single();

        if (purchaseError || !purchaseData) {
          console.error("Error finding purchase record:", purchaseError);
          break;
        }

        // Update the purchase record status
        const { error: updateError } = await supabaseAdmin
          .from("purchases")
          .update({
            status: "completed",
            stripe_payment_intent_id: session.payment_intent,
          })
          .eq("id", purchaseData.id);

        if (updateError) {
          console.error("Error updating purchase record:", updateError);
          break;
        }

        // Check if user already has credits
        const { data: userCreditsData, error: userCreditsError } = await supabaseAdmin
          .from("user_credits")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (userCreditsError && userCreditsError.code !== "PGRST116") {
          console.error("Error checking user credits:", userCreditsError);
          break;
        }

        // Add credits to the user
        const creditAmount = purchaseData.credits_purchased;

        if (userCreditsData) {
          // Update existing credits
          const { error: updateCreditsError } = await supabaseAdmin
            .from("user_credits")
            .update({
              credits: userCreditsData.credits + creditAmount,
            })
            .eq("user_id", userId);

          if (updateCreditsError) {
            console.error("Error updating user credits:", updateCreditsError);
            break;
          }
        } else {
          // Create new user credits record
          const { error: insertCreditsError } = await supabaseAdmin
            .from("user_credits")
            .insert({
              user_id: userId,
              credits: creditAmount,
            });

          if (insertCreditsError) {
            console.error("Error inserting user credits:", insertCreditsError);
            break;
          }
        }

        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
