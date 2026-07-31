import CartProvider from "@/components/catalog/CartProvider";

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CartProvider>{children}</CartProvider>;
}
