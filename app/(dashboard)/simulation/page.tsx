import SimulationLiveView from "@/components/simulation/SimulationLiveView";

export default function SimulationPage() {
  return (
    <div className="flex h-[calc(100vh-6.5rem)] min-h-0 flex-col overflow-hidden">
      <SimulationLiveView />
    </div>
  );
}
