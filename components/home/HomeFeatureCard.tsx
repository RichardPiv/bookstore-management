import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type HomeFeatureCardProps = {
  icon: LucideIcon;
  sectionId: string;
  title: string;
  description: string;
  footer: ReactNode;
};

export default function HomeFeatureCard({
  icon: Icon,
  sectionId,
  title,
  description,
  footer,
}: HomeFeatureCardProps) {
  return (
    <article className="home-l-corner-container bg-surface-container-lowest/50 backdrop-blur-sm transition-colors duration-500 hover:bg-surface-container/60">
      <div className="home-corner-bottom-left" />
      <div className="home-corner-bottom-right" />
      <div className="mb-6 flex items-start justify-between">
        <Icon className="size-8 text-primary" aria-hidden />
        <span className="font-label text-[10px] text-outline">{sectionId}</span>
      </div>
      <h3 className="mb-4 font-headline text-2xl font-medium tracking-tight text-primary">
        {title}
      </h3>
      <div className="home-ciselee-line mb-4" />
      <p className="mb-4 font-body text-sm leading-relaxed text-on-surface-variant">
        {description}
      </p>
      <div className="flex items-center gap-2 font-label text-[10px] tracking-tighter text-burnished-gold uppercase">
        {footer}
      </div>
    </article>
  );
}
