export default function DashboardFooter() {
  return (
    <footer className="mt-auto flex h-10 shrink-0 items-center justify-between border-t-2 border-burnished-gold/20 bg-surface-container-lowest px-6 md:px-12">
      <span className="font-label-sm text-[9px] tracking-[0.3em] text-burnished-gold/30 uppercase">
        Guilde des Archivistes de Sim • Millénaire 4.2
      </span>
      <div className="flex gap-4 font-label-sm text-[9px] tracking-widest text-burnished-gold/30 uppercase">
        <span>Status: Synchronisé</span>
        <span className="text-primary/40">•</span>
        <span>Signal: Fort</span>
      </div>
    </footer>
  );
}
