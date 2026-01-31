import ComplaintStatusBadge from "./ComplaintStatusBadge";
import UpvoteButton from "./UpvoteButton";

interface Props {
  complaint: {
    id: string;
    description: string;
    status: "open" | "in_progress" | "resolved" | "rejected";
    severity: number;
    upvotes: number;
    raised_at: string;
  };
}

export default function ComplaintCard({ complaint }: Props) {
  return (
    <div className="border rounded-lg p-4 space-y-2 bg-white shadow-sm">
      <div className="flex justify-between items-center">
        <ComplaintStatusBadge status={complaint.status} />
        <span className="text-xs text-gray-400">
          {new Date(complaint.raised_at).toLocaleDateString()}
        </span>
      </div>

      <p className="text-sm text-gray-800 line-clamp-2">
        {complaint.description}
      </p>

      <div className="flex justify-between items-center pt-2">
        <span className="text-xs text-gray-500">
          Severity: {complaint.severity}
        </span>

        <UpvoteButton
          complaintId={complaint.id}
          initialCount={complaint.upvotes}
        />
      </div>
    </div>
  );
}
