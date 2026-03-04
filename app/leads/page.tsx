"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";

type Lead = {
  id: string;
  title: string;
  status: string;
  qualification_score: number | null;
  company_email: string | null;
  decision_maker_email: string | null;
  updated_at: string;
};

export default function LeadsPage(): ReactElement {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLeads(): Promise<void> {
    setLoading(true);
    try {
      const response = await fetch("/api/leads/list", { cache: "no-store" });
      const payload = await response.json();
      setLeads(payload.leads ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLeads();
  }, []);

  const highIntent = useMemo(
    () => leads.filter((lead) => (lead.qualification_score ?? 0) >= 70).length,
    [leads]
  );

  return (
    <div className="page-grid">
      <div className="card">
        <h2>Lead Inventory</h2>
        <p>{loading ? "Loading leads..." : `${leads.length} leads loaded • ${highIntent} high-intent`}</p>
        <button onClick={() => void loadLeads()} disabled={loading}>
          Refresh
        </button>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Status</th>
              <th>Score</th>
              <th>Email</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.title}</td>
                <td>{lead.status}</td>
                <td>{lead.qualification_score ?? "-"}</td>
                <td>{lead.decision_maker_email ?? lead.company_email ?? "-"}</td>
                <td>{new Date(lead.updated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
