"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";
import type { ActionResult } from "@/lib/errors";
import { logError } from "@/lib/log";

function safeNext(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/dashboard";
}

export async function signUp(
  input: unknown,
  next?: unknown
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }
  const { displayName, email, password } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) {
    logError("signUp", error, { ok: false });
    return {
      ok: false,
      error:
        error.code === "user_already_exists" ||
        error.code === "email_exists"
          ? "An account with this email already exists. Try signing in."
          : "Could not create your account. Please try again.",
    };
  }
  redirect(safeNext(next));
}

export async function signIn(
  input: unknown,
  next?: unknown
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { ok: false, error: "Invalid email or password." };
  }
  redirect(safeNext(next));
}
