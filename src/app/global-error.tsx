"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Georgia, serif", background: "#ffffff", color: "#0d1f3c", padding: "4rem 1.5rem" }}>
        <h1 style={{ fontWeight: 400 }}>Something went wrong.</h1>
        <p>Please refresh the page or try again shortly.</p>
        <button onClick={reset} style={{ marginTop: 16, padding: "10px 20px", background: "#0d1f3c", color: "#ffffff", border: 0 }}>Try again</button>
      </body>
    </html>
  );
}
