import { z } from "zod";

// Env vars are always strings (or undefined), so numbers must be coerced.
const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  IBKR_HOST: z.string().default("127.0.0.1"),
  IBKR_PORT: z.coerce.number().int().positive().default(4002), // 4002 = IB Gateway paper
  IBKR_CLIENT_ID: z.coerce.number().int().nonnegative().default(1),
  IBKR_TRADING_MODE: z.enum(["paper", "live"]).default("paper"),
});

const result = schema.safeParse(process.env);

// Fail at startup, not in the middle of a request.
if (!result.success) {
  console.error("Invalid environment configuration:\n" + z.prettifyError(result.error));
  process.exit(1);
}

export const config = result.data;
