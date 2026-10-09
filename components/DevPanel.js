'use client';

import { useState } from 'react';

export default function DevPanel({ onDisconnect, onReconnect, onScenario }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="dev-panel">
      <div className={`dev-box${open ? ' show' : ''}`}>
        <h4>Prototype Controls (dev only)</h4>
        <button className="dev-btn" onClick={onDisconnect}>Simulate: Not connected</button>
        <button className="dev-btn" onClick={onReconnect}>Simulate: Connected (reset accounts)</button>
        <div className="dev-label">Scenario — Aarogya 1 &lt;&gt; Shiprocket_BFRS</div>
        <button className="dev-btn" onClick={() => onScenario('critical')}>Critical (&lt;3 days)</button>
        <button className="dev-btn" onClick={() => onScenario('low')}>Low (3–7 days)</button>
        <button className="dev-btn" onClick={() => onScenario('neutral')}>Moderate (7–15 days)</button>
        <button className="dev-btn" onClick={() => onScenario('positive')}>Excellent (20+ days)</button>
        <button className="dev-btn" onClick={() => onScenario('zero-balance')}>Zero Balance (₹0)</button>
        <button className="dev-btn" onClick={() => onScenario('zero-spend')}>No Spend Yesterday</button>
        <button className="dev-btn" onClick={() => onScenario('no-history')}>No Spend Data</button>
        <button className="dev-btn" onClick={() => onScenario('very-high-spend')}>Very high spend</button>
      </div>
      <button className="dev-toggle" onClick={() => setOpen((v) => !v)}>⚙</button>
    </div>
  );
}
