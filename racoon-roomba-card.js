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
 */

const STYLES = `
  :host { display: block; }
  ha-card { padding: 0; overflow: hidden; font-family: var(--primary-font-family, sans-serif); }

  /* ── Header ── */
  .rc-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px 0; cursor: pointer; gap: 8px;
  }

  /* Right pill strip */
  .rc-header-right { display: flex; align-items: center; gap: 4px; flex-wrap: nowrap; }

  /* All pills */
  .rc-pill {
    font-size: 9px; padding: 2px 7px; border-radius: 20px;
    font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
    border: 1px solid; transition: all 0.2s; white-space: nowrap;
  }
  .rc-pill-ok      { background: var(--secondary-background-color); color: var(--secondary-text-color); border-color: var(--divider-color); }
  .rc-pill-conn    { background: rgba(29,158,117,0.12); color: var(--success-color,#1D9E75); border-color: var(--success-color,#1D9E75); }
  .rc-pill-offline { background: rgba(226,75,74,0.1); color: var(--error-color,#E24B4A); border-color: var(--error-color,#E24B4A); }
  .rc-pill-warn    { background: #FAEEDA; color: #633806; border-color: #EF9F27; }
  .rc-pill-bad     { background: #FCEBEB; color: #791F1F; border-color: #E24B4A; }

  /* ── Body: just the robot circle, centred ── */
  .rc-body { display: flex; justify-content: center; padding: 8px 12px 10px; }

  /* Robot circle */
  .rc-robot-wrap { position: relative; width: 72px; height: 72px; }
  .rc-ring { position: absolute; inset: 0; border-radius: 50%; box-sizing: border-box; }
  .rc-ring-bg     { border: 2.5px solid var(--divider-color,rgba(0,0,0,0.12)); }
  .rc-ring-active { border: 2.5px solid transparent; transition: border-color 0.4s; }
  .rc-ring-active.cleaning  { border-top-color: var(--success-color,#1D9E75); border-right-color: var(--success-color,#1D9E75); animation: rc-spin 1.4s linear infinite; }
  .rc-ring-active.returning { border-top-color: var(--warning-color,#BA7517); border-right-color: var(--warning-color,#BA7517); animation: rc-spin 2s linear infinite; }
  .rc-ring-active.error     { border-top-color: var(--error-color,#E24B4A);   border-right-color: var(--error-color,#E24B4A);   animation: rc-flash 0.8s ease-in-out infinite; }
  .rc-ring-active.docked    { border-color: var(--info-color,#378ADD); }
  .rc-ring-active.paused    { border-top-color: var(--disabled-text-color,#888); border-right-color: var(--disabled-text-color,#888); }
  @keyframes rc-spin  { to { transform: rotate(360deg); } }
  @keyframes rc-flash { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
  @keyframes rc-icon-clean {
    0%   { transform: rotate(0deg)   scale(1);    opacity:1;    }
    25%  { transform: rotate(90deg)  scale(1.12); opacity:0.75; }
    50%  { transform: rotate(180deg) scale(1);    opacity:1;    }
    75%  { transform: rotate(270deg) scale(1.12); opacity:0.75; }
    100% { transform: rotate(360deg) scale(1);    opacity:1;    }
  }
  .rc-robot-inner {
    position: absolute; inset: 5px; border-radius: 50%;
    background: var(--card-background-color,#fff);
    border: 1px solid var(--divider-color,rgba(0,0,0,0.1));
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
    cursor: default;
  }
  #rc-robot-icon { display: flex; align-items: center; justify-content: center; transform-origin: center; transition: opacity 0.4s; }
  #rc-robot-icon.cleaning { animation: rc-icon-clean 2.8s ease-in-out infinite; }

  /* Name label inside circle */
  .rc-inner-name {
    font-size: 7px; font-weight: 600; letter-spacing: 0.05em;
    color: var(--secondary-text-color);
    text-align: center; max-width: 48px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* Divider + buttons */
  .rc-divider { height: 1px; background: var(--divider-color,rgba(0,0,0,0.08)); margin: 0 12px; }
  .rc-buttons { display: flex; justify-content: space-around; padding: 6px 10px 8px; }
  .rc-btn {
    width: 38px; height: 38px; border-radius: 50%;
    border: 1px solid var(--divider-color,rgba(0,0,0,0.15));
    background: var(--secondary-background-color,#f5f5f5);
    color: var(--primary-text-color); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s, transform 0.1s, box-shadow 0.12s;
    font-family: inherit; padding: 0;
  }
  .rc-btn:hover   { background: var(--divider-color,rgba(0,0,0,0.1)); box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
  .rc-btn:active  { transform: scale(0.91); }
  .rc-btn[disabled] { opacity: 0.35; cursor: not-allowed; }
  .rc-btn.rc-btn-locate { color: var(--info-color,#378ADD); }
  .rc-btn svg { width: 15px; height: 15px; flex-shrink: 0; }
`;

const SVG = {
  start:  `<svg viewBox="0 0 16 16"><polygon points="4,2 13,8 4,14" fill="currentColor"/></svg>`,
  pause:  `<svg viewBox="0 0 16 16"><rect x="3" y="2" width="4" height="12" rx="1" fill="currentColor"/><rect x="9" y="2" width="4" height="12" rx="1" fill="currentColor"/></svg>`,
  dock:   `<svg viewBox="0 0 16 16"><path d="M3 13h10M8 3v8M5 7l3 4 3-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  stop:   `<svg viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor"/></svg>`,
  locate: `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 1v3M8 12v3M1 8h3M12 8h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

const ROBOT_SVG = `<span id="rc-robot-icon"><svg width="28" height="28" viewBox="0 0 36 36" fill="none">
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
      battery_entity: config.battery_entity || null,
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) { this._build(); this._built = true; }
    this._update();
  }

  _build() {
    const shadow = this.shadowRoot;
    shadow.innerHTML = `
      <style>${STYLES}</style>
      <ha-card>
        <div class="rc-header" id="rc-header">
          <div class="rc-header-right">
            <span class="rc-pill rc-pill-conn"  id="rc-conn-pill">Connected</span>
            <span class="rc-pill rc-pill-ok"   id="rc-bat-pill">—</span>
          </div>
        </div>
        <div class="rc-body">
          <div class="rc-robot-wrap">
            <div class="rc-ring rc-ring-bg"></div>
            <div class="rc-ring rc-ring-active" id="rc-ring"></div>
            <div class="rc-robot-inner">
              ${ROBOT_SVG}
              <span class="rc-inner-name" id="rc-inner-name">${this._config.name}</span>
            </div>
          </div>
        </div>
        <div class="rc-divider"></div>
        <div class="rc-buttons">
          <button class="rc-btn" id="rc-btn-start"  title="Start cleaning">${SVG.start}</button>
          <button class="rc-btn" id="rc-btn-pause"  title="Pause">${SVG.pause}</button>
          <button class="rc-btn" id="rc-btn-dock"   title="Return to dock">${SVG.dock}</button>
          <button class="rc-btn" id="rc-btn-stop"   title="Stop">${SVG.stop}</button>
          <button class="rc-btn rc-btn-locate" id="rc-btn-locate" title="Locate">${SVG.locate}</button>
        </div>
      </ha-card>
    `;
        const call = (svc) => {
      if (!this._hass) return;
      this._hass.callService('vacuum', svc, { entity_id: this._config.entity });
    };
    // Buttons — call service and stop the event bubbling to the card click handler
    const btn = (id, svc) => {
      shadow.getElementById(id).addEventListener('click', (e) => {
        e.stopPropagation();
        call(svc);
      });
    };
    btn('rc-btn-start',  'start');
    btn('rc-btn-pause',  'pause');
    btn('rc-btn-dock',   'return_to_base');
    btn('rc-btn-stop',   'stop');
    btn('rc-btn-locate', 'locate');

    // Tapping anywhere on the card opens the HA more-info dialog
    shadow.querySelector('ha-card').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('hass-more-info', {
        detail: { entityId: this._config.entity },
        bubbles: true, composed: true,
      }));
    });
  }

  _update() {
    const hass   = this._hass;
    const cfg    = this._config;
    const shadow = this.shadowRoot;
    const vacuum = hass.states[cfg.entity];
    if (!vacuum) return;

    const state     = vacuum.state;
    const attrs     = vacuum.attributes || {};
    const info      = getStateInfo(state);
    const available = state !== 'unavailable';

    // Connected pill
    const connPill = shadow.getElementById('rc-conn-pill');
    connPill.className   = 'rc-pill ' + (available ? 'rc-pill-conn' : 'rc-pill-offline');
    connPill.textContent = available ? 'Connected' : 'Offline';

    // Battery pill
    const batEnt  = cfg.battery_entity ? hass.states[cfg.battery_entity] : null;
    const batPct  = batEnt ? parseInt(batEnt.state) : attrs.battery_level;
    const batPill = shadow.getElementById('rc-bat-pill');
    if (batPct != null && !isNaN(batPct)) {
      batPill.className   = 'rc-pill ' + (batPct > 40 ? 'rc-pill-ok' : batPct > 20 ? 'rc-pill-warn' : 'rc-pill-bad');
      batPill.textContent = batPct + '%';
    } else {
      batPill.className   = 'rc-pill rc-pill-ok';
      batPill.textContent = '—';
    }

    // Ring animation
    shadow.getElementById('rc-ring').className = 'rc-ring rc-ring-active ' + (info.ring || '');
    const icon = shadow.getElementById('rc-robot-icon');
    if (icon) icon.className = state === 'cleaning' ? 'cleaning' : '';

    // Buttons
    ['start','pause','dock','stop','locate'].forEach(id => {
      const b = shadow.getElementById('rc-btn-' + id);
      if (b) b.disabled = !available;
    });
  }
  getCardSize() { return 3; }
  static getConfigElement() { return document.createElement('racoon-roomba-card-editor'); }
  static getStubConfig()    { return { entity: 'vacuum.roomba', name: 'Roomba' }; }
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
    set('battery_entity', this._config.battery_entity);
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
    wire('battery_entity', 'battery_entity', v => v || null);
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
