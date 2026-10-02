import { cn } from "@/lib/utils";

/** Running section index in the Global Shapers Valencia style: "01  LABEL". */
export function SectionEyebrow({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "text-brand flex flex-wrap items-baseline gap-x-3 font-sans text-[0.72rem] font-semibold tracking-[0.16em] uppercase",
        className,
      )}
    >
      <span className="text-primary tracking-[0.04em] tabular-nums">
        {String(index).padStart(2, "0")}
      </span>
      {children}
    </span>
  );
}
