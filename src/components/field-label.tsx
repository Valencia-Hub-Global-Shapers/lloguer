"use client";

import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/client";

/**
 * Form label that says whether the field is mandatory ("*") or optional
 * ("(optional)"), so nobody has to guess.
 */
export function FieldLabel({
  htmlFor,
  required,
  optional,
  note,
  className,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  /** Free-text qualifier, e.g. "at least one of the two". */
  note?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Label htmlFor={htmlFor} className={className}>
      {children}
      {required ? (
        <>
          <span aria-hidden className="text-primary ml-0.5">
            *
          </span>
          <span className="sr-only">({t("common.required")})</span>
        </>
      ) : null}
      {note ? <span className="text-muted-foreground ml-1.5 font-normal">({note})</span> : null}
      {optional ? (
        <span className="text-muted-foreground ml-1.5 font-normal">({t("common.optional")})</span>
      ) : null}
    </Label>
  );
}
