export type DashboardNavItem = {
  href: string;
  label: string;
  variant?: "default" | "alert";
  match?: "exact" | "prefix";
};

export const dashboardNav: DashboardNavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", match: "exact" },
  { href: "/catalog", label: "Catalogue", match: "prefix" },
  { href: "/stocks", label: "Stocks", match: "prefix" },
  { href: "/orders", label: "Commandes", match: "prefix" },
  { href: "/alerts", label: "Alertes", variant: "alert", match: "prefix" },
  { href: "/simulation", label: "Simulation", match: "prefix" },
];

export function isNavActive(
  pathname: string,
  href: string,
  match: DashboardNavItem["match"] = "prefix",
): boolean {
  if (match === "exact") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
