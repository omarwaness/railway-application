import { z } from "zod"

/**
 * Mirrors what the API accepts on `POST /api/auth/sign-up/email`. The password
 * bounds are better-auth's defaults for the email+password provider — the
 * server enables it without overrides (apps/server/src/lib/auth.ts), so an
 * out-of-range password would come back as a 422 rather than a field error.
 */
export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email address")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
})

export type SignUpValues = z.infer<typeof signUpSchema>

/**
 * `POST /api/auth/sign-in/email`. The password is only checked for presence —
 * an account created before the rules changed still has to be able to sign in,
 * and telling a visitor their password is too short gives away nothing useful.
 */
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Password is required"),
})

export type SignInValues = z.infer<typeof signInSchema>
