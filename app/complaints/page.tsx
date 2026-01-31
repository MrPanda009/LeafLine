import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import ComplaintCard from "@/components/complaints/ComplaintCard";

export default async function ComplaintsPage() {
  const supabase = await createSupabaseServer();

  const { data: complaints, error } = await supabase
    .from("complaints")
    .select(`
      id,
      description,
      status,
      severity,
      raised_at,
      upvotes:upvotes(count)
    `)
    .order("raised_at", { ascending: false });

  if (error) {
    return <p className="text-red-500">Failed to load complaints</p>;
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Public Complaints</h1>
        <Link
          href="/complaints/new"
          className="bg-green-600 text-white px-4 py-2 rounded text-sm"
        >
          + Raise Complaint
        </Link>
      </div>

      <div className="space-y-4">
        {complaints?.map((c: any) => (
          <Link key={c.id} href={`/complaints/${c.id}`}>
            <ComplaintCard
              complaint={{
                id: c.id,
                description: c.description,
                status: c.status,
                severity: c.severity,
                raised_at: c.raised_at,
                upvotes: c.upvotes?.[0]?.count ?? 0,
              }}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
