"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { formatDate } from "@/lib/utils";
import type { ListingStatus } from "@/lib/types/database.types";
import { setListingStatus, type PosterStatusAction } from "../server/actions";
import { StatusBadge } from "./status-badge";

const CONFIRM_KEYS: Partial<Record<PosterStatusAction, [string, string, string]>> = {
  deactivate: [
    "listing.deactivateConfirmTitle",
    "listing.deactivateConfirmDescription",
    "listing.deactivate",
  ],
  delete: ["listing.deleteConfirmTitle", "listing.deleteConfirmDescription", "common.delete"],
};

/** Status, moderator feedback and lifecycle actions for the poster's listing. */
export function ManagePanel({
  id,
  token,
  status,
  expiresAt,
  rejectionComment,
}: {
  id: string;
  token: string;
  status: ListingStatus;
  expiresAt: string | null;
  rejectionComment: string | null;
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [confirming, setConfirming] = useState<PosterStatusAction | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: PosterStatusAction) => {
    setBusy(true);
    const result = await setListingStatus(id, token, action);
    setBusy(false);
    setConfirming(null);
    if (!result.ok) {
      toast.error(t(result.error));
      return;
    }
    if (action === "delete") {
      router.push(`/${locale}`);
      return;
    }
    router.refresh();
  };

  const confirmKeys = confirming ? CONFIRM_KEYS[confirming] : undefined;

  return (
    <section className="grid gap-3 p-4 pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("manage.title")}</h1>
        <StatusBadge status={status} />
      </div>

      <p className="text-muted-foreground text-sm">
        {status === "approved" && expiresAt
          ? t("manage.liveUntil", { date: formatDate(expiresAt, locale) })
          : status === "pending"
            ? t("manage.pendingHint")
            : status === "expired"
              ? t("manage.expiredHint")
              : null}
      </p>

      {status === "rejected" && rejectionComment ? (
        <div className="bg-destructive/5 border-destructive/20 rounded-lg border p-3 text-sm">
          <p className="text-destructive mb-1 text-xs font-semibold">
            {t("listing.moderatorComment")}
          </p>
          <p>{rejectionComment}</p>
          <p className="text-muted-foreground mt-2 text-xs">{t("manage.rejectedHint")}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {status === "approved" ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/listing/${id}`}>{t("common.view")}</Link>
          </Button>
        ) : null}
        {status === "approved" ? (
          <Button variant="outline" size="sm" onClick={() => setConfirming("deactivate")}>
            {t("listing.deactivate")}
          </Button>
        ) : null}
        {["draft", "rejected", "expired"].includes(status) ? (
          <Button size="sm" disabled={busy} onClick={() => void run("republish")}>
            {t("listing.republish")}
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className="text-destructive"
          onClick={() => setConfirming("delete")}
        >
          {t("common.delete")}
        </Button>
      </div>

      <AlertDialog open={confirming !== null} onOpenChange={(o) => !o && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmKeys ? t(confirmKeys[0]) : ""}</AlertDialogTitle>
            <AlertDialogDescription>{confirmKeys ? t(confirmKeys[1]) : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                if (confirming) void run(confirming);
              }}
            >
              {confirmKeys ? t(confirmKeys[2]) : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
