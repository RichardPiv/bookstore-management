import { generateDna, parseDna, type CharacterDna } from "@/scripts/characters/dna";

import {
  anonymousName,
  ARCHETYPES,
  NAMED_VISITORS,
  WEIGHT_VALUE,
} from "./data/visitors";
import {
  approachPoint,
  categoryCodeToShelf,
  categoryToShelf,
  isClientWalkable,
  isWalkable,
  queueStand,
  randomHallPoint,
  shelfCodes,
  spawnPoint,
  staffStand,
} from "./map";
import { shelfLocationFromCategoryCode } from "./categories";
import {
  clampClientWalkable,
  clampWalkable,
  findClientPath,
  findPath,
} from "./pathfinding";
import {
  CELLS_PER_SIM_MINUTE,
  CLOSE_MINUTES,
  defaultStats,
  MAX_AGENTS,
  MAX_VISITORS,
  OPEN_MINUTES,
  parseStats,
  spawnRate,
  type EmployeeRole,
  type EngineSnapshot,
  type HudState,
  type RenderAgent,
  type StaffAgent,
  type TickCommit,
  type TickResult,
  type VisitorAgent,
  type WorldBook,
  type WorldEmployee,
  type WorldTask,
} from "./types";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loc(code: string) {
  return clampWalkable(approachPoint(code));
}

function locClient(code: string) {
  return clampClientWalkable(approachPoint(code));
}

function locStaff(code: string) {
  return clampWalkable(staffStand(code));
}

function facingFromDelta(
  dx: number,
  dy: number,
): RenderAgent["facing"] {
  if (dx === 0 && dy === 0) return "down";
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? "left" : "right";
  }
  return dy < 0 ? "up" : "down";
}

/** Regard vers le personnage le plus proche (clients à l’arrêt). */
function facingTowardNearest(
  x: number,
  y: number,
  others: Array<{ x: number; y: number }>,
  fallback: RenderAgent["facing"] = "down",
): RenderAgent["facing"] {
  let bestDx = 0;
  let bestDy = 0;
  let bestDist = 10;
  for (const other of others) {
    const dx = other.x - x;
    const dy = other.y - y;
    const dist = Math.abs(dx) + Math.abs(dy);
    if (dist <= 0 || dist > bestDist) continue;
    bestDist = dist;
    bestDx = dx;
    bestDy = dy;
  }
  if (bestDist >= 10) return fallback;
  return facingFromDelta(bestDx, bestDy);
}

/** Regard idle du staff selon le poste (vers la salle, pas vers la caméra). */
function staffPostFacing(
  role: EmployeeRole,
  x: number,
): RenderAgent["facing"] {
  if (role === "clerk") {
    // Comptoir : face à la salle (nord)
    return "up";
  }
  if (role === "receiver") {
    // Quai / entrée annexe : face à la salle (ouest, vers le mitoyen)
    return "left";
  }
  // Stocker : devant la réserve → vers la salle ; fond → garde le regard
  if (x < 70) return "left";
  return "right";
}

function pickWeighted<T>(items: T[], weight: (item: T) => number, rng: () => number): T {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1]!;
}

export type EngineWorld = {
  books: WorldBook[];
  tasks: WorldTask[];
  employees: WorldEmployee[];
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
  private books: WorldBook[] = [];
  private tasks: WorldTask[] = [];
  private rngFn = mulberry32(1);
  private rngState = 1;
  private visitorSeq = 0;
  private cellCarry = 0;

  hydrateWorld(world: EngineWorld) {
    this.books = world.books.map((book) => ({ ...book }));
    this.tasks = world.tasks
      .filter((task) => task.status === "pending" || task.status === "in_progress")
      .map((task) => ({ ...task }));
    if (this.staff.length === 0) {
      this.staff = world.employees
        .filter((row) => row.status !== "dismissed")
        .map((row) => this.toStaffAgent(row));
    }
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
        existing.name = row.name;
        existing.role = row.role;
        existing.stats = parseStats(row.stats_json);
        existing.dna = parseDna(row.appearance_json);
        existing.home = homeForRole(row.role);
        return existing;
      }
      return this.toStaffAgent(row);
    });
  }

  loadSnapshot(snapshot: EngineSnapshot | null | undefined) {
    if (!snapshot || snapshot.version !== 1) return;
    this.simDay = snapshot.sim_day;
    this.simMinutes = snapshot.sim_minutes;
    this.speed = snapshot.speed;
    this.paused = snapshot.paused;
    this.visitors = snapshot.visitors.map((visitor) => {
      const pos = clampClientWalkable({
        x: Math.round(visitor.x),
        y: Math.round(visitor.y),
      });
      const visits =
        typeof (visitor as VisitorAgent).visits_left === "number"
          ? (visitor as VisitorAgent).visits_left
          : 2 + Math.floor(Math.random() * 3);
      let state = visitor.state;
      if (state === "browse") state = "roam";
      return {
        ...visitor,
        state,
        x: pos.x,
        y: pos.y,
        visits_left: visits,
        path: [],
      };
    });
    this.staff = snapshot.staff.map((agent) => {
      const pos = clampWalkable({
        x: Math.round(agent.x),
        y: Math.round(agent.y),
      });
      return { ...agent, x: pos.x, y: pos.y };
    });
    this.queue = snapshot.queue;
    this.setRng(snapshot.rng);
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
    return {
      sim_day: this.simDay,
      sim_minutes: this.simMinutes,
      speed: this.speed,
      paused: this.paused,
      visitor_count: this.visitors.length,
      queue_length: this.queue.length,
      staff_busy: this.staff.filter((agent) => agent.duty === "working").length,
      last_event: this.lastEvent,
    };
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
    }

    this.moveAgents(dtMinutes);
    this.spawnVisitors(dtMinutes, commits);
    this.updateVisitors(dtMinutes, commits);
    this.updateStaff(dtMinutes, commits);

    return { commits, closed_day: closedDay, clock: this.clock() };
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

  private toStaffAgent(row: WorldEmployee): StaffAgent {
    const role = (["clerk", "stocker", "receiver"].includes(row.role)
      ? row.role
      : "clerk") as EmployeeRole;
    const home = homeForRole(role);
    const pos = locStaff(home);
    return {
      id: row.id,
      name: row.name,
      role,
      dna: parseDna(row.appearance_json),
      stats: parseStats(row.stats_json),
      x: pos.x,
      y: pos.y,
      path: [],
      duty: "idle",
      task_id: null,
      work_left: 0,
      home,
    };
  }

  private closeShop(commits: TickCommit[]) {
    for (const visitor of this.visitors) {
      commits.push({
        type: "event",
        event_type: "CUSTOMER_LEAVE_EMPTY",
        visitor_id: visitor.id,
        message: `${visitor.name} quitte la Réserve à la fermeture.`,
      });
    }
    this.visitors = [];
    this.queue = [];
    for (const agent of this.staff) {
      agent.path = [];
      agent.duty = "idle";
      agent.task_id = null;
      agent.work_left = 0;
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
    const chance = spawnRate(this.simMinutes) * dtMinutes;
    if (this.rng() > chance) return;

    const visitor = this.createVisitor();
    this.visitors.push(visitor);
    this.lastEvent = `${visitor.name} entre dans la Réserve.`;
  }

  private createVisitor(): VisitorAgent {
    this.visitorSeq += 1;
    const useNamed = this.rng() < 0.2;
    let name: string;
    let loreCode: string | null = null;
    let archetype: string;
    let categories: string[];
    let dna: CharacterDna;

    if (useNamed) {
      const named = pickWeighted(
        NAMED_VISITORS,
        (row) => WEIGHT_VALUE[row.simulation_weight],
        () => this.rng(),
      );
      name = named.name;
      loreCode = named.id;
      archetype = named.archetype;
      categories = named.preferred_categories;
      dna = generateDna(`visitor-${named.id}`, { outfit: "scholar_coat" });
    } else {
      const arch = ARCHETYPES[Math.floor(this.rng() * ARCHETYPES.length)]!;
      archetype = arch.name;
      categories = [...arch.categories];
      name = anonymousName(Math.floor(this.rng() * 10_000));
      loreCode = null;
      dna = generateDna(`anon-${this.visitorSeq}-${name}`, {
        outfit: "visitor_cloak",
      });
    }

    const preferredShelf = categoryToShelf(categories[0] ?? "Histoire");
    const start = clampClientWalkable(spawnPoint());
    const first = this.pickClientInterest(preferredShelf);
    return {
      id: `v-${this.simDay}-${this.visitorSeq}`,
      name,
      lore_code: loreCode,
      archetype,
      dna,
      state: "roam",
      x: start.x,
      y: start.y,
      path: findClientPath(start, first.point),
      shelf_code: first.shelf,
      book_id: null,
      book_title: null,
      patience: 10 + this.rng() * 14,
      wait: 0,
      browse_left: first.atShelf ? -1 : 0,
      visits_left: 2 + Math.floor(this.rng() * 4),
    };
  }

  /** Destination libre dans la salle : rayon (souvent) ou point au hasard. */
  private pickClientInterest(preferredShelf?: string): {
    point: { x: number; y: number };
    shelf: string;
    atShelf: boolean;
  } {
    const shelves = shelfCodes();
    const fallback =
      (preferredShelf && shelves.includes(preferredShelf)
        ? preferredShelf
        : shelves[0]) ?? "shelf_his";
    if (this.rng() < 0.75 && shelves.length > 0) {
      let code = shelves[Math.floor(this.rng() * shelves.length)]!;
      if (
        preferredShelf &&
        shelves.includes(preferredShelf) &&
        this.rng() < 0.5
      ) {
        code = preferredShelf;
      }
      return { point: locClient(code), shelf: code, atShelf: true };
    }
    return {
      point: clampClientWalkable(randomHallPoint(() => this.rng())),
      shelf: fallback,
      atShelf: false,
    };
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

      if (visitor.state === "ask_staff") {
        visitor.wait += dtMinutes;
        const clerk = this.staff.find((agent) => agent.role === "clerk");
        const advised = clerk && visitor.wait > 1.2;
        if (advised) {
          const book = this.pickBook(visitor.shelf_code) ?? this.pickBook(null);
          if (book) {
            visitor.book_id = book.book_id;
            visitor.book_title = book.title;
            visitor.state = "queue";
            this.queue.push(visitor.id);
            this.sendClient(
              visitor,
              clampClientWalkable(queueStand(this.queue.length)),
            );
          } else {
            visitor.state = "leave_empty";
            this.sendClient(visitor, locClient("entrance"));
            commits.push({
              type: "event",
              event_type: "UNAVAILABLE_REQUEST",
              visitor_id: visitor.id,
              message: `${visitor.name} : demande introuvable malgré le conseil du comptoir.`,
            });
          }
        } else if (visitor.wait > visitor.patience) {
          visitor.state = "leave_empty";
          this.sendClient(visitor, locClient("entrance"));
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
    const book = this.pickBook(visitor.shelf_code);
    const roll = this.rng();

    // Achat possible à chaque consultation (~22 %)
    if (book && roll < 0.22) {
      visitor.book_id = book.book_id;
      visitor.book_title = book.title;
      visitor.state = "queue";
      this.queue.push(visitor.id);
      this.sendClient(
        visitor,
        clampClientWalkable(queueStand(Math.max(0, this.queue.length - 1))),
      );
      this.lastEvent = `${visitor.name} se dirige vers la caisse avec « ${book.title} ».`;
      return;
    }

    // Plus d’arrêts prévus → partir ou dernier tour
    if (visitor.visits_left <= 0) {
      if (this.rng() < 0.55) {
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

    // Parfois demander au comptoir
    if (!book && this.rng() < 0.2) {
      visitor.state = "ask_staff";
      visitor.wait = 0;
      this.sendClient(visitor, clampClientWalkable(queueStand(0)));
      return;
    }

    this.continueRoaming(visitor);
  }

  private continueRoaming(visitor: VisitorAgent) {
    const next = this.pickClientInterest(visitor.shelf_code);
    visitor.shelf_code = next.shelf;
    // browse_left < 0 = consulter à l’arrivée ; 0 = simple passage
    visitor.browse_left = next.atShelf ? -1 : 0;
    visitor.state = "roam";
    this.sendClient(visitor, next.point);
  }

  private updateStaff(dtMinutes: number, commits: TickCommit[]) {
    for (const agent of this.staff) {
      agent.stats.fatigue = Math.min(100, agent.stats.fatigue + dtMinutes * 0.15);
      if (agent.path.length > 0) continue;

      if (agent.role === "clerk") {
        this.workClerk(agent, dtMinutes, commits);
        continue;
      }
      if (agent.duty === "working" && agent.work_left > 0) {
        const fatigueSlow = 1 - agent.stats.fatigue / 250;
        agent.work_left -= dtMinutes * Math.max(0.45, fatigueSlow);
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
    const home = locStaff("counter");
    if (Math.abs(agent.x - home.x) + Math.abs(agent.y - home.y) > 1) {
      agent.path = findPath({ x: agent.x, y: agent.y }, home);
      return;
    }

    const headId = this.queue[0];
    const visitor = headId
      ? this.visitors.find((row) => row.id === headId)
      : undefined;
    if (!visitor || visitor.path.length > 0) {
      agent.duty = "idle";
      return;
    }

    if (visitor.state === "queue") {
      visitor.state = "checkout";
      agent.duty = "working";
      const speed = Math.max(20, agent.stats.checkout_speed);
      agent.work_left = 1.4 + (100 - speed) / 40;
      agent.task_id = null;
      return;
    }

    if (visitor.state === "checkout") {
      agent.work_left -= dtMinutes;
      if (agent.work_left <= 0) {
        this.queue.shift();
        if (visitor.book_id) {
          commits.push({
            type: "sale",
            book_id: visitor.book_id,
            visitor_id: visitor.id,
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
        }
        visitor.state = "exit";
        this.sendClient(visitor, locClient("entrance"));
        agent.duty = "idle";
        agent.work_left = 0;
      }
    }
  }

  private takeStaffTask(agent: StaffAgent) {
    const wanted =
      agent.role === "stocker"
        ? "RESTOCK_SHELF"
        : agent.role === "receiver"
          ? "RECEIVE_DELIVERY"
          : null;
    if (!wanted) return;
    const task = this.tasks.find(
      (row) =>
        row.type === wanted &&
        (row.status === "pending" ||
          (row.status === "in_progress" && row.assignee_id === agent.id)),
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
    agent.work_left = 2.5 + (100 - speed) / 35;
  }

  private finishStaffTask(agent: StaffAgent, commits: TickCommit[]) {
    const task = this.tasks.find((row) => row.id === agent.task_id);
    if (!task) {
      agent.duty = "idle";
      agent.task_id = null;
      return;
    }

    if (agent.role === "stocker" && task.book_id) {
      const dest = loc(this.shelfForBook(task.book_id));
      if (Math.abs(agent.x - dest.x) + Math.abs(agent.y - dest.y) > 1) {
        agent.path = findPath({ x: agent.x, y: agent.y }, dest);
        agent.work_left = 1.2;
        return;
      }
      const book = this.books.find((row) => row.book_id === task.book_id);
      const qty = Math.min(book?.qty_reserve ?? 1, 5, 10 - (book?.qty_shelf ?? 0));
      if (qty > 0) {
        commits.push({
          type: "restock",
          task_id: task.id,
          book_id: task.book_id,
          qty,
        });
        this.lastEvent = `${agent.name} remet en rayon « ${book?.title ?? "un ouvrage"} ».`;
      }
    }

    if (agent.role === "receiver" && task.order_id) {
      commits.push({
        type: "receive",
        task_id: task.id,
        order_id: task.order_id,
      });
      this.lastEvent = `${agent.name} réceptionne un convoi.`;
    }

    this.tasks = this.tasks.filter((row) => row.id !== task.id);
    agent.duty = "idle";
    agent.task_id = null;
    agent.path = findPath({ x: agent.x, y: agent.y }, locStaff(agent.home));
  }

  private shelfForBook(bookId: number): string {
    const book = this.books.find((row) => row.book_id === bookId);
    if (!book) return shelfLocationFromCategoryCode("HIS");
    return categoryCodeToShelf(book.category_code);
  }

  private pickBook(shelfCode: string | null): WorldBook | null {
    const eligible = this.books.filter((book) => {
      if (book.qty_shelf <= 0) return false;
      if (book.rarity === "legendary" || book.rarity === "mythic") {
        return this.rng() < 0.04;
      }
      if (!shelfCode) return true;
      return categoryCodeToShelf(book.category_code) === shelfCode;
    });
    if (eligible.length === 0) return null;
    return eligible[Math.floor(this.rng() * eligible.length)] ?? null;
  }
}

function homeForRole(role: EmployeeRole): string {
  if (role === "stocker") return "reserve";
  if (role === "receiver") return "dock";
  return "counter";
}
