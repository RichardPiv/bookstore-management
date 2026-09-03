import AdminNamedCrud from "@/components/admin/AdminNamedCrud";

export default function AdminSuppliersPage() {
  return (
    <AdminNamedCrud
      title="Fournisseurs"
      description="Référentiel des fournisseurs."
      apiPath="/api/suppliers"
    />
  );
}
