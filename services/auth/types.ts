import type { UserPublic } from "@/services/users/types";

export type LoginInput = {
  username: string;
  password: string;
};

export type LoginResult = {
  user: UserPublic;
  token: string;
  expires_at: Date;
};
