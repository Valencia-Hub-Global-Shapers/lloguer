"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/client";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Passwordless sign-in: emails a one-time link that lands on /auth/callback.
 * The first sign-in creates the account (shouldCreateUser); it grants nothing
 * until an admin flag is set on its profile in the database.
 */
export function MagicLinkForm({ next }: { next: string }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        shouldCreateUser: true,
      },
    });
    setStatus(error ? "error" : "sent");
  };

  if (status === "sent") {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        {t("auth.linkSent", { email })}
      </p>
    );
  }

  return (
    <form onSubmit={send} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="magic-email">{t("auth.email")}</Label>
        <Input
          id="magic-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? t("common.loading") : t("auth.sendLink")}
      </Button>
      {status === "error" ? (
        <p className="text-destructive text-sm" role="alert">
          {t("auth.linkError")}
        </p>
      ) : null}
    </form>
  );
}
