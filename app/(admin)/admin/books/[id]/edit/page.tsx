import Link from "next/link";

import BookForm from "@/components/Book/BookForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditBookPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="p-12">
      <div className="mx-auto max-w-8xl">
        <header className="mb-10">
          <Link
            href="/admin/books"
            className="group mb-6 inline-flex items-center gap-2 font-label text-[10px] tracking-widest text-burnished-gold/70 uppercase transition-colors hover:text-primary"
          >
            ← Retour au catalogue
          </Link>
          <h1 className="font-headline text-4xl font-normal tracking-wide text-primary uppercase">
            Modifier le Codex
          </h1>
        </header>
        <BookForm id={id} booksBasePath="/admin/books" />
      </div>
    </div>
  );
}
