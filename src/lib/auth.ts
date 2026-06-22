import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days (D-09)
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.insert(users).values({
            id: user.id,
            email: user.email,
            name: user.name,
          });
        },
      },
    },
  },
});
