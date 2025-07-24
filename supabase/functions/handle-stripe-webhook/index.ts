import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[HANDLE-STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Verify webhook signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("Missing Stripe signature");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { eventType: event.type });
    } catch (err) {
      logStep("ERROR: Webhook signature verification failed", { error: err });
      throw new Error("Invalid webhook signature");
    }

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle specific Stripe events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", { sessionId: session.id });

        const clientReferenceId = session.client_reference_id;
        const metadata = session.metadata;

        let userId: string;
        let level: number;

        // Extract user_id and level from client_reference_id or metadata
        if (clientReferenceId && clientReferenceId.includes("-")) {
          const [extractedUserId, extractedLevel] = clientReferenceId.split("-");
          userId = extractedUserId;
          level = parseInt(extractedLevel);
        } else if (metadata?.user_id && metadata?.level) {
          userId = metadata.user_id;
          level = parseInt(metadata.level);
        } else {
          throw new Error("Cannot identify user_id and level from session data");
        }

        logStep("Extracted session data", { userId, level, sessionId: session.id });

        // Update certification workflow
        const { data: workflow, error: updateError } = await supabaseClient
          .from("certification_workflows")
          .update({
            subscription_status: session.payment_status === "paid" ? "paid" : "pending_payment",
            current_step: session.payment_status === "paid" ? "completed" : "payment",
            completed_at: session.payment_status === "paid" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId)
          .eq("level", level)
          .eq("stripe_checkout_session_id", session.id)
          .select()
          .single();

        if (updateError) {
          logStep("ERROR updating workflow", { error: updateError });
          throw new Error(`Failed to update workflow: ${updateError.message}`);
        }

        logStep("Workflow updated successfully", { workflowId: workflow?.id });

        // Optional: Update user access/eligibility for next level
        if (session.payment_status === "paid") {
          // TODO: Implement access unlock logic
          logStep("Payment completed - certification process finished");
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing invoice.payment_succeeded", { invoiceId: invoice.id });

        // Handle recurring subscription payments if needed
        // This might be relevant for ongoing access fees

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing invoice.payment_failed", { invoiceId: invoice.id });

        // Handle failed payments
        // Update workflow status if needed

        break;
      }

      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ 
      received: true, 
      eventType: event.type 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in handle-stripe-webhook", { message: errorMessage });
    
    // Return 400 for webhook signature errors, 200 for processing errors
    const statusCode = errorMessage.includes("signature") ? 400 : 200;
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      received: statusCode === 200
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});