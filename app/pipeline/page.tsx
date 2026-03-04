"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

export default function PipelinePage(): ReactElement {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    void fetch("/api/metrics", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        setCounts(payload.counts ?? {});
        setTotal(payload.total ?? 0);
      });
  }, []);

  return (
    <div className="page-grid">
      <div className="card">
        <h2>Pipeline Overview</h2>
        <p>{total} leads in lifecycle</p>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(counts).map(([status, count]) => (
              <tr key={status}>
                <td>{status}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
