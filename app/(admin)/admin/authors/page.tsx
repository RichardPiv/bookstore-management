import AdminNamedCrud from "@/components/admin/AdminNamedCrud";

export default function AdminAuthorsPage() {
  return (
    <AdminNamedCrud
      title="Auteurs"
      description="Référentiel des auteurs."
      apiPath="/api/authors"
    />
  );
}
