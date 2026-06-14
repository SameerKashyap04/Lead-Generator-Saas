import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { token, userId } = await req.json();

    if (!token || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Find invite
    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
    }

    // Check expiration
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
    }

    // 2. Add user to workspace (but only if they are not already in another workspace or if we allow multiple)
    // For this SaaS, typically a user can only be in one workspace at a time (or many, but let's check if they exist in this one)
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', invite.workspace_id)
      .eq('user_id', userId)
      .single();

    if (!existingMember) {
      // 3. Remove them from their personal workspace or just add them to the new one.
      // In this system, if they just signed up, they get a personal workspace.
      // Usually, accepting an invite means you switch workspaces.
      // We will just add them to the workspace members table.
      
      const { error: insertError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: invite.workspace_id,
          user_id: userId,
          role: invite.role
        });

      if (insertError) {
        return NextResponse.json({ error: "Failed to add member to workspace" }, { status: 500 });
      }
    }

    // 4. Delete the invite
    await supabase.from('workspace_invites').delete().eq('id', invite.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
