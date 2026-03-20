/**
 * racoon-roomba-card.js — Custom Lovelace card for the ha-roomba-custom integration
 *
 * Installation:
 *   1. Copy this file to /config/www/racoon-roomba-card.js
 *   2. In HA: Settings → Dashboards → Resources → Add Resource
 *      URL: /local/racoon-roomba-card.js   Type: JavaScript module
 *   3. Add a Manual card to your dashboard with:
 *      type: custom:racoon-roomba-card
 *      entity: vacuum.roomba          # required
 *      name: Roomba                   # optional
 *      battery_entity: sensor.roomba_battery           # optional
 *      bin_entity: binary_sensor.roomba_bin_full       # optional
 *      stuck_entity: binary_sensor.roomba_stuck        # optional
 *      mission_time_entity: sensor.roomba_mission_time # optional
 *      area_entity: sensor.roomba_area_cleaned         # optional
 */

const STYLES = `
  :host { display: block; }
  ha-card {
    padding: 0;
    overflow: hidden;
    font-family: var(--primary-font-family, sans-serif);
  }

  /* ── Header: name+conn on top row, pills stacked below right ── */
  .rc-header {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    padding: 8px 14px 0;
    gap: 6px;
    cursor: pointer;
  }
  .rc-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--secondary-text-color);
    letter-spacing: 0.04em;
    padding-top: 2px;
  }
  /* Right column: stacked pills */
  .rc-header-pills {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    flex-shrink: 0;
  }

  /* ── Main row: robot left, info right ── */
  .rc-body {
    padding: 8px 14px 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 14px;
  }

  /* Robot circle */
  .rc-robot-wrap {
    position: relative;
    flex-shrink: 0;
    width: 90px; height: 90px;
  }
  .rc-ring {
    position: absolute; inset: 0;
    border-radius: 50%;
    box-sizing: border-box;
  }
  .rc-ring-bg {
    border: 3px solid var(--divider-color, rgba(0,0,0,0.12));
  }
  .rc-ring-active {
    border: 3px solid transparent;
    transition: border-color 0.4s;
  }
  .rc-ring-active.cleaning {
    border-top-color: var(--success-color, #1D9E75);
    border-right-color: var(--success-color, #1D9E75);
    animation: rc-spin 1.4s linear infinite;
  }
  .rc-ring-active.returning {
    border-top-color: var(--warning-color, #BA7517);
    border-right-color: var(--warning-color, #BA7517);
    animation: rc-spin 2s linear infinite;
  }
  .rc-ring-active.error {
    border-top-color: var(--error-color, #E24B4A);
    border-right-color: var(--error-color, #E24B4A);
    animation: rc-flash 0.8s ease-in-out infinite;
  }
  .rc-ring-active.docked {
    border-color: var(--info-color, #378ADD);
  }
  .rc-ring-active.paused {
    border-top-color: var(--disabled-text-color, #888780);
    border-right-color: var(--disabled-text-color, #888780);
  }
  @keyframes rc-spin  { to { transform: rotate(360deg); } }
  @keyframes rc-flash { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
  @keyframes rc-icon-clean {
    0%   { transform: rotate(0deg)   scale(1);    opacity: 1;    }
    25%  { transform: rotate(90deg)  scale(1.13); opacity: 0.78; }
    50%  { transform: rotate(180deg) scale(1);    opacity: 1;    }
    75%  { transform: rotate(270deg) scale(1.13); opacity: 0.78; }
    100% { transform: rotate(360deg) scale(1);    opacity: 1;    }
  }
  .rc-robot-inner {
    position: absolute; inset: 7px;
    border-radius: 50%;
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    cursor: default;
  }
  #rc-robot-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    transform-origin: center center;
    transition: opacity 0.4s;
  }
  #rc-robot-icon.cleaning {
    animation: rc-icon-clean 2.8s ease-in-out infinite;
  }
  .rc-state-lbl {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    transition: color 0.3s;
  }
  .rc-state-cleaning  { color: var(--success-color, #1D9E75); }
  .rc-state-docked    { color: var(--info-color, #378ADD); }
  .rc-state-returning { color: var(--warning-color, #BA7517); }
  .rc-state-paused    { color: var(--secondary-text-color); }
  .rc-state-error     { color: var(--error-color, #E24B4A); }
  .rc-state-idle      { color: var(--disabled-text-color); }

  /* Info column (right of robot) */
  .rc-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .rc-info-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .rc-metric {
    display: flex; flex-direction: column;
    gap: 1px;
  }
  .rc-metric-val {
    font-size: 16px; font-weight: 500;
    color: var(--primary-text-color);
    line-height: 1;
  }
  .rc-metric-lbl {
    font-size: 9px;
    color: var(--disabled-text-color);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .rc-metric-divider {
    width: 1px; height: 28px;
    background: var(--divider-color, rgba(0,0,0,0.1));
    flex-shrink: 0;
  }
  .rc-battery-wrap {
    display: flex; flex-direction: column; gap: 3px;
    flex: 1;
  }
  .rc-battery-top {
    display: flex; align-items: center; justify-content: space-between;
  }
  .rc-battery-lbl {
    font-size: 9px;
    color: var(--disabled-text-color);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .rc-battery-pct {
    font-size: 12px; font-weight: 500;
    color: var(--primary-text-color);
  }
  .rc-battery-bar {
    width: 100%; height: 5px;
    background: var(--divider-color, rgba(0,0,0,0.12));
    border-radius: 3px; overflow: hidden;
  }
  .rc-battery-fill {
    height: 100%; border-radius: 3px;
    transition: width 0.4s, background 0.4s;
  }

  /* ── Divider ── */
  .rc-divider {
    margin: 8px 14px 0;
    height: 1px;
    background: var(--divider-color, rgba(0,0,0,0.08));
  }

  /* ── Bottom bar: buttons only ── */
  .rc-bottom-bar {
    display: flex;
    align-items: center;
    padding: 6px 10px 10px;
  }
  /* ── Round control buttons ── */
  .rc-buttons {
    display: flex;
    justify-content: space-around;
    flex: 1;
    gap: 0;
  }

  .rc-pill {
    font-size: 9px; padding: 2px 7px;
    border-radius: 20px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-weight: 600;
    border: 1px solid;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .rc-pill-ok   { background: var(--secondary-background-color); color: var(--disabled-text-color); border-color: var(--divider-color); }
  .rc-pill-conn { background: rgba(29,158,117,0.12); color: var(--success-color, #1D9E75); border-color: var(--success-color, #1D9E75); }
  .rc-pill-offline { background: rgba(226,75,74,0.1); color: var(--error-color, #E24B4A); border-color: var(--error-color, #E24B4A); }
  .rc-pill-warn { background: #FAEEDA; color: #633806; border-color: #EF9F27; }
  .rc-pill-bad  { background: #FCEBEB; color: #791F1F; border-color: #E24B4A; }
  .rc-btn {
    width: 46px; height: 46px;
    border-radius: 50%;
    border: 1px solid var(--divider-color, rgba(0,0,0,0.15));
    background: var(--secondary-background-color, #f5f5f5);
    color: var(--primary-text-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.12s, transform 0.1s, box-shadow 0.12s;
    font-family: inherit;
    padding: 0;
  }
  .rc-btn:hover {
    background: var(--divider-color, rgba(0,0,0,0.1));
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }
  .rc-btn:active  { transform: scale(0.91); }
  .rc-btn[disabled] { opacity: 0.35; cursor: not-allowed; }
  .rc-btn.rc-btn-locate { color: var(--info-color, #378ADD); }
  .rc-btn svg { width: 18px; height: 18px; flex-shrink: 0; }

  .rc-unavail {
    padding: 20px 16px;
    text-align: center;
    color: var(--disabled-text-color);
    font-size: 13px;
  }
`;

const SVG = {
  start:  `<svg viewBox="0 0 16 16"><polygon points="4,2 13,8 4,14" fill="currentColor"/></svg>`,
  pause:  `<svg viewBox="0 0 16 16"><rect x="3" y="2" width="4" height="12" rx="1" fill="currentColor"/><rect x="9" y="2" width="4" height="12" rx="1" fill="currentColor"/></svg>`,
  dock:   `<svg viewBox="0 0 16 16"><path d="M3 13h10M8 3v8M5 7l3 4 3-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  stop:   `<svg viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor"/></svg>`,
  locate: `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 1v3M8 12v3M1 8h3M12 8h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

const ROBOT_SVG = `<span id="rc-robot-icon"><svg width="36" height="36" viewBox="0 0 36 36" fill="none">
  <circle cx="18" cy="18" r="14" fill="none" stroke="var(--divider-color,rgba(0,0,0,0.2))" stroke-width="1.2"/>
  <circle cx="18" cy="18" r="8" fill="var(--divider-color,rgba(0,0,0,0.1))"/>
  <circle cx="18" cy="18" r="3" fill="var(--secondary-text-color,#888)"/>
  <circle cx="18" cy="9"  r="2" fill="var(--secondary-text-color,#888)" opacity="0.6"/>
  <rect x="8"  y="22" width="4" height="2" rx="1" fill="var(--secondary-text-color,#888)" opacity="0.5"/>
  <rect x="24" y="22" width="4" height="2" rx="1" fill="var(--secondary-text-color,#888)" opacity="0.5"/>
</svg></span>`;

// Map HA vacuum states → display info
function getStateInfo(state) {
  const map = {
    cleaning:  { ring: 'cleaning',  label: 'Cleaning',  cls: 'rc-state-cleaning'  },
    docked:    { ring: 'docked',    label: 'Docked',    cls: 'rc-state-docked'    },
    returning: { ring: 'returning', label: 'Returning', cls: 'rc-state-returning' },
    paused:    { ring: 'paused',    label: 'Paused',    cls: 'rc-state-paused'    },
    idle:      { ring: 'idle',      label: 'Idle',      cls: 'rc-state-idle'      },
    error:     { ring: 'error',     label: 'Stuck!',    cls: 'rc-state-error'     },
    unavailable: { ring: '', label: 'Unavailable', cls: 'rc-state-idle' },
    unknown:     { ring: '', label: 'Unknown',     cls: 'rc-state-idle' },
  };
  return map[state] || { ring: 'idle', label: state, cls: 'rc-state-idle' };
}

class RacoonRoombaCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass   = null;
    this._built  = false;
  }

  setConfig(config) {
    if (!config.entity) throw new Error('racoon-roomba-card: "entity" is required (e.g. entity: vacuum.roomba)');
    this._config = {
      entity:              config.entity,
      name:                config.name || 'Roomba',
      battery_entity:      config.battery_entity      || null,
      bin_entity:          config.bin_entity           || null,
      stuck_entity:        config.stuck_entity         || null,
      mission_time_entity: config.mission_time_entity  || null,
      area_entity:         config.area_entity          || null,
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) {
      this._build();
      this._built = true;
    }
    this._update();
  }

  _build() {
    const shadow = this.shadowRoot;
    shadow.innerHTML = `
      <style>${STYLES}</style>
      <ha-card>
        <div class="rc-header" id="rc-header">
          <span class="rc-title" id="rc-title">${this._config.name}</span>
          <div class="rc-header-pills">
            <span class="rc-pill rc-pill-conn" id="rc-conn-pill">Connected</span>
            <span class="rc-pill rc-pill-ok"   id="rc-bin-pill">Bin OK</span>
            <span class="rc-pill rc-pill-ok"   id="rc-stuck-pill">Not Stuck</span>
          </div>
        </div>
        <div id="rc-main">
          <div class="rc-body">
            <div class="rc-robot-wrap">
              <div class="rc-ring rc-ring-bg"></div>
              <div class="rc-ring rc-ring-active" id="rc-ring"></div>
              <div class="rc-robot-inner" id="rc-robot-inner">
                ${ROBOT_SVG}
                <span class="rc-state-lbl" id="rc-state-lbl">—</span>
              </div>
            </div>
            <div class="rc-info">
              <div class="rc-info-row">
                <div class="rc-metric">
                  <span class="rc-metric-val" id="rc-mssn">—</span>
                  <span class="rc-metric-lbl">Min</span>
                </div>
                <div class="rc-metric-divider"></div>
                <div class="rc-metric">
                  <span class="rc-metric-val" id="rc-sqft">—</span>
                  <span class="rc-metric-lbl">Sq ft</span>
                </div>
                <div class="rc-metric-divider"></div>
                <div class="rc-battery-wrap">
                  <div class="rc-battery-top">
                    <span class="rc-battery-lbl">Battery</span>
                    <span class="rc-battery-pct" id="rc-bat-pct">—</span>
                  </div>
                  <div class="rc-battery-bar">
                    <div class="rc-battery-fill" id="rc-bat-fill" style="width:0%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="rc-divider"></div>
          <div class="rc-bottom-bar">
            <div class="rc-buttons">
              <button class="rc-btn" id="rc-btn-start"  title="Start cleaning">${SVG.start}</button>
              <button class="rc-btn" id="rc-btn-pause"  title="Pause">${SVG.pause}</button>
              <button class="rc-btn" id="rc-btn-dock"   title="Return to dock">${SVG.dock}</button>
              <button class="rc-btn" id="rc-btn-stop"   title="Stop">${SVG.stop}</button>
              <button class="rc-btn rc-btn-locate" id="rc-btn-locate" title="Locate (beep)">${SVG.locate}</button>
            </div>
          </div>
        </div>
      </ha-card>
    `;

    // Wire up buttons
    const call = (svc, data = {}) => {
      if (!this._hass) return;
      this._hass.callService('vacuum', svc, { entity_id: this._config.entity, ...data });
    };

    shadow.getElementById('rc-btn-start') .addEventListener('click', () => call('start'));
    shadow.getElementById('rc-btn-pause') .addEventListener('click', () => call('pause'));
    shadow.getElementById('rc-btn-dock')  .addEventListener('click', () => call('return_to_base'));
    shadow.getElementById('rc-btn-stop')  .addEventListener('click', () => call('stop'));
    shadow.getElementById('rc-btn-locate').addEventListener('click', () => call('locate'));

    // Tap header → open HA more-info dialog
    shadow.getElementById('rc-header').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('hass-more-info', {
        detail: { entityId: this._config.entity },
        bubbles: true,
        composed: true,
      }));
    });
  }

  _update() {
    const hass   = this._hass;
    const cfg    = this._config;
    const shadow = this.shadowRoot;
    const vacuum = hass.states[cfg.entity];

    if (!vacuum) return;

    const state      = vacuum.state;
    const attrs      = vacuum.attributes || {};
    const info       = getStateInfo(state);
    const available  = state !== 'unavailable';

    // Connection pill
    const connPill = shadow.getElementById('rc-conn-pill');
    connPill.className   = 'rc-pill ' + (available ? 'rc-pill-conn' : 'rc-pill-offline');
    connPill.textContent = available ? 'Connected' : 'Offline';

    // Ring + state label
    shadow.getElementById('rc-ring').className      = 'rc-ring rc-ring-active ' + (info.ring || '');
    const icon = shadow.getElementById('rc-robot-icon'); if (icon) icon.className = state === 'cleaning' ? 'cleaning' : '';
    const lbl = shadow.getElementById('rc-state-lbl');
    lbl.className   = 'rc-state-lbl ' + info.cls;
    lbl.textContent = info.label;

    // Battery
    const batEnt  = cfg.battery_entity ? hass.states[cfg.battery_entity] : null;
    const batPct  = batEnt ? parseInt(batEnt.state) : attrs.battery_level;
    const batEl   = shadow.getElementById('rc-bat-fill');
    if (batPct != null && !isNaN(batPct)) {
      shadow.getElementById('rc-bat-pct').textContent  = batPct + '%';
      batEl.style.width      = batPct + '%';
      batEl.style.background = batPct > 50
        ? 'var(--success-color, #1D9E75)'
        : batPct > 20
          ? 'var(--warning-color, #BA7517)'
          : 'var(--error-color, #E24B4A)';
    } else {
      shadow.getElementById('rc-bat-pct').textContent = '—';
    }

    // Mission time
    const mssnEnt = cfg.mission_time_entity ? hass.states[cfg.mission_time_entity] : null;
    shadow.getElementById('rc-mssn').textContent =
      mssnEnt ? mssnEnt.state : (attrs.mission_minutes ?? '—');

    // Sqft
    const areaEnt = cfg.area_entity ? hass.states[cfg.area_entity] : null;
    shadow.getElementById('rc-sqft').textContent =
      areaEnt ? areaEnt.state : (attrs.sqft_cleaned ?? '—');

    // Bin full
    const binEnt = cfg.bin_entity ? hass.states[cfg.bin_entity] : null;
    const binFull = binEnt ? binEnt.state === 'on' : attrs.bin_full;
    const binPill = shadow.getElementById('rc-bin-pill');
    binPill.className   = 'rc-pill ' + (binFull ? 'rc-pill-warn' : 'rc-pill-ok');
    binPill.textContent = binFull ? 'Bin Full' : 'Bin OK';

    // Stuck
    const stuckEnt = cfg.stuck_entity ? hass.states[cfg.stuck_entity] : null;
    const stuck    = stuckEnt ? stuckEnt.state === 'on' : state === 'error';
    const stuckPill = shadow.getElementById('rc-stuck-pill');
    stuckPill.className   = 'rc-pill ' + (stuck ? 'rc-pill-bad' : 'rc-pill-ok');
    stuckPill.textContent = stuck ? 'Stuck!' : 'Not Stuck';

    // Disable buttons when unavailable
    ['start','pause','dock','stop','locate'].forEach(id => {
      const btn = shadow.getElementById('rc-btn-' + id);
      if (btn) btn.disabled = !available;
    });
  }

  getCardSize() { return 4; }

  static getConfigElement() {
    return document.createElement('racoon-roomba-card-editor');
  }

  static getStubConfig() {
    return { entity: 'vacuum.roomba', name: 'Roomba' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual Editor
// ─────────────────────────────────────────────────────────────────────────────

const EDITOR_STYLES = `
  .container {
    display: flex; flex-direction: column; gap: 20px;
    padding: 12px;
    color: var(--primary-text-color);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  /* Section titles */
  .section-title {
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #888; margin-bottom: 2px;
  }

  /* Card blocks */
  .card-block {
    background: var(--card-background-color);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; overflow: hidden;
  }

  /* Text inputs */
  .text-row {
    padding: 12px 16px; display: flex; flex-direction: column; gap: 6px;
  }
  .text-row label { font-size: 14px; font-weight: 500; }
  .text-row .hint { font-size: 11px; color: #888; margin-top: -2px; }
  input[type="text"] {
    width: 100%; box-sizing: border-box;
    background: var(--card-background-color);
    color: var(--primary-text-color);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px; padding: 10px 12px; font-size: 14px;
  }
  input[type="text"]:focus { outline: none; border-color: #007AFF; }

  /* Select dropdowns */
  .select-row {
    padding: 12px 16px; display: flex; flex-direction: column; gap: 6px;
  }
  .select-row label { font-size: 14px; font-weight: 500; }
  .select-row .hint { font-size: 11px; color: #888; margin-top: -2px; }
  .select-row + .select-row {
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  select {
    width: 100%;
    background: var(--card-background-color);
    color: var(--primary-text-color);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px; padding: 10px 12px; font-size: 14px;
    cursor: pointer; -webkit-appearance: none; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center;
    padding-right: 32px;
  }
  select:focus { outline: none; border-color: #007AFF; }

  /* Toggle rows */
  .toggle-list { display: flex; flex-direction: column; }
  .toggle-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    min-height: 52px;
  }
  .toggle-item:last-child { border-bottom: none; }
  .toggle-label { font-size: 14px; font-weight: 500; flex: 1; padding-right: 12px; }
  .toggle-desc  { font-size: 11px; color: #888; margin-top: 2px; }

  /* iOS toggle switch */
  .toggle-switch { position: relative; width: 51px; height: 31px; flex-shrink: 0; }
  .toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
  .toggle-track {
    position: absolute; inset: 0; border-radius: 31px;
    background: rgba(120,120,128,0.32); cursor: pointer;
    transition: background 0.25s ease;
  }
  .toggle-track::after {
    content: ''; position: absolute;
    width: 27px; height: 27px; border-radius: 50%;
    background: #fff; top: 2px; left: 2px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    transition: transform 0.25s ease;
  }
  .toggle-switch input:checked + .toggle-track { background: #34C759; }
  .toggle-switch input:checked + .toggle-track::after { transform: translateX(20px); }

  /* Required badge */
  .badge-required {
    display: inline-block;
    font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
    text-transform: uppercase;
    background: rgba(0,122,255,0.15); color: #007AFF;
    border: 1px solid rgba(0,122,255,0.3);
    border-radius: 4px; padding: 1px 5px;
    margin-left: 6px; vertical-align: middle;
  }
`;

class RacoonRoombaCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config      = {};
    this._hass        = null;
    this._initialized = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) this._render();
  }

  setConfig(config) {
    this._config = config;
    if (!this._initialized && this._hass) this._render();
    else if (this._initialized) this._syncUI();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _entitiesOf(prefix) {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter(e => e.startsWith(prefix + '.') && this._hass.states[e] != null)
      .sort();
  }

  _friendlyName(entityId) {
    return this._hass?.states[entityId]?.attributes?.friendly_name || entityId;
  }

  _optionList(prefix, noneLabel = '— none —') {
    return `<option value="">${noneLabel}</option>` +
      this._entitiesOf(prefix)
        .map(e => `<option value="${e}">${this._friendlyName(e)}</option>`)
        .join('');
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  _render() {
    if (!this._hass || !this._config) return;
    this._initialized = true;

    this.shadowRoot.innerHTML = `
      <style>${EDITOR_STYLES}</style>
      <div class="container">

        <!-- Card Name -->
        <div>
          <div class="section-title">Card</div>
          <div class="card-block">
            <div class="text-row">
              <label for="name">Display Name</label>
              <div class="hint">Shown in the card header</div>
              <input type="text" id="name" placeholder="Roomba" value="${this._config.name || ''}">
            </div>
          </div>
        </div>

        <!-- Primary Entity -->
        <div>
          <div class="section-title">Vacuum Entity <span class="badge-required">Required</span></div>
          <div class="card-block">
            <div class="select-row">
              <label for="entity">Vacuum</label>
              <div class="hint">The main vacuum entity from ha-roomba-custom</div>
              <select id="entity">
                <option value="">— select vacuum —</option>
                ${this._entitiesOf('vacuum')
                  .map(e => `<option value="${e}">${this._friendlyName(e)}</option>`)
                  .join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Optional Sensor Entities -->
        <div>
          <div class="section-title">Optional Sensors</div>
          <div class="card-block">
            <div class="select-row">
              <label for="battery_entity">Battery Level</label>
              <div class="hint">sensor.* — overrides built-in battery attribute</div>
              <select id="battery_entity">
                ${this._optionList('sensor')}
              </select>
            </div>
            <div class="select-row">
              <label for="mission_time_entity">Mission Time</label>
              <div class="hint">sensor.* — minutes elapsed during current clean</div>
              <select id="mission_time_entity">
                ${this._optionList('sensor')}
              </select>
            </div>
            <div class="select-row">
              <label for="area_entity">Area Cleaned</label>
              <div class="hint">sensor.* — square feet / metres cleaned this run</div>
              <select id="area_entity">
                ${this._optionList('sensor')}
              </select>
            </div>
          </div>
        </div>

        <!-- Optional Binary Sensors -->
        <div>
          <div class="section-title">Optional Binary Sensors</div>
          <div class="card-block">
            <div class="select-row">
              <label for="bin_entity">Bin Full</label>
              <div class="hint">binary_sensor.* — shows Bin Full warning pill when on</div>
              <select id="bin_entity">
                ${this._optionList('binary_sensor')}
              </select>
            </div>
            <div class="select-row">
              <label for="stuck_entity">Robot Stuck</label>
              <div class="hint">binary_sensor.* — shows Stuck! warning pill when on</div>
              <select id="stuck_entity">
                ${this._optionList('binary_sensor')}
              </select>
            </div>
          </div>
        </div>

      </div>
    `;

    this._syncUI();
    this._attachListeners();
  }

  // ── Sync selects/inputs to current config ─────────────────────────────────

  _syncUI() {
    const root = this.shadowRoot;
    if (!root) return;

    const set = (id, val) => {
      const el = root.getElementById(id);
      if (el) el.value = val || '';
    };

    set('name',                this._config.name);
    set('entity',              this._config.entity);
    set('battery_entity',      this._config.battery_entity);
    set('mission_time_entity', this._config.mission_time_entity);
    set('area_entity',         this._config.area_entity);
    set('bin_entity',          this._config.bin_entity);
    set('stuck_entity',        this._config.stuck_entity);
  }

  // ── Event wiring ───────────────────────────────────────────────────────────

  _attachListeners() {
    const root = this.shadowRoot;

    const wire = (id, key, transform) => {
      const el = root.getElementById(id);
      if (!el) return;
      const evt = el.tagName === 'INPUT' ? 'input' : 'change';
      el.addEventListener(evt, () => {
        const raw = el.value.trim();
        this._set(key, transform ? transform(raw) : raw);
      });
    };

    wire('name',                'name');
    wire('entity',              'entity');
    wire('battery_entity',      'battery_entity',      v => v || null);
    wire('mission_time_entity', 'mission_time_entity', v => v || null);
    wire('area_entity',         'area_entity',         v => v || null);
    wire('bin_entity',          'bin_entity',          v => v || null);
    wire('stuck_entity',        'stuck_entity',        v => v || null);
  }

  _set(key, value) {
    const newConfig = { ...this._config, [key]: value };
    // Remove null/empty optional keys to keep YAML tidy
    if (value === null || value === '') delete newConfig[key];
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    }));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────────────────────────────────────

if (!customElements.get('racoon-roomba-card')) {
  customElements.define('racoon-roomba-card', RacoonRoombaCard);
}
if (!customElements.get('racoon-roomba-card-editor')) {
  customElements.define('racoon-roomba-card-editor', RacoonRoombaCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type:        'racoon-roomba-card',
  name:        'Racoon Roomba Card',
  description: 'Control card for the ha-roomba-custom integration',
  preview:     false,
});
