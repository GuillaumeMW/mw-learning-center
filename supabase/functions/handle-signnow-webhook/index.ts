import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[HANDLE-SIGNNOW-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const webhookPayload = await req.json();
    logStep("Received SignNow webhook", { payloadKeys: Object.keys(webhookPayload) });

    // TODO: Validate SignNow webhook signature for security
    // const signature = req.headers.get("X-SignNow-Signature");
    // if (!validateSignNowSignature(webhookPayload, signature)) {
    //   throw new Error("Invalid webhook signature");
    // }

    // Parse SignNow webhook data (structure depends on SignNow webhook format)
    const { 
      document_id, 
      status, 
      user_id, 
      level, 
      document_url,
      event_type 
    } = webhookPayload;

    if (!document_id || !status) {
      throw new Error("Missing required webhook fields");
    }

    logStep("Parsed webhook data", { document_id, status, event_type });

    // Map SignNow status to our contract status
    let contractStatus: string;
    let currentStep: string;

    switch (status.toLowerCase()) {
      case "signed":
      case "completed":
        contractStatus = "signed";
        currentStep = "payment";
        break;
      case "declined":
      case "rejected":
        contractStatus = "rejected";
        currentStep = "contract";
        break;
      default:
        contractStatus = "pending_signing";
        currentStep = "contract";
    }

    logStep("Mapped status", { contractStatus, currentStep });

    // Find and update the certification workflow
    // Note: You may need to store document_id in the workflow record or use metadata to match
    const { data: workflow, error: fetchError } = await supabaseClient
      .from("certification_workflows")
      .select("*")
      .eq("user_id", user_id)
      .eq("level", level)
      .single();

    if (fetchError || !workflow) {
      logStep("ERROR: Workflow not found", { user_id, level, error: fetchError });
      // Still return 200 to acknowledge webhook
      return new Response(JSON.stringify({ 
        acknowledged: true, 
        message: "Workflow not found but webhook acknowledged" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let updateData: any = {
      contract_status: contractStatus,
      current_step: currentStep,
      updated_at: new Date().toISOString()
    };

    if (document_url) {
      updateData.contract_doc_url = document_url;
    }

    const { error: updateError } = await supabaseClient
      .from("certification_workflows")
      .update(updateData)
      .eq("id", workflow.id);

    if (updateError) {
      logStep("ERROR updating workflow", { error: updateError });
      throw new Error(`Failed to update workflow: ${updateError.message}`);
    }

    logStep("Workflow updated successfully", { workflowId: workflow.id });

    return new Response(JSON.stringify({ 
      acknowledged: true, 
      message: "SignNow webhook processed successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in handle-signnow-webhook", { message: errorMessage });
    
    // Return 200 to prevent webhook retries for processing errors
    return new Response(JSON.stringify({ 
      acknowledged: true, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});