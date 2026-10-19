/**
 * Hero headline whose middle line cycles through the places room ads get posted today.
 * Screen readers get the plain sentence; the animated copy is decorative. Pure CSS
 * (`.rotator` in globals.css), built for three words.
 */
export function RotatingTitle({
  title,
  before,
  words,
  after,
}: {
  title: string;
  before: string;
  words: string[];
  after: string;
}) {
  return (
    <h1 className="font-display max-w-3xl text-[clamp(2.1rem,9.4vw,3.6rem)] leading-[1.04] font-semibold tracking-[-0.025em]">
      <span className="sr-only">{title}</span>
      <span aria-hidden="true" className="block">
        <span
          className="rise block"
          style={{ "--d": "80ms" } as React.CSSProperties}
        >
          {before}
        </span>
        <span
          className="rise block pb-2"
          style={{ "--d": "160ms" } as React.CSSProperties}
        >
          <span className="rotator text-brand italic">
            {words.map((word, i) => (
              <span
                key={word}
                className="relative w-max"
                style={{ animationDelay: `${i * 2.6}s` }}
              >
                {word}
                <svg
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                  className="absolute inset-x-0 -bottom-2 h-3 w-full"
                >
                  <path
                    className="squiggle"
                    d="M2 8 C 40 2, 70 12, 110 6 S 190 2, 230 7 S 280 9, 298 4"
                    fill="none"
                    stroke="var(--brand)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    pathLength={1}
                    style={{ animationDelay: `${i * 2.6}s` }}
                  />
                </svg>
              </span>
            ))}
          </span>
        </span>
        <span
          className="rise block"
          style={{ "--d": "240ms" } as React.CSSProperties}
        >
          {after}
        </span>
      </span>
    </h1>
  );
}
