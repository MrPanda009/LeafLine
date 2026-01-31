"use client";

import { useState } from "react";

export default function ComplaintForm() {
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState(3);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!description.trim()) {
      alert("Description required");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        severity,
        location: "POINT(77.2167 28.6667)",
        category_id: "default",
        media_urls: [],
      }),
    });

    setLoading(false);

    if (res.ok) {
      setDescription("");
      alert("Complaint submitted");
    } else {
      alert("Failed to submit");
    }
  }

  return (
    <div className="space-y-4">
      <textarea
        className="w-full border rounded-md p-3 text-sm"
        rows={5}
        placeholder="Describe the issue clearly..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div>
        <label className="text-sm font-medium">Severity</label>
        <select
          className="ml-2 border rounded px-2 py-1 text-sm"
          value={severity}
          onChange={(e) => setSeverity(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
      >
        {loading ? "Submitting..." : "Submit Complaint"}
      </button>
    </div>
  );
}
