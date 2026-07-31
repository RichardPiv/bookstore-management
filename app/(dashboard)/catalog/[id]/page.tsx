import BookCard from "@/components/Book/BookCard";

type BookPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params;

  return (
    <div className="custom-scroll relative flex-1 overflow-y-auto p-8 md:p-12">
      <div
        className="parchment-texture pointer-events-none absolute inset-0 opacity-5"
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-7xl">
        <BookCard id={id} />
      </div>
    </div>
  );
}
