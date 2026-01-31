import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * GET /api/complaints/[id]
 * Fetch a specific complaint by ID
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServer();
  const { id } = params;

  const { data, error } = await supabase
    .from("complaints")
    .select(`
      *,
      upvotes:upvotes(count)
    `)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Complaint not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

/**
 * PUT /api/complaints/[id]
 * Update a complaint
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServer();
  const { id } = params;
  const body = await req.json();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check if user is the reporter or admin
  const { data: complaint } = await supabase
    .from("complaints")
    .select("reporter_id")
    .eq("id", id)
    .single();

  if (!complaint || complaint.reporter_id !== user.id) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("complaints")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/complaints/[id]
 * Delete a complaint
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServer();
  const { id } = params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check if user is the reporter
  const { data: complaint } = await supabase
    .from("complaints")
    .select("reporter_id")
    .eq("id", id)
    .single();

  if (!complaint || complaint.reporter_id !== user.id) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("complaints")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
