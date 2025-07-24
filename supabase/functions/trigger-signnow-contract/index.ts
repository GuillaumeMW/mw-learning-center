import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRIGGER-SIGNNOW-CONTRACT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const signNowApiKey = Deno.env.get("SIGNNOW_API_KEY");
    if (!signNowApiKey) throw new Error("SIGNNOW_API_KEY is not configured");

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
    if (!userId) throw new Error("User not authenticated");

    logStep("User authenticated", { userId });

    const { user_id, level } = await req.json();

    if (userId !== user_id) {
      throw new Error("User can only trigger contracts for themselves");
    }

    if (!level) {
      throw new Error("Missing required field: level");
    }

    logStep("Request validated", { user_id, level });

    // Use service role to check workflow status
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if admin approval is completed
    const { data: workflow, error: fetchError } = await supabaseService
      .from("certification_workflows")
      .select("*")
      .eq("user_id", user_id)
      .eq("level", level)
      .single();

    if (fetchError || !workflow) {
      throw new Error("Certification workflow not found");
    }

    if (workflow.admin_approval_status !== "approved") {
      throw new Error("Contract signing not available until admin approval is complete");
    }

    logStep("Workflow validated", { workflowId: workflow.id });

    // TODO: Integrate with SignNow API
    // This is a placeholder - actual implementation depends on SignNow API structure
    const signNowResponse = await fetch("https://api.signnow.com/document", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${signNowApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        template_id: `level_${level}_contract_template`,
        user_email: userData.user.email,
        // Add other required SignNow fields
      })
    });

    if (!signNowResponse.ok) {
      throw new Error(`SignNow API error: ${signNowResponse.statusText}`);
    }

    const signNowData = await signNowResponse.json();
    const signingUrl = signNowData.signing_url; // Adjust based on actual SignNow response structure

    logStep("SignNow contract created", { documentId: signNowData.document_id });

    // Update workflow
    const { error: updateError } = await supabaseService
      .from("certification_workflows")
      .update({
        contract_status: "pending_signing",
        current_step: "contract",
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
      signing_url: signingUrl,
      message: "Contract signing link generated successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in trigger-signnow-contract", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});