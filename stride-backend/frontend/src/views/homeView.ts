import { isLoggedIn } from '../auth';

// Inline SVG icons (Feather-style, stroke follows currentColor).
// Add or swap icons here rather than reaching for emoji — they render
// consistently across platforms and pick up the theme colour.
const SVG_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const icons = {
  bolt:   `<svg ${SVG_ATTRS}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  fx:     `<svg ${SVG_ATTRS}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  globe:  `<svg ${SVG_ATTRS}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  unlock: `<svg ${SVG_ATTRS}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
};

export function renderHomeView(container: HTMLElement): void {
  if (isLoggedIn()) {
    renderDashboardHome(container);
  } else {
    renderPublicHome(container);
  }
}

function renderDashboardHome(container: HTMLElement): void {
  container.innerHTML = `
    <div class="home-logged-in">
      <div class="home-hero-band">
        <h1 class="home-hero-title">Send money home.</h1>
        <h1 class="home-hero-title home-hero-title-warm">Wherever home is.</h1>
        <p class="home-hero-body">
          Move money across borders in seconds.<br />
          Live exchange rates, no hidden fees, built on open standards.
        </p>
        <div class="home-hero-cta-row">
          <a href="#/remit"   class="btn btn-africa-primary">Send money →</a>
          <a href="#/history" class="btn btn-secondary">View history</a>
        </div>
      </div>

      <div class="home-pillars">
        <div class="home-pillar">
          <span class="home-pillar-icon">${icons.bolt}</span>
          <div>
            <div class="home-pillar-label">Instant settlement</div>
            <div class="home-pillar-text">Transfers settle in real time — the money is there when it's needed.</div>
          </div>
        </div>
        <div class="home-pillar">
          <span class="home-pillar-icon">${icons.fx}</span>
          <div>
            <div class="home-pillar-label">Fair exchange rates</div>
            <div class="home-pillar-text">Live FX quotes before you commit. ZAR, KES, NGN, GHS and more.</div>
          </div>
        </div>
        <div class="home-pillar">
          <span class="home-pillar-icon">${icons.unlock}</span>
          <div>
            <div class="home-pillar-label">Open by design</div>
            <div class="home-pillar-text">Built on the Interledger Open Payments standard.</div>
          </div>
        </div>
      </div>

      <div class="home-proverb-band">
        <p class="home-proverb">"People lie, money tells the truth."</p>
      </div>
    </div>
  `;
}

function renderPublicHome(container: HTMLElement): void {
  container.innerHTML = `
    <div class="card hero">
      <div class="hero-africa-tag">${icons.globe} Pan-African remittances</div>
      <h1>Send money home</h1>
      <p class="hero-sub">
        Fast, fair, and open — powered by the Interledger Protocol.
        Live exchange rates across Africa and beyond.
      </p>
      <div class="hero-actions">
        <a href="#/signup" class="btn btn-primary">Create account</a>
        <a href="#/login"  class="btn btn-secondary">Log in</a>
      </div>
      <div class="hero-features">
        <div class="feature">
          <span class="feature-icon">${icons.bolt}</span>
          <span>Real-time transfers</span>
        </div>
        <div class="feature">
          <span class="feature-icon">${icons.fx}</span>
          <span>Live FX rates</span>
        </div>
        <div class="feature">
          <span class="feature-icon">${icons.globe}</span>
          <span>Pan-African reach</span>
        </div>
      </div>
    </div>
  `;
}
