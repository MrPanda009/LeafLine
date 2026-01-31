import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * POST /api/complaints
 * Create a new complaint
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const body = await req.json();

  const {
    description,
    location,
    media_urls,
    severity,
    category_id,
  } = body;

  if (!description || !category_id) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

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

  const { data, error } = await supabase.from("complaints").insert({
    reporter_id: user.id,
    description,
    location,
    media_urls,
    severity,
    category_id,
    status: "open",
  }).select();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data[0], { status: 201 });
}

/**
 * GET /api/complaints
 * List all complaints (public feed)
 */
export async function GET() {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("complaints")
    .select(`
      id,
      description,
      status,
      severity,
      raised_at,
      category_id,
      upvotes:upvotes(count)
    `)
    .order("raised_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

