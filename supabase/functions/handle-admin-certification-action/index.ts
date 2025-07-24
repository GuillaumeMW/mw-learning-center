import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[HANDLE-ADMIN-CERTIFICATION-ACTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const adminUserId = userData.user?.id;
    if (!adminUserId) throw new Error("User not authenticated");

    logStep("Admin authenticated", { adminUserId });

    // Verify admin role using service role client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: adminRole, error: roleError } = await supabaseService
      .rpc("has_role", { _user_id: adminUserId, _role: "admin" });

    if (roleError || !adminRole) {
      logStep("ERROR: User lacks admin privileges", { roleError });
      throw new Error("Access denied: Admin privileges required");
    }

    logStep("Admin role verified");

    const { user_id, level, action } = await req.json();

    if (!user_id || !level || !action) {
      throw new Error("Missing required fields: user_id, level, action");
    }

    if (!["approve", "reject"].includes(action)) {
      throw new Error("Invalid action. Must be 'approve' or 'reject'");
    }

    logStep("Processing admin action", { user_id, level, action });

    let updateData: any = {
      admin_approval_status: action === "approve" ? "approved" : "rejected",
      updated_at: new Date().toISOString()
    };

    if (action === "approve") {
      updateData.current_step = "contract";
    } else {
      updateData.current_step = "exam";
      updateData.exam_status = "pending_submission";
    }

    const { data: workflow, error: updateError } = await supabaseService
      .from("certification_workflows")
      .update(updateData)
      .eq("user_id", user_id)
      .eq("level", level)
      .select()
      .single();

    if (updateError) {
      logStep("ERROR updating workflow", { error: updateError });
      throw new Error(`Failed to update workflow: ${updateError.message}`);
    }

    logStep("Workflow updated successfully", { workflowId: workflow?.id });

    // Optional: Send email notification to student
    // await notifyStudentCertificationStatus(user_id, level, action);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Certification ${action}d successfully`,
      workflow 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in handle-admin-certification-action", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});