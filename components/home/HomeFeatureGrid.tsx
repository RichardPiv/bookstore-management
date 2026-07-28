import { BookOpen, Package, Sparkles, Timer, Truck } from "lucide-react";

import HomeFeatureCard from "@/components/home/HomeFeatureCard";

const features = [
  {
    icon: Package,
    sectionId: "SEC-01",
    title: "Gestion des Codex",
    description:
      "Indexation sémantique et stockage cryptographique de vos manuscrits les plus rares. Suivi en temps réel de l'usure du parchemin et de l'énergie résiduelle.",
    footer: (
      <>
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        9,432 Codex Actifs
      </>
    ),
  },
  {
    icon: Sparkles,
    sectionId: "SEC-02",
    title: "Moteur de Simulation",
    description:
      "Projecteur temporel intégré pour visualiser l'évolution des rituels. Anticipez les paradoxes avant qu'ils ne consument votre archive physique.",
    footer: (
      <>
        <Timer className="size-3" aria-hidden />
        Fidélité 99.8%
      </>
    ),
  },
  {
    icon: BookOpen,
    sectionId: "SEC-03",
    title: "Logistique Interne",
    description:
      "Réapprovisionnement automatisé d'encres spectrales et de parchemins vierges. Gestion des flux d'éther pour maintenir l'illumination perpétuelle.",
    footer: (
      <>
        <Truck className="size-3" aria-hidden />
        Livraison Intra-Secteur
      </>
    ),
  },
] as const;

export default function HomeFeatureGrid() {
  return (
    <section
      id="features"
      className="relative z-10 container mx-auto grid grid-cols-1 gap-8 px-6 pb-32 md:grid-cols-3"
    >
      {features.map((feature) => (
        <HomeFeatureCard key={feature.sectionId} {...feature} />
      ))}
    </section>
  );
}
