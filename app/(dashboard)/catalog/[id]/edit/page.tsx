import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Book edition is admin-only (/admin/books/:id/edit). */
export default async function LegacyEditBookPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/catalog/${id}`);
}
