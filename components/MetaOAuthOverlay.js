'use client';

import { useState } from 'react';
import { MERCHANT_MOCK } from '../lib/merchantMock';

// Renders a simulated Meta/Facebook OAuth consent screen as a full-viewport
// overlay on top of this same page — no new tab/window. Deliberately styled
// with Meta's own look (not our Seller Platform purple theme), scoped under
// the meta-oauth-* classes so it never inherits our app's button/card styles.
// onContinue is expected to call MetaMockAPI.connect() and resolve — this
// component only controls what the merchant sees before that resolves.
export default function MetaOAuthOverlay({ onContinue, onCancel }) {
  const [connecting, setConnecting] = useState(false);

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onCancel();
  }

  async function handleContinue() {
    setConnecting(true);
    await onContinue();
  }

  return (
    <div className="meta-oauth-overlay" onClick={handleBackdropClick}>
      <div className="meta-oauth-card">
        <div className="meta-oauth-topbar">
          <span className="meta-oauth-logo">
            <svg viewBox="0 0 36 36" width="28" height="28" fill="none">
              <path d="M9 18c0-4 2-9 6-9 3 0 4.5 2.3 6 5 1.5-2.7 3-5 6-5 4 0 6 5 6 9s-2 9-6 9c-3 0-4.5-2.3-6-5-1.5 2.7-3 5-6 5-4 0-6-5-6-9Z" stroke="#0866FF" strokeWidth="2.6" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="meta-oauth-refresh">⇄</span>
          <span className="meta-oauth-skeleton" />
          <span className="meta-oauth-topbar-right">
            <span className="meta-oauth-avatar">
              🙂<span className="meta-oauth-fbadge">f</span>
            </span>
            <span className="meta-oauth-chevron">▾</span>
          </span>
        </div>
        <div className="meta-oauth-progress" />
        <div className="meta-oauth-body">
          <div className="meta-oauth-top">
            <h2 className="meta-oauth-title">Continue as {MERCHANT_MOCK.name}?</h2>
            <p className="meta-oauth-desc">
              You&apos;ve previously linked ShiprocketAds to Facebook. Would you like to continue with your previous settings?
            </p>
            <div className="meta-oauth-actions">
              <button type="button" className="meta-btn-secondary" onClick={onCancel}>Edit settings</button>
              <button type="button" className="meta-btn-primary" disabled={connecting} onClick={handleContinue}>
                {connecting ? 'Connecting…' : 'Continue'}
              </button>
            </div>
            <p className="meta-oauth-switch">
              Not {MERCHANT_MOCK.name}? <a href="#" onClick={(e) => e.preventDefault()}>Log in to another account</a>
            </p>
          </div>
          <div className="meta-oauth-spacer" />
          <div className="meta-oauth-bottom">
            <p className="meta-oauth-disclaimer">
              By continuing, ShiprocketAds will receive ongoing access to the information you share and Meta will record
              when ShiprocketAds accesses it. <a href="#" onClick={(e) => e.preventDefault()}>Learn more</a> about this sharing and
              the settings you have.
            </p>
            <div className="meta-oauth-divider" />
            <p className="meta-oauth-footer">
              ShiprocketAds&apos;s <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a> and{' '}
              <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            </p>
          </div>
        </div>
      </div>
      <div className="meta-oauth-tag">Simulated Meta login — prototype only, no real Meta account is contacted</div>
    </div>
  );
}
