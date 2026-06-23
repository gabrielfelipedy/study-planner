import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import {
  authUser,
  authSession,
  authAccount,
  authVerification,
} from "@/lib/db/auth-schema";

const isDev = process.env.NODE_ENV !== "production";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: authUser,
      session: authSession,
      account: authAccount,
      verification: authVerification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      if (isDev) {
        console.log(`[DEV] Verification email for ${user.email}: ${url}`);
      }
    },
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
