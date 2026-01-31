import { createSupabaseServer } from "@/lib/supabase/server";
import ComplaintStatusBadge from "@/components/complaints/ComplaintStatusBadge";
import UpvoteButton from "@/components/complaints/UpvoteButton";

export default async function ComplaintDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createSupabaseServer();

  const { data: complaint, error } = await supabase
    .from("complaints")
    .select(`
      id,
      description,
      status,
      severity,
      raised_at,
      media_urls,
      location,
      upvotes:upvotes(count)
    `)
    .eq("id", params.id)
    .single();

  if (error || !complaint) {
    return <p className="text-red-500">Complaint not found</p>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <ComplaintStatusBadge status={complaint.status} />
          <span className="text-sm text-gray-500">
            {new Date(complaint.raised_at).toLocaleString()}
          </span>
        </div>

        <p className="text-gray-700 text-lg leading-relaxed mb-4">
          {complaint.description}
        </p>

        {complaint.location && (
          <p className="text-sm text-gray-600 mb-4">
            <strong>Location:</strong> {complaint.location}
          </p>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm text-gray-600 font-medium">
            Severity: <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded">{complaint.severity}</span>
          </span>

          <UpvoteButton
            complaintId={complaint.id}
            initialCount={complaint.upvotes?.[0]?.count ?? 0}
          />
        </div>
      </div>

      {complaint.media_urls?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">Evidence</h3>
          <div className="grid grid-cols-2 gap-4">
            {complaint.media_urls.map((url: string) => (
              <img
                key={url}
                src={url}
                alt="Evidence"
                className="rounded border border-gray-200 w-full h-48 object-cover"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
