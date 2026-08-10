import { z } from "zod";

export const QUESTION_MIN = 1;
export const QUESTION_MAX = 200;
export const OPTION_MIN = 1;
export const OPTION_MAX = 100;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;

export const createPollSchema = z
  .object({
    question: z
      .string()
      .trim()
      .min(QUESTION_MIN, "Question is required.")
      .max(QUESTION_MAX, `Question must be ${QUESTION_MAX} characters or fewer.`),
    options: z
      .array(
        z
          .string()
          .trim()
          .max(OPTION_MAX, `Option must be ${OPTION_MAX} characters or fewer.`),
      )
      .max(MAX_OPTIONS, `No more than ${MAX_OPTIONS} options.`),
    type: z.enum(["single", "multiple", "rating", "scale", "reactions", "ranking", "text"]).default("single"),
    hideResults: z.boolean().default(false),
    requireAuth: z.boolean().default(false),
    workspaceId: z.string().uuid().nullable().optional(),
    webhookUrl: z.string().url("Invalid Webhook URL format.").or(z.literal("")).nullable().optional(),
    // Optional ISO datetime for when voting should close.
    closesAt: z.string().datetime({ offset: true }).nullable().optional(),
    optionImages: z.array(z.string().url("Invalid image URL.").or(z.literal("")).nullable().optional()).optional(),
    hideResultsUntilClose: z.boolean().default(false),
    voteLimit: z.number().int().positive().nullable().optional(),
    password: z.string().min(1).max(50).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "rating" || data.type === "scale" || data.type === "text") {
        return true;
      }
      if (data.type === "reactions") {
        return data.options.length >= MIN_OPTIONS && data.options.length <= MAX_OPTIONS;
      }
      if (data.options.length < MIN_OPTIONS) return false;
      const seen = new Set<string>();
      for (const opt of data.options) {
        const trimmed = opt.trim();
        if (!trimmed) return false; // empty option
        const key = trimmed.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
      }
      return true;
    },
    { message: "Options must be unique and non-empty.", path: ["options"] },
  );

export type CreatePollInput = z.infer<typeof createPollSchema>;

export const voteSchema = z
  .object({
    slug: z.string().min(1),
    optionIds: z.array(z.uuid()).min(1, "Select an option.").max(MAX_OPTIONS),
    voterId: z.string().optional(),
    textResponse: z.string().max(500).optional(),
    ranks: z.record(z.string(), z.number()).optional(),
    password: z.string().optional(),
    durationMs: z.number().int().nonnegative().optional(),
  });

export type VoteInput = z.infer<typeof voteSchema>;

export const managePollSchema = z.object({
  slug: z.string().min(1),
  adminToken: z.string().min(1).optional(),
  action: z.enum(["close", "reopen", "delete"]),
});

export type ManagePollInput = z.infer<typeof managePollSchema>;
