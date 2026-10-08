import { parseDna } from "@/scripts/characters/dna";

import {
  bookUtility,
  createVisitorAgent,
  pickBookForVisitor,
  pickClientInterest,
  preferredCashierId,
  reliabilityOk,
  shelfForBook,
  specialtyMatchesShelf,
  specialtyMatchesVisitor,
  toStaffAgent,
  workPace,
  moraleFatigueFactor,
} from "./agents";
import { runCatchUp } from "./clock";
import {
  dayEventHudLabel,
  pickDayEvent,
  type DayEvent,
} from "./data/day-events";
import {
  facingFromDelta,
  facingTowardNearest,
  staffPostFacing,
} from "./facing";
import { buildHudAlerts } from "./hud";
import { homeForStaff, loc, locClient, locStaff } from "./locations";
import {
  isClientWalkable,
  isWalkable,
  queueStand,
} from "./map";
import {
  clampClientWalkable,
  findClientPath,
  findPath,
} from "./pathfinding";
import { mulberry32 } from "./rng";
import {
  restoreStaffFromSnapshot,
  restoreVisitorsFromSnapshot,
} from "./snapshot";
import {
  adviseSuccessChance,
  adviseWorkMinutes,
  createAdviseRuntimeTask,
  logisticsWorkMinutes,
  pickLogisticsTask,
} from "./tasks";
import {
  CELLS_PER_SIM_MINUTE,
  CLOSE_MINUTES,
  applyXpGains,
  MAX_AGENTS,
  MAX_VISITORS,
  OPEN_MINUTES,
  parseStats,
  spawnRate,
  type EngineSnapshot,
  type HudState,
  type RenderAgent,
  type StaffAgent,
  type StaffXpKind,
  type TickCommit,
  type TickResult,
  type VisitorAgent,
  type WorldBook,
  type WorldEmployee,
  type WorldInbound,
  type WorldTask,
} from "./types";

export type EngineWorld = {
  books: WorldBook[];
  tasks: WorldTask[];
  employees: WorldEmployee[];
  inbound?: WorldInbound[];
  unpaid_wages?: boolean;
};

export class SimulationEngine {
  simDay = 1;
  simMinutes = OPEN_MINUTES;
  speed = 1;
  paused = true;
  visitors: VisitorAgent[] = [];
  staff: StaffAgent[] = [];
  queue: string[] = [];
  lastEvent: string | null = null;
  unpaidWages = false;
  catchUpBanner: string | null = null;
  dayEvent: DayEvent = pickDayEvent(1);
  private books: WorldBook[] = [];
  private tasks: WorldTask[] = [];
  private inbound: WorldInbound[] = [];
  private notifiedArrivals = new Set<number>();
  /** taskId (souvent négatif) → visitorId pour ADVISE_CUSTOMER runtime. */
  private adviseByTask = new Map<number, string>();
  private rngFn = mulberry32(1);
  private rngState = 1;
  private visitorSeq = 0;
  private runtimeTaskSeq = 0;
  private cellCarry = 0;
  private dayEventAnnouncedFor = 0;

  hydrateWorld(world: EngineWorld) {
    this.books = world.books.map((book) => ({ ...book }));
    this.tasks = world.tasks
      .filter((task) => task.status === "pending" || task.status === "in_progress")
      .map((task) => ({ ...task }));
    this.inbound = (world.inbound ?? []).map((row) => ({ ...row }));
    if (typeof world.unpaid_wages === "boolean") {
      this.unpaidWages = world.unpaid_wages;
    }
    this.ensureDayEvent(false);
    if (this.staff.length === 0) {
      this.staff = world.employees
        .filter((row) => row.status !== "dismissed")
        .map((row) => toStaffAgent(row));
    }
  }

  applyInbound(inbound: WorldInbound[]) {
    this.inbound = inbound.map((row) => ({ ...row }));
    for (const row of inbound) {
      if (row.arrived || row.has_receive_task) {
        this.notifiedArrivals.add(row.order_id);
      }
    }
  }

  setUnpaidWages(flag: boolean) {
    this.unpaidWages = flag;
  }

  applyCatalog(books: WorldBook[]) {
    this.books = books.map((book) => ({ ...book }));
  }

  applyTasks(tasks: WorldTask[]) {
    const activeIds = new Set(this.tasks.map((task) => task.id));
    for (const task of tasks) {
      if (task.status === "done" || task.status === "cancelled") {
        this.tasks = this.tasks.filter((row) => row.id !== task.id);
        continue;
      }
      const existing = this.tasks.find((row) => row.id === task.id);
      if (existing) {
        Object.assign(existing, task);
      } else if (!activeIds.has(task.id)) {
        this.tasks.push({ ...task });
      }
    }
  }

  syncStaffFromWorld(employees: WorldEmployee[]) {
    const active = employees.filter((row) => row.status !== "dismissed");
    const byId = new Map(this.staff.map((agent) => [agent.id, agent]));
    this.staff = active.map((row) => {
      const existing = byId.get(row.id);
      if (existing) {
        const fatigue = existing.stats.fatigue;
        existing.name = row.name;
        existing.role = row.role;
        existing.stats = parseStats(row.stats_json);
        existing.stats.fatigue = fatigue;
        existing.dna = parseDna(row.appearance_json);
        existing.home = homeForStaff(row.role, existing.stats.counter_focus);
        return existing;
      }
      return toStaffAgent(row);
    });
  }

  loadSnapshot(snapshot: EngineSnapshot | null | undefined) {
    if (!snapshot || snapshot.version !== 1) return;
    this.simDay = snapshot.sim_day;
    this.simMinutes = snapshot.sim_minutes;
    this.speed = snapshot.speed;
    this.paused = snapshot.paused;
    const restoredVisitors = restoreVisitorsFromSnapshot(snapshot);
    this.visitors = restoredVisitors.visitors;
    this.adviseByTask = restoredVisitors.adviseByTask;
    this.staff = restoreStaffFromSnapshot(snapshot);
    this.queue = snapshot.queue;
    this.setRng(snapshot.rng);
    this.ensureDayEvent(false);
  }

  getSnapshot(): EngineSnapshot {
    return {
      version: 1,
      sim_day: this.simDay,
      sim_minutes: this.simMinutes,
      speed: this.speed,
      paused: this.paused,
      visitors: this.visitors,
      staff: this.staff,
      queue: this.queue,
      rng: this.rngState,
    };
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  setSpeed(speed: number) {
    this.speed = speed === 2 || speed === 5 ? speed : 1;
  }

  getHud(): HudState {
    const alerts = buildHudAlerts({
      catchUpBanner: this.catchUpBanner,
      queueLength: this.queue.length,
      books: this.books,
      tasks: this.tasks,
      staff: this.staff,
      inbound: this.inbound,
      unpaidWages: this.unpaidWages,
      dayEvent: this.dayEvent,
    });
    const advisePending = this.tasks.filter(
      (task) =>
        task.type === "ADVISE_CUSTOMER" &&
        (task.status === "pending" || task.status === "in_progress"),
    ).length;
    return {
      sim_day: this.simDay,
      sim_minutes: this.simMinutes,
      speed: this.speed,
      paused: this.paused,
      visitor_count: this.visitors.length,
      queue_length: this.queue.length,
      staff_busy: this.staff.filter((agent) => agent.duty === "working").length,
      last_event: this.lastEvent,
      alerts,
      advise_pending: advisePending,
      unpaid_wages: this.unpaidWages,
      day_event: dayEventHudLabel(this.dayEvent),
    };
  }

  private ensureDayEvent(announce: boolean) {
    this.dayEvent = pickDayEvent(this.simDay);
    if (announce && this.dayEventAnnouncedFor !== this.simDay) {
      this.dayEventAnnouncedFor = this.simDay;
      this.lastEvent = `${this.dayEvent.title} — ${this.dayEvent.blurb}`;
    }
  }

  /**
   * Rattrapage métier après gel d’onglet (P0.5 / L5).
   * Plafonné ; skip visuel (pas de rendu intermédiaire).
   */
  catchUp(simMinutesWanted: number): TickResult {
    const savedSpeed = this.speed;
    this.speed = 1;
    const { result, banner } = runCatchUp(
      simMinutesWanted,
      this.paused,
      (dtMs) => this.tick(dtMs),
      () => this.clock(),
    );
    this.speed = savedSpeed;
    if (banner) {
      this.catchUpBanner = banner;
      this.lastEvent = banner;
    }
    return result;
  }

  clearCatchUpBanner() {
    this.catchUpBanner = null;
  }

  getRenderState(): RenderAgent[] {
    const positions: Array<{ id: string; x: number; y: number }> = [];
    for (const visitor of this.visitors) {
      positions.push({ id: visitor.id, x: visitor.x, y: visitor.y });
    }
    for (const agent of this.staff) {
      positions.push({ id: `staff-${agent.id}`, x: agent.x, y: agent.y });
    }

    const out: RenderAgent[] = [];
    for (const visitor of this.visitors) {
      const step = visitor.path[0];
      const walking = visitor.path.length > 0;
      const dx = step ? step.x - visitor.x : 0;
      const dy = step ? step.y - visitor.y : 0;
      const others = positions.filter((row) => row.id !== visitor.id);
      const facing = walking
        ? facingFromDelta(dx, dy)
        : facingTowardNearest(visitor.x, visitor.y, others);
      out.push({
        id: visitor.id,
        kind: "visitor",
        name: visitor.name,
        dna: visitor.dna,
        x: visitor.x,
        y: visitor.y,
        facing,
        walking,
        state: visitor.state,
      });
    }
    for (const agent of this.staff) {
      const step = agent.path[0];
      const walking = agent.path.length > 0;
      const dx = step ? step.x - agent.x : 0;
      const dy = step ? step.y - agent.y : 0;
      const id = `staff-${agent.id}`;
      const facing = walking
        ? facingFromDelta(dx, dy)
        : staffPostFacing(agent.role, agent.x);
      out.push({
        id,
        kind: "staff",
        name: agent.name,
        role: agent.role,
        employee_id: agent.id,
        dna: agent.dna,
        x: agent.x,
        y: agent.y,
        facing,
        walking,
        state: agent.duty,
      });
    }
    return out;
  }

  tick(dtMs: number): TickResult {
    const commits: TickCommit[] = [];
    let closedDay = false;
    if (this.paused || this.speed <= 0) {
      return { commits, closed_day: false, clock: this.clock() };
    }

    const dtMinutes = (dtMs / 1000) * this.speed;
    this.simMinutes += dtMinutes;
    if (this.simMinutes >= CLOSE_MINUTES) {
      closedDay = true;
      this.closeShop(commits);
      this.simDay += 1;
      this.simMinutes = OPEN_MINUTES;
      this.ensureDayEvent(true);
      commits.push({
        type: "event",
        event_type: "DAY_EVENT",
        message: `${this.dayEvent.title} — ${this.dayEvent.blurb}`,
      });
    } else {
      this.ensureDayEvent(false);
    }

    this.moveAgents(dtMinutes);
    this.spawnVisitors(dtMinutes, commits);
    this.updateVisitors(dtMinutes, commits);
    this.updateStaff(dtMinutes, commits);
    this.checkInboundArrivals(commits);

    return { commits, closed_day: closedDay, clock: this.clock() };
  }

  private checkInboundArrivals(commits: TickCommit[]) {
    const current =
      this.simDay * 24 * 60 + Math.floor(this.simMinutes);
    for (const row of this.inbound) {
      if (row.has_receive_task || this.notifiedArrivals.has(row.order_id)) {
        continue;
      }
      const eta = row.eta_sim_day * 24 * 60 + row.eta_sim_minutes;
      if (current < eta && !row.arrived) continue;
      this.notifiedArrivals.add(row.order_id);
      row.arrived = true;
      commits.push({
        type: "delivery_arrive",
        order_id: row.order_id,
        message: `Un convoi pour la commande #${row.order_id} arrive au quai.`,
      });
      this.lastEvent = `Convoi #${row.order_id} au quai — réceptionnaire requis.`;
    }
  }

  noteSaleApplied(bookId: number) {
    const book = this.books.find((row) => row.book_id === bookId);
    if (book && book.qty_shelf > 0) {
      book.qty_shelf -= 1;
    }
  }

  noteRestockApplied(bookId: number, qty: number) {
    const book = this.books.find((row) => row.book_id === bookId);
    if (!book) return;
    book.qty_shelf += qty;
    book.qty_reserve = Math.max(0, book.qty_reserve - qty);
  }

  private clock() {
    return {
      sim_day: this.simDay,
      sim_minutes: Math.floor(this.simMinutes),
      speed: this.speed,
      paused: this.paused,
    };
  }

  private setRng(seed: number) {
    this.rngState = seed >>> 0 || 1;
    this.rngFn = mulberry32(this.rngState);
  }

  private rng(): number {
    const value = this.rngFn();
    this.rngState = (Math.imul(this.rngState, 1664525) + 1013904223) >>> 0;
    return value;
  }

  private grantXp(agent: StaffAgent, kind: StaffXpKind, commits: TickCommit[]) {
    agent.stats = applyXpGains(agent.stats, kind);
    commits.push({
      type: "staff_xp",
      employee_id: agent.id,
      xp_kind: kind,
    });
  }

  private closeShop(commits: TickCommit[]) {
    for (const visitor of this.visitors) {
      this.cancelAdviseForVisitor(visitor);
      commits.push({
        type: "event",
        event_type: "CUSTOMER_LEAVE_EMPTY",
        visitor_id: visitor.id,
        message: `${visitor.name} quitte la Réserve à la fermeture.`,
      });
    }
    this.visitors = [];
    this.queue = [];
    this.tasks = this.tasks.filter((task) => task.type !== "ADVISE_CUSTOMER");
    this.adviseByTask.clear();
    for (const agent of this.staff) {
      agent.path = [];
      agent.duty = "idle";
      agent.task_id = null;
      agent.work_left = 0;
      agent.serving_visitor_id = null;
      agent.stats.fatigue = Math.max(8, agent.stats.fatigue * 0.35);
      const home = locStaff(agent.home);
      agent.x = home.x;
      agent.y = home.y;
    }
    this.lastEvent = "La Réserve ferme ses portes.";
  }

  private spawnVisitors(dtMinutes: number, _commits: TickCommit[]) {
    if (this.simMinutes < OPEN_MINUTES + 5 || this.simMinutes > CLOSE_MINUTES - 20) {
      return;
    }
    if (this.visitors.length >= MAX_VISITORS) return;
    if (this.visitors.length + this.staff.length >= MAX_AGENTS) return;
    const chance =
      spawnRate(this.simMinutes) * this.dayEvent.spawn_mult * dtMinutes;
    if (this.rng() > chance) return;

    this.visitorSeq += 1;
    const visitor = createVisitorAgent({
      simDay: this.simDay,
      visitorSeq: this.visitorSeq,
      rng: () => this.rng(),
      dayEvent: this.dayEvent,
    });
    this.visitors.push(visitor);
    this.lastEvent = `${visitor.name} entre dans la Réserve.`;
  }

  private activeQueueCounter(): "counter" | "counter_b" {
    return "counter";
  }

  private sendClient(visitor: VisitorAgent, dest: { x: number; y: number }) {
    visitor.path = findClientPath(
      { x: visitor.x, y: visitor.y },
      clampClientWalkable(dest),
    );
  }

  private moveAgents(dtMinutes: number) {
    this.cellCarry += CELLS_PER_SIM_MINUTE * dtMinutes;
    const steps = Math.min(Math.floor(this.cellCarry), 1);
    this.cellCarry = Math.min(this.cellCarry - steps, 1);
    if (steps <= 0) return;

    const advance = (
      path: Array<{ x: number; y: number }>,
      x: number,
      y: number,
      walk: (cx: number, cy: number) => boolean,
    ) => {
      let cx = x;
      let cy = y;
      let remaining = steps;
      while (remaining > 0 && path.length > 0) {
        const next = path.shift();
        if (!next) break;
        if (!walk(next.x, next.y)) {
          path.length = 0;
          break;
        }
        if (Math.abs(next.x - cx) + Math.abs(next.y - cy) !== 1) {
          path.unshift(next);
          break;
        }
        cx = next.x;
        cy = next.y;
        remaining -= 1;
      }
      return { x: cx, y: cy };
    };

    for (const visitor of this.visitors) {
      const moved = advance(visitor.path, visitor.x, visitor.y, isClientWalkable);
      visitor.x = moved.x;
      visitor.y = moved.y;
    }
    for (const agent of this.staff) {
      const moved = advance(agent.path, agent.x, agent.y, isWalkable);
      agent.x = moved.x;
      agent.y = moved.y;
    }
  }

  private updateVisitors(dtMinutes: number, commits: TickCommit[]) {
    const still: VisitorAgent[] = [];
    for (const visitor of this.visitors) {
      if (visitor.path.length > 0) {
        still.push(visitor);
        continue;
      }

      if (visitor.state === "enter" || visitor.state === "browse") {
        visitor.state = "roam";
        if (visitor.browse_left >= 0) visitor.browse_left = -1;
      }

      if (visitor.state === "roam") {
        if (visitor.browse_left < 0) {
          visitor.state = "consult";
          visitor.browse_left = 1.2 + this.rng() * 2.5;
        } else {
          this.continueRoaming(visitor);
        }
        still.push(visitor);
        continue;
      }

      if (visitor.state === "consult") {
        visitor.browse_left -= dtMinutes;
        if (visitor.browse_left > 0) {
          still.push(visitor);
          continue;
        }
        visitor.visits_left -= 1;
        this.afterConsult(visitor, commits);
        still.push(visitor);
        continue;
      }

      if (visitor.state === "read") {
        visitor.browse_left -= dtMinutes;
        if (visitor.browse_left <= 0) {
          visitor.visits_left = Math.max(0, visitor.visits_left - 1);
          if (visitor.visits_left <= 0 && this.rng() < 0.4) {
            visitor.state = "leave_empty";
            this.sendClient(visitor, locClient("entrance"));
            commits.push({
              type: "event",
              event_type: "CUSTOMER_LEAVE_EMPTY",
              visitor_id: visitor.id,
              message: `${visitor.name} quitte la salle de lecture sans acheter.`,
            });
          } else {
            this.continueRoaming(visitor);
          }
        }
        still.push(visitor);
        continue;
      }

      if (visitor.state === "ask_staff") {
        visitor.wait += dtMinutes;
        // Le clerk traite via tâche ADVISE_CUSTOMER (P0.2) — ici seulement l’impatience.
        if (visitor.wait > visitor.patience) {
          this.cancelAdviseForVisitor(visitor);
          visitor.state = "leave_empty";
          this.sendClient(visitor, locClient("entrance"));
          commits.push({
            type: "event",
            event_type: "CUSTOMER_LEAVE_EMPTY",
            visitor_id: visitor.id,
            message: `${visitor.name} part sans conseil : le comptoir était trop lent.`,
          });
          this.lastEvent = `${visitor.name} abandonne l'attente au comptoir.`;
        }
        still.push(visitor);
        continue;
      }

      if (visitor.state === "queue") {
        visitor.wait += dtMinutes;
        if (visitor.wait > visitor.patience && this.queue[0] !== visitor.id) {
          this.queue = this.queue.filter((id) => id !== visitor.id);
          visitor.state = "leave_empty";
          this.sendClient(visitor, locClient("entrance"));
          commits.push({
            type: "event",
            event_type: "CUSTOMER_LEAVE_EMPTY",
            visitor_id: visitor.id,
            message: `${visitor.name} quitte la file, trop longue.`,
          });
          this.lastEvent = `${visitor.name} abandonne la file.`;
        }
        still.push(visitor);
        continue;
      }

      if (visitor.state === "checkout") {
        still.push(visitor);
        continue;
      }

      if (visitor.state === "exit" || visitor.state === "leave_empty") {
        continue;
      }

      still.push(visitor);
    }
    this.visitors = still;
  }

  /** Après une consultation : acheter, continuer, demander conseil, ou partir. */
  private afterConsult(visitor: VisitorAgent, commits: TickCommit[]) {
    const book = pickBookForVisitor(this.books, visitor, () => this.rng());
    const utility = book ? bookUtility(book, visitor) : 0;
    const roll = this.rng();
    let buyChance = 0.1 + Math.min(0.28, utility / 55);
    buyChance *= this.dayEvent.buy_mult;
    if (visitor.temperament === "impatient") buyChance *= 0.85;
    if (visitor.temperament === "rare_seeker") buyChance *= 0.9;

    if (book && roll < buyChance) {
      visitor.book_id = book.book_id;
      visitor.book_title = book.title;
      visitor.state = "queue";
      this.queue.push(visitor.id);
      const counter = this.activeQueueCounter();
      this.sendClient(
        visitor,
        clampClientWalkable(
          queueStand(Math.max(0, this.queue.length - 1), counter),
        ),
      );
      this.lastEvent = `${visitor.name} se dirige vers la caisse avec « ${book.title} ».`;
      return;
    }

    // P2.7 — désordre soft (pas de vol) : rayon un peu chamboulé
    if (visitor.temperament === "messy" && this.rng() < 0.35) {
      commits.push({
        type: "event",
        event_type: "SHELF_DISORDER",
        visitor_id: visitor.id,
        message: `${visitor.name} laisse le rayon ${visitor.shelf_code.replace(/^shelf_/, "").toUpperCase()} en désordre.`,
      });
      this.lastEvent = `${visitor.name} dérange un rayon.`;
    }

    // P2.4 — pause lecture
    if (this.rng() < (visitor.temperament === "calm" ? 0.18 : 0.08)) {
      visitor.state = "read";
      visitor.browse_left = 2.5 + this.rng() * 4;
      this.sendClient(visitor, locClient("reading_room"));
      this.lastEvent = `${visitor.name} s'installe en salle de lecture.`;
      return;
    }

    // Plus d’arrêts prévus → partir ou dernier tour
    if (visitor.visits_left <= 0) {
      const leaveChance = visitor.temperament === "impatient" ? 0.72 : 0.55;
      if (this.rng() < leaveChance) {
        visitor.state = "leave_empty";
        this.sendClient(visitor, locClient("entrance"));
        commits.push({
          type: "event",
          event_type: "CUSTOMER_LEAVE_EMPTY",
          visitor_id: visitor.id,
          message: `${visitor.name} quitte la librairie sans acheter.`,
        });
        this.lastEvent = `${visitor.name} repart sans ouvrage.`;
      } else {
        visitor.visits_left = 1;
        this.continueRoaming(visitor);
      }
      return;
    }

    // Demande conseil — plus fréquent pour rare_seeker
    const adviseChance =
      visitor.temperament === "rare_seeker"
        ? 0.45
        : visitor.temperament === "impatient"
          ? 0.18
          : 0.28;
    if ((!book || utility < 8) && this.rng() < adviseChance) {
      this.requestAdvise(visitor, commits);
      return;
    }

    this.continueRoaming(visitor);
  }

  private requestAdvise(visitor: VisitorAgent, commits: TickCommit[]) {
    this.runtimeTaskSeq += 1;
    const taskId = -this.runtimeTaskSeq;
    this.tasks.push(createAdviseRuntimeTask(taskId));
    this.adviseByTask.set(taskId, visitor.id);
    visitor.advise_task_id = taskId;
    visitor.state = "ask_staff";
    visitor.wait = 0;
    this.sendClient(
      visitor,
      clampClientWalkable(queueStand(0, this.activeQueueCounter())),
    );
    commits.push({
      type: "event",
      event_type: "ADVISE_REQUESTED",
      visitor_id: visitor.id,
      message: `${visitor.name} sollicite un conseil au comptoir.`,
    });
    this.lastEvent = `${visitor.name} demande conseil au comptoir.`;
  }

  private cancelAdviseForVisitor(visitor: VisitorAgent) {
    const taskId = visitor.advise_task_id;
    if (taskId == null) return;
    this.tasks = this.tasks.filter((row) => row.id !== taskId);
    this.adviseByTask.delete(taskId);
    for (const agent of this.staff) {
      if (agent.task_id === taskId) {
        agent.task_id = null;
        agent.duty = "idle";
        agent.work_left = 0;
      }
    }
    visitor.advise_task_id = null;
  }

  private continueRoaming(visitor: VisitorAgent) {
    const next = pickClientInterest(() => this.rng(), visitor.shelf_code);
    visitor.shelf_code = next.shelf;
    // browse_left < 0 = consulter à l’arrivée ; 0 = simple passage
    visitor.browse_left = next.atShelf ? -1 : 0;
    visitor.state = "roam";
    this.sendClient(visitor, next.point);
  }

  private updateStaff(dtMinutes: number, commits: TickCommit[]) {
    for (const agent of this.staff) {
      const moraleFatigue =
        0.12 + (100 - Math.max(20, agent.stats.morale)) / 500;
      agent.stats.fatigue = Math.min(
        100,
        agent.stats.fatigue + dtMinutes * moraleFatigue,
      );
      if (agent.path.length > 0) continue;

      if (agent.role === "clerk") {
        this.workClerk(agent, dtMinutes, commits);
        continue;
      }
      if (agent.duty === "working" && agent.work_left > 0) {
        agent.work_left -= dtMinutes * workPace(agent);
        if (agent.work_left <= 0) {
          this.finishStaffTask(agent, commits);
        }
        continue;
      }
      if (agent.duty === "idle") {
        const home = locStaff(agent.home);
        if (Math.abs(agent.x - home.x) + Math.abs(agent.y - home.y) > 1) {
          agent.path = findPath({ x: agent.x, y: agent.y }, home);
          continue;
        }
        this.takeStaffTask(agent);
      }
    }
  }

  private workClerk(
    agent: StaffAgent,
    dtMinutes: number,
    commits: TickCommit[],
  ) {
    const home = locStaff(agent.home);
    if (Math.abs(agent.x - home.x) + Math.abs(agent.y - home.y) > 1) {
      agent.path = findPath({ x: agent.x, y: agent.y }, home);
      return;
    }

    // Conseil en cours (P0.2)
    if (agent.duty === "working" && agent.task_id != null) {
      const task = this.tasks.find((row) => row.id === agent.task_id);
      if (task?.type === "ADVISE_CUSTOMER") {
        agent.work_left -= dtMinutes * workPace(agent);
        if (agent.work_left <= 0) {
          this.finishAdvise(agent, commits);
        }
        return;
      }
    }

    // Encaissement déjà pris en charge par ce clerk
    if (
      agent.duty === "working" &&
      agent.task_id == null &&
      agent.serving_visitor_id
    ) {
      const visitor = this.visitors.find(
        (row) => row.id === agent.serving_visitor_id,
      );
      if (!visitor || visitor.state !== "checkout") {
        agent.duty = "idle";
        agent.work_left = 0;
        agent.serving_visitor_id = null;
      } else {
        agent.work_left -= dtMinutes * workPace(agent);
        if (agent.work_left <= 0) {
          this.queue = this.queue.filter((id) => id !== visitor.id);
          if (visitor.book_id) {
            commits.push({
              type: "sale",
              book_id: visitor.book_id,
              visitor_id: visitor.id,
              employee_id: agent.id,
              qty: 1,
            });
            this.lastEvent = `${visitor.name} acquiert « ${visitor.book_title} ».`;
            commits.push({
              type: "event",
              event_type: "CUSTOMER_PURCHASE",
              book_id: visitor.book_id,
              visitor_id: visitor.id,
              message: `${visitor.name} acquiert « ${visitor.book_title} ».`,
            });
            this.grantXp(agent, "checkout", commits);
          }
          visitor.state = "exit";
          this.sendClient(visitor, locClient("entrance"));
          agent.duty = "idle";
          agent.work_left = 0;
          agent.serving_visitor_id = null;
        }
        return;
      }
    }

    const headId = this.queue[0];
    const visitor = headId
      ? this.visitors.find((row) => row.id === headId)
      : undefined;

    if (visitor && visitor.path.length === 0 && visitor.state === "queue") {
      const preferredId = preferredCashierId(this.staff);
      const otherServing = this.staff.some(
        (row) =>
          row.id !== agent.id &&
          row.serving_visitor_id === visitor.id &&
          row.duty === "working",
      );
      if (otherServing) {
        this.takeAdviseTask(agent);
        return;
      }
      if (preferredId != null && preferredId !== agent.id) {
        const preferred = this.staff.find((row) => row.id === preferredId);
        if (
          preferred &&
          preferred.duty === "idle" &&
          preferred.path.length === 0
        ) {
          this.takeAdviseTask(agent);
          return;
        }
      }
      visitor.state = "checkout";
      agent.duty = "working";
      agent.task_id = null;
      agent.serving_visitor_id = visitor.id;
      const speed = Math.max(20, agent.stats.checkout_speed);
      let work = 1.4 + (100 - speed) / 40;
      work *= moraleFatigueFactor(agent);
      if (!reliabilityOk(agent, () => this.rng())) {
        work *= 1.35;
      }
      agent.work_left = work;
      return;
    }

    if (visitor && visitor.state === "checkout") {
      if (agent.serving_visitor_id !== visitor.id) {
        this.takeAdviseTask(agent);
        return;
      }
    }

    if (agent.duty !== "working") {
      agent.duty = "idle";
      this.takeAdviseTask(agent);
    }
  }

  private takeAdviseTask(agent: StaffAgent) {
    if (agent.role !== "clerk") return;
    const task = this.tasks
      .filter(
        (row) =>
          row.type === "ADVISE_CUSTOMER" &&
          (row.status === "pending" ||
            (row.status === "in_progress" && row.assignee_id === agent.id)),
      )
      .sort((a, b) => b.priority - a.priority)[0];
    if (!task) return;

    const visitorId = this.adviseByTask.get(task.id);
    const visitor = visitorId
      ? this.visitors.find(
          (row) => row.id === visitorId && row.state === "ask_staff",
        )
      : undefined;
    if (!visitor || visitor.path.length > 0) return;

    task.status = "in_progress";
    task.assignee_id = agent.id;
    agent.duty = "working";
    agent.task_id = task.id;
    agent.work_left = adviseWorkMinutes(
      agent.stats.advice,
      specialtyMatchesVisitor(agent, visitor),
      moraleFatigueFactor(agent),
    );
  }

  private finishAdvise(agent: StaffAgent, commits: TickCommit[]) {
    const task = this.tasks.find((row) => row.id === agent.task_id);
    const visitorId = task ? this.adviseByTask.get(task.id) : undefined;
    const visitor = visitorId
      ? this.visitors.find((row) => row.id === visitorId)
      : undefined;

    if (task) {
      this.tasks = this.tasks.filter((row) => row.id !== task.id);
      this.adviseByTask.delete(task.id);
    }
    agent.duty = "idle";
    agent.task_id = null;
    agent.work_left = 0;

    if (!visitor || visitor.state !== "ask_staff") return;

    visitor.advise_task_id = null;
    const adviceScore = Math.max(10, agent.stats.advice);
    const successChance = adviseSuccessChance({
      advice: adviceScore,
      specialtyBonus: specialtyMatchesVisitor(agent, visitor),
      morale: agent.stats.morale,
    });
    const reliable = reliabilityOk(agent, () => this.rng());

    if (!reliable || this.rng() > successChance) {
      visitor.state = "leave_empty";
      this.sendClient(visitor, locClient("entrance"));
      commits.push({
        type: "advise",
        task_id: task && task.id > 0 ? task.id : null,
        visitor_id: visitor.id,
      });
      commits.push({
        type: "event",
        event_type: "ADVISE_FAILED",
        visitor_id: visitor.id,
        message: `${agent.name} ne trouve pas d’ouvrage adapté pour ${visitor.name}.`,
      });
      this.lastEvent = `${visitor.name} repart après un conseil infructueux.`;
      return;
    }

    const book =
      pickBookForVisitor(this.books, visitor, () => this.rng(), {
        boostAdvice: adviceScore,
      }) ??
      pickBookForVisitor(this.books, visitor, () => this.rng(), {
        anyShelf: true,
        boostAdvice: adviceScore,
      });

    if (!book) {
      visitor.state = "leave_empty";
      this.sendClient(visitor, locClient("entrance"));
      commits.push({
        type: "advise",
        task_id: task && task.id > 0 ? task.id : null,
        visitor_id: visitor.id,
      });
      commits.push({
        type: "event",
        event_type: "UNAVAILABLE_REQUEST",
        visitor_id: visitor.id,
        message: `${visitor.name} : demande introuvable malgré le conseil de ${agent.name}.`,
      });
      return;
    }

    visitor.book_id = book.book_id;
    visitor.book_title = book.title;
    visitor.state = "queue";
    this.queue.push(visitor.id);
    this.sendClient(
      visitor,
      clampClientWalkable(
        queueStand(this.queue.length, this.activeQueueCounter()),
      ),
    );
    commits.push({
      type: "advise",
      task_id: task && task.id > 0 ? task.id : null,
      visitor_id: visitor.id,
      book_id: book.book_id,
    });
    commits.push({
      type: "event",
      event_type: "ADVISE_SUCCESS",
      visitor_id: visitor.id,
      book_id: book.book_id,
      message: `${agent.name} oriente ${visitor.name} vers « ${book.title} ».`,
    });
    this.lastEvent = `${agent.name} conseille « ${book.title} » à ${visitor.name}.`;
    this.grantXp(agent, "advise", commits);
  }

  private takeStaffTask(agent: StaffAgent) {
    const task = pickLogisticsTask(agent, this.tasks, (bookId) =>
      shelfForBook(this.books, bookId),
    );
    if (!task) return;

    task.status = "in_progress";
    task.assignee_id = agent.id;
    agent.duty = "working";
    agent.task_id = task.id;
    const destCode = agent.role === "stocker" ? "reserve" : "dock";
    agent.path = findPath({ x: agent.x, y: agent.y }, loc(destCode));
    const speed =
      agent.role === "stocker"
        ? agent.stats.restock_speed
        : agent.stats.receive_speed;
    const specialtyBonus =
      agent.role === "stocker" &&
      task.book_id != null &&
      specialtyMatchesShelf(agent, shelfForBook(this.books, task.book_id));
    agent.work_left = logisticsWorkMinutes({
      speedStat: speed,
      specialtyBonus,
      moraleFatigue: moraleFatigueFactor(agent),
      reliabilityFail: !reliabilityOk(agent, () => this.rng()),
    });
  }

  private finishStaffTask(agent: StaffAgent, commits: TickCommit[]) {
    const task = this.tasks.find((row) => row.id === agent.task_id);
    if (!task) {
      agent.duty = "idle";
      agent.task_id = null;
      return;
    }

    if (agent.role === "stocker" && task.book_id) {
      const dest = loc(shelfForBook(this.books, task.book_id));
      if (Math.abs(agent.x - dest.x) + Math.abs(agent.y - dest.y) > 1) {
        agent.path = findPath({ x: agent.x, y: agent.y }, dest);
        agent.work_left = 1.2 * moraleFatigueFactor(agent);
        return;
      }
      const book = this.books.find((row) => row.book_id === task.book_id);
      let qty = Math.min(book?.qty_reserve ?? 1, 5, 10 - (book?.qty_shelf ?? 0));
      // Fiabilité basse → moins d’exemplaires correctement rangés
      if (!reliabilityOk(agent, () => this.rng()) && qty > 1) {
        qty = Math.max(1, qty - 1);
      }
      if (specialtyMatchesShelf(agent, shelfForBook(this.books, task.book_id))) {
        qty = Math.min(
          book?.qty_reserve ?? qty,
          qty + 1,
          10 - (book?.qty_shelf ?? 0),
        );
      }
      if (qty > 0) {
        commits.push({
          type: "restock",
          task_id: task.id > 0 ? task.id : null,
          book_id: task.book_id,
          qty,
          employee_id: agent.id,
        });
        this.lastEvent = `${agent.name} remet en rayon « ${book?.title ?? "un ouvrage"} ».`;
        this.grantXp(agent, "restock", commits);
      }
    }

    if (agent.role === "receiver" && task.order_id) {
      commits.push({
        type: "receive",
        task_id: task.id > 0 ? task.id : null,
        order_id: task.order_id,
        employee_id: agent.id,
      });
      this.lastEvent = `${agent.name} réceptionne un convoi.`;
      this.grantXp(agent, "receive", commits);
    }

    this.tasks = this.tasks.filter((row) => row.id !== task.id);
    agent.duty = "idle";
    agent.task_id = null;
    agent.path = findPath({ x: agent.x, y: agent.y }, locStaff(agent.home));
  }
}
