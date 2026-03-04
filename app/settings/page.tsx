import type { ReactElement } from "react";

export default function SettingsPage(): ReactElement {
  return (
    <div className="page-grid">
      <div className="card">
        <h2>Runtime Integrations</h2>
        <ul>
          <li>Supabase: data persistence and workflow state.</li>
          <li>Parallel FindAll/Search/Extract/Task: lead research and enrichment.</li>
          <li>OpenAI: qualification, copy generation, and dynamic logs.</li>
          <li>Resend: outreach email sending.</li>
          <li>Stripe, WhatsApp, Telegram: invoicing and client success channels.</li>
        </ul>
      </div>
      <div className="card">
        <h3>Security</h3>
        <p>
          Keep all credentials in server-side environment variables. Use the automation shared secret for scheduled pipeline calls.
        </p>
      </div>
    </div>
  );
}
