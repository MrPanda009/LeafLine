interface Props {
  status: "open" | "in_progress" | "resolved" | "rejected";
}

const STATUS_STYLES: Record<Props["status"], string> = {
  open: "bg-red-100 text-red-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  rejected: "bg-gray-200 text-gray-700",
};

export default function ComplaintStatusBadge({ status }: Props) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
}
