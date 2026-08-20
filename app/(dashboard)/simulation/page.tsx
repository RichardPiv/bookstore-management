import SimulationPanel from "@/components/simulation/SimulationPanel";

export default function SimulationPage() {
  return (
    <div className="flex-1 space-y-12 overflow-y-auto p-12">
      <div className="mx-auto max-w-7xl">
        <SimulationPanel />
      </div>
    </div>
  );
}
