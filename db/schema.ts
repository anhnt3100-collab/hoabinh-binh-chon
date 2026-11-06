import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const votes = pgTable("votes", {
  id: serial().primaryKey(),
  voterId: text("voter_id").notNull().unique(),
  name: text().notNull(),
  nameKey: text("name_key").notNull().unique(),
  choice: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
