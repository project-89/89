"use client";

// No imports needed for this super simple page

export const dynamic = "force-dynamic"; // Good practice for test pages

export default function PingPage() {
  return (
    <div
      style={{
        padding: "50px",
        fontFamily: "sans-serif",
        fontSize: "24px",
        textAlign: "center",
      }}
    >
      <h1>Ping!</h1>
      <p>If you see this, the /ping page loaded directly.</p>
      <p>Current timestamp: {new Date().toISOString()}</p>
      <a href="/">Go to Homepage</a>
    </div>
  );
}
