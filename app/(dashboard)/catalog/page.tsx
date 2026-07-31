import CatalogCartModal from "@/components/catalog/CatalogCartModal";
import CatalogInventory from "@/components/catalog/CatalogInventory";
import CatalogueCartButton from "@/components/catalog/CatalogCartButton";

export default function CatalogPage() {
  return (
    <div className="custom-scroll flex-1 overflow-y-auto p-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex items-center justify-between">
          <header className="mb-12">
            <h2 className="mb-3 font-headline text-4xl font-normal tracking-wide text-primary uppercase">
              Catalogue de Grimoires
            </h2>
            <p className="font-headline text-sm text-on-surface-variant italic">
              &ldquo;Chaque tome est une porte vers l&apos;inconnu, gardez-en la
              clé précieusement.&rdquo;
            </p>
          </header>
          <CatalogueCartButton />
        </div>

        <CatalogInventory />
        <CatalogCartModal />
      </div>
    </div>
  );
}
