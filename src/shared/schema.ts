import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Token status enum
export enum TokenStatus {
  WAITING = "waiting",
  ATTENDING = "attending",
  SERVED = "served"
}

// Users table (authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Booths table
export const booths = pgTable("booths", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  staffCapacity: integer("staff_capacity").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertBoothSchema = createInsertSchema(booths).pick({
  name: true,
  description: true,
  staffCapacity: true,
  isActive: true,
});

// Participants table
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  useCaseId: text("use_case_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertParticipantSchema = createInsertSchema(participants).pick({
  name: true,
  email: true,
  phone: true,
  useCaseId: true,
});

// Tokens table
export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  tokenNumber: text("token_number").notNull().unique(),
  participantId: integer("participant_id").notNull(),
  boothId: integer("booth_id").notNull(),
  status: text("status").notNull().default(TokenStatus.WAITING),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  statusUpdatedAt: timestamp("status_updated_at").defaultNow().notNull(),
});

export const insertTokenSchema = createInsertSchema(tokens).pick({
  tokenNumber: true,
  participantId: true,
  boothId: true,
  status: true,
});

// Reassignments table
export const reassignments = pgTable("reassignments", {
  id: serial("id").primaryKey(),
  tokenId: integer("token_id").notNull(),
  fromBoothId: integer("from_booth_id").notNull(),
  toBoothId: integer("to_booth_id").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReassignmentSchema = createInsertSchema(reassignments).pick({
  tokenId: true,
  fromBoothId: true,
  toBoothId: true,
  reason: true,
});

// Registration form schema
export const registrationFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }),
  useCaseId: z.string().min(2, { message: "Use case ID is required" }),
  boothId: z.number({ message: "Please select a booth" }),
});

// Reassignment form schema
export const reassignmentFormSchema = z.object({
  tokenNumber: z.string().min(1, { message: "Token number is required" }),
  fromBoothId: z.number({ message: "Current booth is required" }),
  toBoothId: z.number({ message: "Target booth is required" }),
  reason: z.string().optional(),
}).refine(
  (data) => data.fromBoothId !== data.toBoothId,
  {
    message: "Target booth must be different from current booth",
    path: ["toBoothId"],
  }
);

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Booth = typeof booths.$inferSelect;
export type InsertBooth = z.infer<typeof insertBoothSchema>;

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export type Token = typeof tokens.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;

export type Reassignment = typeof reassignments.$inferSelect;
export type InsertReassignment = z.infer<typeof insertReassignmentSchema>;

export type RegistrationForm = z.infer<typeof registrationFormSchema>;
export type ReassignmentForm = z.infer<typeof reassignmentFormSchema>;

// Combined token data type for the frontend
export type TokenWithDetails = {
  id: number;
  tokenNumber: string;
  status: string;
  boothId: number;
  boothName: string;
  participant: {
    id: number;
    name: string;
    email: string;
    phone: string;
    useCaseId: string;
  };
  createdAt: Date;
  statusUpdatedAt: Date;
  queuePosition?: number;
  estimatedWaitTime?: string;
};

// Booth status type for the frontend
export type BoothStatus = {
  id: number;
  name: string;
  isActive: boolean;
  staffCapacity: number;
  currentlyServingCount: number;
  currentlyServing: TokenWithDetails[] | null;
  waitingTokens: TokenWithDetails[];
  averageWaitTime: string;
};

// Dashboard stats type for the frontend
export type DashboardStats = {
  totalTokens: number;
  waiting: number;
  attending: number;
  served: number;
};

// WebSocket message types
export type WebSocketMessage = {
  type: 'TOKEN_CREATED' | 'TOKEN_UPDATED' | 'TOKEN_REASSIGNED' | 'BOOTH_UPDATED' | 'INITIAL_DATA' | 'DASHBOARD_UPDATED';
  payload: any;
};
