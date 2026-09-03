import AdminNamedCrud from "@/components/admin/AdminNamedCrud";

export default function AdminCategoriesPage() {
  return (
    <AdminNamedCrud
      title="Catégories"
      description="Taxonomie commerciale."
      apiPath="/api/categories"
      withCode
    />
  );
}
