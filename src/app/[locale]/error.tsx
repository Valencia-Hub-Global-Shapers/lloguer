"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-xl font-semibold tracking-tight">{t("errors.pageTitle")}</p>
      <p className="text-muted-foreground text-sm">{t("errors.pageHint")}</p>
      <Button onClick={reset} className="mt-2">
        {t("common.retry")}
      </Button>
    </main>
  );
}
