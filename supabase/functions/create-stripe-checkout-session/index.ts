import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-STRIPE-CHECKOUT-SESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const userId = userData.user?.id;
    const userEmail = userData.user?.email;
    if (!userId || !userEmail) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId, userEmail });

    const { user_id, level, price_id } = await req.json();

    if (userId !== user_id) {
      throw new Error("User can only create checkout sessions for themselves");
    }

    if (!level) {
      throw new Error("Missing required field: level");
    }

    logStep("Request validated", { user_id, level, price_id });

    // Use service role to check workflow status
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: workflow, error: fetchError } = await supabaseService
      .from("certification_workflows")
      .select("*")
      .eq("user_id", user_id)
      .eq("level", level)
      .single();

    if (fetchError || !workflow) {
      throw new Error("Certification workflow not found");
    }

    if (workflow.contract_status !== "signed") {
      throw new Error("Payment not available until contract is signed");
    }

    logStep("Workflow validated", { workflowId: workflow.id });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      logStep("No existing Stripe customer found");
    }

    // Define default pricing based on level if no price_id provided
    const levelPricing = {
      1: { amount: 2999, name: "Level 1 Certification" }, // $29.99
      2: { amount: 4999, name: "Level 2 Certification" }, // $49.99
      3: { amount: 7999, name: "Level 3 Certification" }, // $79.99
      4: { amount: 9999, name: "Level 4 Certification" }, // $99.99
    };

    const pricing = levelPricing[level as keyof typeof levelPricing];
    if (!pricing && !price_id) {
      throw new Error(`No pricing configured for level ${level}`);
    }

    // Create checkout session
    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: price_id ? [
        {
          price: price_id,
          quantity: 1,
        }
      ] : [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: pricing.name,
              description: `Relocation Specialist Level ${level} Certification`
            },
            unit_amount: pricing.amount,
          },
          quantity: 1,
        }
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/certification-success?level=${level}`,
      cancel_url: `${req.headers.get("origin")}/certification-payment?level=${level}`,
      client_reference_id: `${user_id}-${level}`, // For webhook identification
      metadata: {
        user_id,
        level: level.toString(),
        workflow_id: workflow.id
      }
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Stripe session created", { sessionId: session.id });

    // Update workflow
    const { error: updateError } = await supabaseService
      .from("certification_workflows")
      .update({
        subscription_status: "pending_payment",
        stripe_checkout_session_id: session.id,
        current_step: "payment",
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user_id)
      .eq("level", level);

    if (updateError) {
      logStep("ERROR updating workflow", { error: updateError });
      throw new Error(`Failed to update workflow: ${updateError.message}`);
    }

    logStep("Workflow updated successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      url: session.url,  // Changed from checkout_url to url
      session_id: session.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-stripe-checkout-session", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});