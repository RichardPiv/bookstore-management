import AdminNamedCrud from "@/components/admin/AdminNamedCrud";

export default function AdminFormatsPage() {
  return (
    <AdminNamedCrud
      title="Formats"
      description="Formats d’ouvrages."
      apiPath="/api/formats"
      withCode
    />
  );
}
