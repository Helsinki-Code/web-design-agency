"use client";

import { useState } from "react";
import type { ReactElement } from "react";

interface RunResult {
  [key: string]: unknown;
}

export default function HomePage(): ReactElement {
  const [objective, setObjective] = useState(
    "Find service businesses in the United States with weak website UX, weak visual trust, and reachable decision maker contact information."
  );
  const [result, setResult] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function run(mode: "full" | "discovery" | "qualification" | "outreach"): Promise<void> {
    setLoading(true);
    setResult(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/automation/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${prompt("Enter automation shared secret") ?? ""}`
        },
        body: JSON.stringify({ mode, objective })
      });
      const raw = await response.text();
      const data = raw ? (JSON.parse(raw) as RunResult) : {};

      if (!response.ok) {
        const error = typeof data.error === "string" ? data.error : `Request failed with status ${response.status}`;
        setErrorMessage(error);
        setResult(data);
        return;
      }

      setResult(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to run automation";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-grid">
      <div className="card hero">
        <h2>Autonomous Agency Runtime</h2>
        <p>
          Discover weak websites, qualify intent, send personalized outreach, close with preview + invoice, and push paid clients into delivery.
        </p>
        <textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={5} />
        <div className="actions">
          <button onClick={() => run("full")} disabled={loading}>
            Run Full Cycle
          </button>
          <button onClick={() => run("discovery")} disabled={loading}>
            Discovery
          </button>
          <button onClick={() => run("qualification")} disabled={loading}>
            Qualification
          </button>
          <button onClick={() => run("outreach")} disabled={loading}>
            Outreach
          </button>
        </div>
      </div>

      <div className="card output">
        <h3>Latest Run Output</h3>
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        <pre>{result ? JSON.stringify(result, null, 2) : "No run has been executed yet."}</pre>
      </div>
    </div>
  );
}
