import { redirect } from "next/navigation";

/** Book creation is admin-only (/admin/books/new). */
export default function LegacyNewBookPage() {
  redirect("/catalog");
}
