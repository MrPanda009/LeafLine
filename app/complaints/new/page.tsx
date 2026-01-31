import ComplaintForm from "@/components/complaints/ComplaintForm";

export default function NewComplaintPage() {
  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Raise a Complaint</h1>
      <ComplaintForm />
    </div>
  );
}
