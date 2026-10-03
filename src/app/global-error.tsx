"use client";

/**
 * Root error boundary. Rendered outside the locale layout, so it cannot use
 * Tailwind classes or the i18n provider: plain inline styles on purpose.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <main
          style={{
            fontFamily: "system-ui, sans-serif",
            minHeight: "100dvh",
            display: "grid",
            placeItems: "center",
            background: "#faf7f0",
            color: "#1b1a17",
            padding: 24,
            textAlign: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Algo ha salido mal</h1>
            <p style={{ color: "#6b6559", fontSize: 14, marginBottom: 16 }}>
              Recarga la página o inténtalo de nuevo. / Something went wrong — reload and try
              again.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#d6521d",
                color: "#ffffff",
                border: "none",
                borderRadius: 3,
                padding: "10px 20px",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Reintentar / Retry
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
