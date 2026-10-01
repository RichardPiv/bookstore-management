"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useSimulationRuntimeOptional } from "@/components/simulation-runtime/SimulationRuntimeProvider";

type Task = {
  id: number;
  type: string;
  status: string;
  book_id: number | null;
  order_id: number | null;
  priority: number;
};

const TYPE_LABEL: Record<string, string> = {
  RESTOCK_SHELF: "Remise en rayon",
  RECEIVE_DELIVERY: "Réception de convoi",
  ADVISE_CUSTOMER: "Conseil",
};

export default function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const runtime = useSimulationRuntimeOptional();

  const load = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const body = await res.json();
    if (res.ok) {
      setTasks((body.data ?? []).filter((task: Task) => task.status === "pending" || task.status === "in_progress"));
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(id);
  }, [load]);

  async function run(id: number) {
    await fetch(`/api/tasks/${id}/execute`, { method: "POST" });
    await load();
    await runtime?.refreshWorld();
  }

  async function cancel(id: number) {
    await fetch(`/api/tasks/${id}/cancel`, { method: "POST" });
    await load();
    await runtime?.refreshWorld();
  }

  if (tasks.length === 0) {
    return (
      <p className="font-body text-sm text-on-surface-variant">
        Aucune tâche en attente. Les ruptures et convois apparaîtront ici.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex flex-wrap items-center justify-between gap-2 border border-outline-variant/40 px-3 py-2"
        >
          <div>
            <p className="font-label text-[10px] tracking-widest text-primary uppercase">
              {TYPE_LABEL[task.type] ?? task.type}
            </p>
            <p className="font-body text-xs text-on-surface-variant">
              {task.status}
              {task.book_id ? ` · livre #${task.book_id}` : ""}
              {task.order_id ? ` · commande #${task.order_id}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="xs" onClick={() => void run(task.id)}>
              Exécuter
            </Button>
            <Button type="button" size="xs" variant="outline" onClick={() => void cancel(task.id)}>
              Ignorer
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
