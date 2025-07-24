import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[HANDLE-EXAM-SUBMISSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role key for privileged operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const webhookPayload = await req.json();
    logStep("Received webhook payload", { payloadKeys: Object.keys(webhookPayload) });

    // Parse Google Forms data (structure will vary based on form setup)
    // This is a placeholder - actual implementation depends on Google Forms webhook format
    const { user_id, level, exam_results, submission_url } = webhookPayload;

    if (!user_id || !level) {
      throw new Error("Missing required fields: user_id and level");
    }

    logStep("Extracted form data", { user_id, level, hasResults: !!exam_results });

    // Update certification workflow
    const { data: workflow, error: updateError } = await supabaseClient
      .from("certification_workflows")
      .update({
        exam_status: "submitted",
        exam_results_json: exam_results || webhookPayload,
        exam_submission_url: submission_url,
        current_step: "approval",
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user_id)
      .eq("level", level)
      .select()
      .single();

    if (updateError) {
      logStep("ERROR updating workflow", { error: updateError });
      throw new Error(`Failed to update workflow: ${updateError.message}`);
    }

    logStep("Workflow updated successfully", { workflowId: workflow?.id });

    // Optional: Send notification to admin (implement as needed)
    // await notifyAdminExamSubmission(user_id, level);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Exam submission processed successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in handle-exam-submission", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});