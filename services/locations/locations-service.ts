import { prisma } from "@/lib/prisma";
import { LOCATION_DEFS } from "@/simulation/map";

export async function ensureLocations() {
  await prisma.locations.deleteMany({
    where: { code: { notIn: LOCATION_DEFS.map((loc) => loc.code) } },
  });
  for (const loc of LOCATION_DEFS) {
    await prisma.locations.upsert({
      where: { code: loc.code },
      create: {
        code: loc.code,
        name: loc.name,
        kind: loc.kind,
        x: loc.x,
        y: loc.y,
      },
      update: {
        name: loc.name,
        kind: loc.kind,
        x: loc.x,
        y: loc.y,
      },
    });
  }
}

export async function listLocations() {
  await ensureLocations();
  return prisma.locations.findMany({
    orderBy: { id: "asc" },
  });
}
