'use client';

import { useEffect, useRef, useState } from 'react';
import { MERCHANT_MOCK } from '../lib/merchantMock';

// Simple outline icon set (stroke = currentColor) to match the ShiprocketAds
// admin sidebar's icon style. Kept as a lookup map so each nav item just
// references a key instead of embedding raw SVG markup inline everywhere.
const SB_ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"/></svg>',
  message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.1-3.6A7.96 7.96 0 0 1 4 12Z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="M4 15.5 9.5 10l3.5 3 6-7"/><path d="M15.5 6h3.5v3.5"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.9V16h5v-.2c0-.75.4-1.45 1-1.9A6 6 0 0 0 12 3Z"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h6"/></svg>',
  audit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M9 3v2h6V3"/><path d="m9.5 13 1.5 1.5L14.5 11"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3 10h18"/><path d="M7 14.5h4"/></svg>',
  coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><text x="12" y="16.3" text-anchor="middle" font-size="11" font-weight="700" font-family="-apple-system, Helvetica, Arial, sans-serif" fill="currentColor" stroke="none">₹</text></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17.5a4 4 0 0 1-1-7.9 5 5 0 0 1 9.6-2 4.5 4.5 0 0 1 1.4 8.9"/><path d="M12 19v-7"/><path d="m9 14.5 3-3 3 3"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  sidebarToggle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h16"/><path d="M16.5 9.5 13.5 12l3 2.5"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a8 8 0 1 1-5.3 2.1"/><path d="M12 2v5"/></svg>'
};

// Only items marked `functional: true` actually navigate anywhere. Every other
// item is intentionally a visual-only affordance — it keeps the exact same
// hover/cursor/active styling as a real link, but clicking it does nothing.
// This mirrors the real Seller Platform's full menu while only the Meta Ad
// Account Recharge flow is actually built.
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'chatbot', label: 'Chat Bot', icon: 'message' },
  { id: 'campaigns', label: 'Campaigns', icon: 'chart' },
  { id: 'recommendation', label: 'Recommendation', icon: 'bulb' },
  { id: 'fox-ai', label: 'Fox AI', icon: 'file' },
  {
    id: 'audit', label: 'Audit', icon: 'audit', group: true, collapsible: true,
    children: [
      { id: 'audit-meta', label: 'Meta' },
      { id: 'audit-google', label: 'Google' },
      { id: 'audit-generated-reports', label: 'Generated Reports' }
    ]
  },
  {
    id: 'finance', label: 'Finance', icon: 'card', group: true, collapsible: true,
    children: [
      { id: 'finance-payments', label: 'Payments' },
      { id: 'finance-digital-marketing', label: 'Digital Marketing Charges' },
      { id: 'finance-ledger', label: 'Ledger Management' }
    ]
  },
  {
    id: 'recharge', label: 'Recharge', icon: 'coin', group: true, collapsible: true,
    children: [
      { id: 'recharge-meta-ad-account', label: 'Meta Ad Account', href: '/', functional: true }
    ]
  },
  { id: 'file-uploads', label: 'File Uploads', icon: 'upload' }
];

function Icon({ name }) {
  return <span className="ic" dangerouslySetInnerHTML={{ __html: SB_ICONS[name] }} />;
}

export default function Sidebar({ activeId }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = {};
    NAV_ITEMS.forEach((item) => {
      if (item.group) initial[item.id] = item.children.some((c) => c.id === activeId);
    });
    return initial;
  });
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const footerWrapRef = useRef(null);

  // Collapse state lives in localStorage so it's consistent on revisits —
  // read after mount only, since localStorage isn't available during SSR.
  useEffect(() => {
    setCollapsed(localStorage.getItem('sb_collapsed') === '1');
  }, []);

  // Closed by default; clicking anywhere outside the profile row/menu closes it.
  useEffect(() => {
    function handleDocClick(e) {
      if (footerWrapRef.current && !footerWrapRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  function toggleGroup(groupId) {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sb_collapsed', next ? '1' : '0');
      return next;
    });
  }

  function toggleAccountMenu(e) {
    e.stopPropagation();
    setAccountMenuOpen((prev) => !prev);
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sb-logo">
        <span className="sb-logo-text">ShiprocketAds</span>
        <span className="sb-logo-short">S</span>
        <span className="dot">●</span>
        <button type="button" className="sb-toggle-btn" onClick={toggleCollapsed} aria-label="Toggle sidebar">
          <span dangerouslySetInnerHTML={{ __html: SB_ICONS.sidebarToggle }} />
        </button>
      </div>

      <div className="sb-section-label">MAIN MENU</div>

      <nav className="sb-nav">
        {NAV_ITEMS.map((item) => {
          if (item.group) {
            const groupActive = item.children.some((c) => c.id === activeId);
            const expanded = !!expandedGroups[item.id];

            if (item.collapsible) {
              return (
                <div className="sb-group" key={item.id}>
                  <div
                    className={`sb-item sb-item-toggle${groupActive ? ' active' : ''}`}
                    onClick={() => toggleGroup(item.id)}
                  >
                    <Icon name={item.icon} />
                    <span className="sb-item-label">{item.label}</span>
                    <span
                      className={`sb-chevron${expanded ? ' expanded' : ''}`}
                      dangerouslySetInnerHTML={{ __html: SB_ICONS.chevron }}
                    />
                  </div>
                  <div className={`sb-subitems collapsible${expanded ? ' expanded' : ''}`}>
                    {item.children.map((child) => {
                      const isActive = child.id === activeId;
                      const cls = `sb-subitem${isActive ? ' active' : ''}`;
                      return child.functional ? (
                        <a key={child.id} className={cls} href={child.href}>{child.label}</a>
                      ) : (
                        <div key={child.id} className={cls}>{child.label}</div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <div className="sb-group" key={item.id}>
                <div className={`sb-item${groupActive ? ' active' : ''}`}>
                  <Icon name={item.icon} />
                  <span className="sb-item-label">{item.label}</span>
                </div>
                <div className="sb-subitems">
                  {item.children.map((child) => {
                    const isActive = child.id === activeId;
                    const cls = `sb-subitem${isActive ? ' active' : ''}`;
                    return child.functional ? (
                      <a key={child.id} className={cls} href={child.href}>{child.label}</a>
                    ) : (
                      <div key={child.id} className={cls}>{child.label}</div>
                    );
                  })}
                </div>
              </div>
            );
          }
          const isActive = item.id === activeId;
          return (
            <div className={`sb-item${isActive ? ' active' : ''}`} key={item.id}>
              <Icon name={item.icon} />
              <span className="sb-item-label">{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Account menu: closed by default, toggled open/closed by clicking the
          profile row. Positioned absolutely within this wrapper so it floats
          neatly above the profile area in both expanded and collapsed mode. */}
      <div className="sb-footer-wrap" ref={footerWrapRef}>
        <div className={`sb-footer-menu${accountMenuOpen ? ' open' : ''}`}>
          <button type="button" className="sb-footer-menu-item">
            <span className="sb-footer-menu-icon" dangerouslySetInnerHTML={{ __html: SB_ICONS.logout }} />
            <span>Sign Out</span>
          </button>
        </div>
        <button type="button" className="sb-footer" onClick={toggleAccountMenu}>
          <div className="sb-avatar">{MERCHANT_MOCK.initials}</div>
          <div className="sb-footer-info">
            <div className="sb-footer-name">{MERCHANT_MOCK.name}</div>
            <div className="sb-footer-email">{MERCHANT_MOCK.email}</div>
          </div>
          <span
            className={`sb-footer-chevron${accountMenuOpen ? ' open' : ''}`}
            dangerouslySetInnerHTML={{ __html: SB_ICONS.chevron }}
          />
        </button>
      </div>
    </aside>
  );
}
