"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { formatSimClock, TICK_MS, type HudState } from "@/simulation/types";
import type {
  EngineSnapshot,
  WorldBook,
  WorldEmployee,
  WorldInbound,
  WorldTask,
} from "@/simulation/types";
import { useTreasuryBalanceOptional } from "@/components/treasury/TreasuryBalanceProvider";

import {
  drainPending,
  enqueueCommits,
  getOrCreateEngine,
  hasPendingWork,
} from "./runtime-store";

type WorldResponse = {
  clock: {
    sim_day: number;
    sim_minutes: number;
    speed: number;
    status: "running" | "paused";
    snapshot_json: string | null;
  };
  employees: WorldEmployee[];
  tasks: WorldTask[];
  books: WorldBook[];
  inbound?: WorldInbound[];
  unpaid_wages?: boolean;
};

type SimulationRuntimeValue = {
  hud: HudState;
  isLeader: boolean;
  ready: boolean;
  setPaused: (paused: boolean) => void;
  setSpeed: (speed: number) => void;
  refreshWorld: () => Promise<void>;
};

const SimulationRuntimeContext = createContext<SimulationRuntimeValue | null>(
  null,
);

const CHANNEL = "reserve-sim-runtime";
const emptyHud: HudState = {
  sim_day: 1,
  sim_minutes: 540,
  speed: 1,
  paused: true,
  visitor_count: 0,
  queue_length: 0,
  staff_busy: 0,
  last_event: null,
  alerts: [],
  advise_pending: 0,
  unpaid_wages: false,
  day_event: null,
};

export function SimulationRuntimeProvider({ children }: { children: ReactNode }) {
  const [hud, setHud] = useState<HudState>(emptyHud);
  const [ready, setReady] = useState(false);
  const [isLeader, setIsLeader] = useState(true);
  const leaderRef = useRef(true);
  const tabId = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `tab-${Math.random()}`,
  );
  const treasury = useTreasuryBalanceOptional();
  const lastFlush = useRef(0);
  const lastHud = useRef(0);
  const hiddenAt = useRef<number | null>(null);
  const wasRunningWhenHidden = useRef(false);

  const pushHud = useCallback((next: HudState) => {
    setHud(next);
  }, []);

  const refreshWorld = useCallback(async () => {
    const response = await fetch("/api/simulation/world");
    const body = await response.json();
    if (!response.ok || !body.data) return;
    const world = body.data as WorldResponse;
    const engine = getOrCreateEngine();
    if (world.clock.snapshot_json) {
      try {
        engine.loadSnapshot(JSON.parse(world.clock.snapshot_json) as EngineSnapshot);
      } catch {
        /* ignore corrupt snapshot */
      }
    }
    engine.hydrateWorld({
      books: world.books,
      tasks: world.tasks,
      employees: world.employees,
      inbound: world.inbound ?? [],
      unpaid_wages: world.unpaid_wages ?? false,
    });
    engine.syncStaffFromWorld(world.employees);
    engine.applyInbound(world.inbound ?? []);
    engine.setUnpaidWages(world.unpaid_wages ?? false);
    engine.simDay = world.clock.sim_day;
    engine.simMinutes = world.clock.sim_minutes;
    engine.speed = world.clock.speed || 1;
    engine.paused = world.clock.status !== "running";
    pushHud(engine.getHud());
    setReady(true);
  }, [pushHud]);

  const flush = useCallback(async (forceSnapshot = false) => {
    if (!leaderRef.current) return;
    const engine = getOrCreateEngine();
    const pending = drainPending();
    if (!forceSnapshot && pending.commits.length === 0 && !pending.closed_day) {
      return;
    }
    const payload = {
      commits: pending.commits,
      closed_day: pending.closed_day,
      clock: {
        sim_day: engine.simDay,
        sim_minutes: Math.floor(engine.simMinutes),
        speed: engine.speed,
        paused: engine.paused,
      },
      snapshot: engine.getSnapshot(),
    };
    try {
      const response = await fetch("/api/simulation/commits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const commitBody = await response.json().catch(() => null);
        if (commitBody?.data?.unpaid_wages === true) {
          engine.setUnpaidWages(true);
        } else if (pending.closed_day && commitBody?.data?.unpaid_wages === false) {
          engine.setUnpaidWages(false);
        }
        await treasury?.refreshTreasury();
        const worldRes = await fetch("/api/simulation/world");
        const worldBody = await worldRes.json();
        if (worldRes.ok && worldBody.data) {
          const world = worldBody.data as WorldResponse;
          engine.applyCatalog(world.books);
          engine.applyTasks(world.tasks);
          engine.syncStaffFromWorld(world.employees);
          engine.applyInbound(world.inbound ?? []);
          engine.setUnpaidWages(world.unpaid_wages ?? engine.unpaidWages);
          pushHud(engine.getHud());
        }
      }
    } catch {
      /* keep local state */
    }
  }, [pushHud, treasury]);

  const persistSnapshot = useCallback(async () => {
    if (!leaderRef.current) return;
    const engine = getOrCreateEngine();
    await fetch("/api/simulation/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        clock: {
          sim_day: engine.simDay,
          sim_minutes: Math.floor(engine.simMinutes),
          speed: engine.speed,
          paused: engine.paused,
        },
        snapshot: engine.getSnapshot(),
      }),
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL);
    } catch {
      channel = null;
    }
    let heartbeat = 0;
    const becomeLeader = () => {
      leaderRef.current = true;
      setIsLeader(true);
    };
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; tab?: string; hud?: HudState };
      if (data.type === "heartbeat" && data.tab !== tabId.current) {
        leaderRef.current = false;
        setIsLeader(false);
        heartbeat = Date.now();
        if (data.hud) pushHud(data.hud);
      }
    };
    channel?.addEventListener("message", onMessage);

    void refreshWorld();

    const tick = window.setInterval(() => {
      const engine = getOrCreateEngine();
      if (document.visibilityState === "hidden") {
        return;
      }
      if (leaderRef.current) {
        const result = engine.tick(TICK_MS);
        if (result.commits.length > 0 || result.closed_day) {
          enqueueCommits(result.commits, result.closed_day);
          for (const commit of result.commits) {
            if (commit.type === "sale" && commit.book_id) {
              engine.noteSaleApplied(commit.book_id);
            }
            if (commit.type === "restock" && commit.book_id && commit.qty) {
              engine.noteRestockApplied(commit.book_id, commit.qty);
            }
          }
        }
        const now = Date.now();
        if (now - lastHud.current > 400) {
          lastHud.current = now;
          const nextHud = engine.getHud();
          pushHud(nextHud);
          channel?.postMessage({
            type: "heartbeat",
            tab: tabId.current,
            hud: nextHud,
          });
        }
        if (now - lastFlush.current > 2500 || hasPendingWork()) {
          if (now - lastFlush.current > 1200) {
            lastFlush.current = now;
            void flush();
          }
        }
      } else if (Date.now() - heartbeat > 2500) {
        becomeLeader();
      }
    }, TICK_MS);

    const onHide = () => {
      if (document.visibilityState === "hidden") {
        const engine = getOrCreateEngine();
        wasRunningWhenHidden.current = !engine.paused;
        hiddenAt.current = Date.now();
        void flush(true);
        return;
      }

      // Visible de nouveau : rattrapage plafonné si l’horloge tournait (P0.5 / L5)
      if (
        document.visibilityState === "visible" &&
        hiddenAt.current != null &&
        wasRunningWhenHidden.current &&
        leaderRef.current
      ) {
        const engine = getOrCreateEngine();
        if (!engine.paused) {
          const elapsedMs = Date.now() - hiddenAt.current;
          const simMinutes = (elapsedMs / 1000) * engine.speed;
          if (simMinutes >= 0.5) {
            const result = engine.catchUp(simMinutes);
            if (result.commits.length > 0 || result.closed_day) {
              enqueueCommits(result.commits, result.closed_day);
              for (const commit of result.commits) {
                if (commit.type === "sale" && commit.book_id) {
                  engine.noteSaleApplied(commit.book_id);
                }
                if (commit.type === "restock" && commit.book_id && commit.qty) {
                  engine.noteRestockApplied(commit.book_id, commit.qty);
                }
              }
            }
            pushHud(engine.getHud());
            void flush(true);
          }
        }
      }
      hiddenAt.current = null;
      wasRunningWhenHidden.current = false;
    };
    const onUnload = () => {
      const engine = getOrCreateEngine();
      engine.setPaused(true);
      void persistSnapshot();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onUnload);

    return () => {
      window.clearInterval(tick);
      channel?.removeEventListener("message", onMessage);
      channel?.close();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onUnload);
      void persistSnapshot();
    };
  }, [flush, persistSnapshot, pushHud, refreshWorld]);

  const setPaused = useCallback(
    (paused: boolean) => {
      const engine = getOrCreateEngine();
      engine.setPaused(paused);
      pushHud(engine.getHud());
      void fetch("/api/simulation/clock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: paused ? "paused" : "running" }),
      });
    },
    [pushHud],
  );

  const setSpeed = useCallback(
    (speed: number) => {
      const engine = getOrCreateEngine();
      engine.setSpeed(speed);
      pushHud(engine.getHud());
      void fetch("/api/simulation/clock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speed: engine.speed }),
      });
    },
    [pushHud],
  );

  const value = useMemo(
    () => ({ hud, isLeader, ready, setPaused, setSpeed, refreshWorld }),
    [hud, isLeader, ready, setPaused, setSpeed, refreshWorld],
  );

  return (
    <SimulationRuntimeContext.Provider value={value}>
      {children}
    </SimulationRuntimeContext.Provider>
  );
}

export function useSimulationRuntime() {
  const ctx = useContext(SimulationRuntimeContext);
  if (!ctx) {
    throw new Error("useSimulationRuntime must be used within provider");
  }
  return ctx;
}

export function useSimulationRuntimeOptional() {
  return useContext(SimulationRuntimeContext);
}

export function formatHudClock(hud: HudState) {
  return formatSimClock(hud.sim_day, hud.sim_minutes);
}
