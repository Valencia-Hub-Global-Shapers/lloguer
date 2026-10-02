/** MyLloguer mark: a key with a house-shaped bow. Keep in sync with src/app/icon.svg. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="14" className="fill-primary" />
      <g fill="#fff">
        <path d="M19 24 32 10l13 14v9H19Z" />
        <rect x="29.5" y="32" width="5" height="24" rx="1.5" />
        <rect x="34" y="38" width="8" height="4.5" rx="1" />
        <rect x="34" y="46" width="6" height="4.5" rx="1" />
      </g>
      <circle cx="32" cy="25" r="4" className="fill-primary" />
    </svg>
  );
}
