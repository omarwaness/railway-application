import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const railwayToken = pgTable("railway_token", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  // AES-256-GCM payload, stored as "iv:authTag:ciphertext" (all base64)
  encryptedToken: text("encrypted_token").notNull(),
  // last 4 chars of the plaintext, safe to send to the client
  last4: text("last4").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const railwayTokenRelations = relations(railwayToken, ({ one }) => ({
  user: one(user, {
    fields: [railwayToken.userId],
    references: [user.id],
  }),
}));
