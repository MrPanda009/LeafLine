"use client";

import { useState } from "react";

interface Props {
  complaintId: string;
  initialCount: number;
}

export default function UpvoteButton({
  complaintId,
  initialCount,
}: Props) {
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function upvote() {
    setLoading(true);

    const res = await fetch("/api/upvotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintId }),
    });

    if (res.ok) setCount((c) => c + 1);

    setLoading(false);
  }

  return (
    <button
      onClick={upvote}
      disabled={loading}
      className="flex items-center gap-1 text-sm text-gray-600 hover:text-black"
    >
      👍 {count}
    </button>
  );
}

