import { Prisma } from "@/lib/generated/prisma/client";

export const formatsPublicSelect = {
  id: true,
  name: true,
  code: true,
} satisfies Prisma.formatsSelect;

export type FormatPublic = Prisma.formatsGetPayload<{
  select: typeof formatsPublicSelect;
}>;

export type CreateFormatInput = {
  name: string;
  code: string;
};

export type UpdateFormatInput = {
  name?: string;
  code?: string;
};
