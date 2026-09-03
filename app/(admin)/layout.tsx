import { redirect } from "next/navigation";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }
  if (!isAdminRole(session.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen min-h-0 overflow-hidden">
      <AdminSidebar />
      <div className="custom-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
