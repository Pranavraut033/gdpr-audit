#!/usr/bin/env node
// Collects evidence about a website's tracking under three consent scenarios.
// It makes no legal judgement: SKILL.md and references/gdpr-reference.md do that.
//
//   node scan.mjs <url> [--out dir] [--pages 3] [--headless] [--proxy url]
//                       [--locale en-GB] [--browser chrome|chromium]
//   node scan.mjs --install           install pinned dependencies (~43 MB) to the cache
//   node scan.mjs --install-browser   download Playwright's Chromium (~150 MB)
//
// Exit codes: 0 done, 2 usage, 3 dependencies missing, 4 browser missing.

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(homedir(), '.cache', 'gdpr-audit');
const SETTLE_MS = 2000;
const MAX_POLICY_CHARS = 200_000;
const SCENARIOS = ['none', 'reject', 'accept'];
const EU_UK = new Set('AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO GB'.split(' '));

const REJECT = /^(reject|decline|deny|refuse|disagree)( all| cookies| all cookies| optional( cookies)?| non-essential( cookies)?)?$|(only|just) (the )?(necessary|essential|required)|(necessary|essential|required)( cookies)? only|use necessary|continue without accepting|alle ablehnen|^ablehnen$|nur (notwendige|erforderliche|essenzielle)|tout refuser|^refuser$|continuer sans accepter|rechazar|rifiuta|alles weigeren|^weigeren$|afwijzen|rejeitar|recusar|odrzuć/i;
const ACCEPT = /^(accept|agree|allow|i accept|i agree|ok|okay|got it)( all| cookies| all cookies)?!?$|accept (all|cookies)|allow all|alle akzeptieren|^akzeptieren$|alle (cookies )?zulassen|^zustimmen$|tout accepter|^accepter$|aceptar|accetta|alles accepteren|^accepteren$|^aceitar|akceptuję/i;
const MANAGE = /^(manage|customi[sz]e|settings|preferences|options|more options)|(cookie|privacy) (settings|preferences)|einstellungen|anpassen|paramétrer|personnaliser|configurar|gestisci|instellingen/i;
const BANNER_CONTEXT = /cookie|consent|privacy|tracking|datenschutz|einwilligung|confidentialit|privacidad|privacit|toestemming/i;
const CHALLENGE = /just a moment|attention required|verify you are human|are you a robot|checking your browser|access denied|unusual traffic|captcha/i;
const PRIVACY_LINK = /privacy|datenschutz|confidentialit|privacidad|privacit|gegevensbescherming|cookie.?(policy|richtlinie)/i;
const IMPRINT_LINK = /impressum|imprint|legal.?notice|mentions.?l[eé]gales|aviso.?legal|colofon|note.?legali/i;

// ponytail: short hand-written list, not a tracker database. NC-licensed lists stay out
// so client audits are safe. Unknown hosts are reported unclassified for Claude to judge.
const VENDORS = {
  'google-analytics.com': ['Google Analytics', 'analytics'], 'analytics.google.com': ['Google Analytics', 'analytics'],
  'googletagmanager.com': ['Google Tag Manager', 'tag-manager'], 'doubleclick.net': ['Google Ads', 'advertising'],
  'googlesyndication.com': ['Google Ads', 'advertising'], 'googleadservices.com': ['Google Ads', 'advertising'],
  'fonts.googleapis.com': ['Google Fonts', 'fonts'], 'fonts.gstatic.com': ['Google Fonts', 'fonts'],
  'maps.googleapis.com': ['Google Maps', 'embed'], 'youtube.com': ['YouTube', 'embed'],
  'youtube-nocookie.com': ['YouTube', 'embed'], 'ytimg.com': ['YouTube', 'embed'], 'googlevideo.com': ['YouTube', 'embed'],
  'facebook.net': ['Meta', 'advertising'], 'facebook.com': ['Meta', 'advertising'], 'instagram.com': ['Meta', 'social'],
  'linkedin.com': ['LinkedIn', 'advertising'], 'licdn.com': ['LinkedIn', 'advertising'],
  'tiktok.com': ['TikTok', 'advertising'], 'ads-twitter.com': ['X', 'advertising'], 'twitter.com': ['X', 'social'],
  'x.com': ['X', 'social'], 't.co': ['X', 'advertising'], 'sc-static.net': ['Snap', 'advertising'],
  'pinterest.com': ['Pinterest', 'advertising'], 'pinimg.com': ['Pinterest', 'advertising'],
  'bing.com': ['Microsoft Ads', 'advertising'], 'clarity.ms': ['Microsoft Clarity', 'session-replay'],
  'hotjar.com': ['Hotjar', 'session-replay'], 'hotjar.io': ['Hotjar', 'session-replay'],
  'fullstory.com': ['FullStory', 'session-replay'], 'mouseflow.com': ['Mouseflow', 'session-replay'],
  'segment.com': ['Segment', 'analytics'], 'segment.io': ['Segment', 'analytics'], 'mixpanel.com': ['Mixpanel', 'analytics'],
  'amplitude.com': ['Amplitude', 'analytics'], 'heapanalytics.com': ['Heap', 'analytics'], 'matomo.cloud': ['Matomo Cloud', 'analytics'],
  'plausible.io': ['Plausible', 'analytics'], 'cloudflareinsights.com': ['Cloudflare Web Analytics', 'analytics'],
  'criteo.com': ['Criteo', 'advertising'], 'criteo.net': ['Criteo', 'advertising'], 'taboola.com': ['Taboola', 'advertising'],
  'outbrain.com': ['Outbrain', 'advertising'], 'adnxs.com': ['Xandr', 'advertising'], 'rubiconproject.com': ['Magnite', 'advertising'],
  'pubmatic.com': ['PubMatic', 'advertising'], 'amazon-adsystem.com': ['Amazon Ads', 'advertising'],
  'hubspot.com': ['HubSpot', 'marketing'], 'hs-scripts.com': ['HubSpot', 'marketing'], 'intercom.io': ['Intercom', 'support'],
  'zdassets.com': ['Zendesk', 'support'], 'stripe.com': ['Stripe', 'payment'], 'paypal.com': ['PayPal', 'payment'],
  'vimeo.com': ['Vimeo', 'embed'], 'sentry.io': ['Sentry', 'monitoring'], 'nr-data.net': ['New Relic', 'monitoring'],
  'cookiebot.com': ['Cookiebot', 'cmp'], 'consentcdn.com': ['Cookiebot', 'cmp'], 'cookielaw.org': ['OneTrust', 'cmp'],
  'onetrust.com': ['OneTrust', 'cmp'], 'usercentrics.eu': ['Usercentrics', 'cmp'], 'didomi.io': ['Didomi', 'cmp'],
  'privacy-center.org': ['Didomi', 'cmp'], 'cdnjs.cloudflare.com': ['cdnjs', 'cdn'], 'jsdelivr.net': ['jsDelivr', 'cdn'], 'unpkg.com': ['unpkg', 'cdn'],
};

export function vendorFor(host, path = '') {
  if (host === 'www.google.com' || host === 'www.recaptcha.net') {
    if (path.startsWith('/recaptcha')) return { vendor: 'Google reCAPTCHA', category: 'captcha' };
    if (path.startsWith('/maps')) return { vendor: 'Google Maps', category: 'embed' };
  }
  for (let h = host; h.includes('.'); h = h.slice(h.indexOf('.') + 1)) {
    if (VENDORS[h]) return { vendor: VENDORS[h][0], category: VENDORS[h][1] };
  }
  return { vendor: null, category: null };
}

export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export function loadCookieDb(csv) {
  const exact = new Map(), wildcard = [];
  for (const [, platform, category, name, , , retention, controller, , wild] of parseCsv(csv).slice(1)) {
    if (!name) continue;
    const entry = { platform, category, retention, controller };
    if (wild === '1') wildcard.push([name, entry]);
    else exact.set(name, entry);
  }
  return { exact, wildcard: wildcard.sort((a, b) => b[0].length - a[0].length) };
}

export function lookupCookie(db, name) {
  return db.exact.get(name) ?? db.wildcard.find(([prefix]) => name.startsWith(prefix))?.[1] ?? null;
}

// Keeps URLs out of the report by value: identifiers in query strings are personal data too.
export function describeUrl(raw) {
  const u = new URL(raw);
  const params = [...u.searchParams.keys()];
  const sensitive = [];
  for (const [k, v] of u.searchParams) {
    if (/[^\s@=&]+@[^\s@=&]+\.[a-z]{2,}/i.test(v)) sensitive.push({ param: k, kind: 'email' });
    else if (/^(token|access_token|id_token|auth|password|passwd|pwd|apikey|api_key|session|sessionid|sid|secret)$/i.test(k) && v) sensitive.push({ param: k, kind: 'credential-like' });
  }
  if (/[^/@]+@[^/@]+\.[a-z]{2,}/i.test(decodeURIComponent(u.pathname))) sensitive.push({ param: '(path)', kind: 'email' });
  return { scheme: u.protocol.slice(0, -1), host: u.hostname, path: u.pathname.slice(0, 120), params, gcs: u.searchParams.get('gcs'), sensitive };
}

export function parseEgress(trace) {
  return /^loc=([A-Z]{2})$/m.exec(trace)?.[1] ?? null;
}

// Runs in every frame before page scripts.
const HOOKS = `(() => {
  addEventListener('click', e => { try { window.__gaClick && window.__gaClick(String(e.target.innerText || e.target.value || e.target.tagName).slice(0, 60)); } catch {} }, true);
  window.__gaCanvas = [];
  const drawn = new WeakMap();
  const script = () => (/(https?:[^\\s)]+?):\\d+:\\d+/.exec(new Error().stack.split('\\n').slice(3).join('\\n')) || [])[1] || null;
  const note = (c, api) => {
    const chars = drawn.get(c);
    if (c.width >= 16 && c.height >= 16 && chars && chars.size >= 10) window.__gaCanvas.push({ api, width: c.width, height: c.height, script: script() });
  };
  const ft = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (t, ...a) {
    const s = drawn.get(this.canvas) || new Set();
    for (const ch of String(t)) s.add(ch);
    drawn.set(this.canvas, s);
    return ft.call(this, t, ...a);
  };
  const td = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function (...a) { note(this, 'toDataURL'); return td.apply(this, a); };
  const gi = CanvasRenderingContext2D.prototype.getImageData;
  CanvasRenderingContext2D.prototype.getImageData = function (...a) { note(this.canvas, 'getImageData'); return gi.apply(this, a); };
})();`;

function controlsInFrame({ reject, accept, manage, context }) {
  const rx = { reject: new RegExp(reject, 'i'), accept: new RegExp(accept, 'i'), manage: new RegExp(manage, 'i') };
  const ctx = new RegExp(context, 'i');
  const out = [];
  const walk = (root) => {
    for (const el of root.querySelectorAll('*')) {
      if (el.shadowRoot) walk(el.shadowRoot);
      if (!el.matches('button, a, [role=button], input[type=button], input[type=submit]')) continue;
      const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
      if (!text || text.length > 60) continue;
      const kind = rx.reject.test(text) ? 'reject' : rx.accept.test(text) ? 'accept' : rx.manage.test(text) ? 'manage' : null;
      if (!kind) continue;
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      if (!r.width || !r.height || s.visibility === 'hidden' || s.display === 'none') continue;
      let a = el, inBanner = window !== window.top;
      for (let i = 0; i < 7 && a && !inBanner; i++, a = a.parentElement || a.getRootNode().host) {
        if (ctx.test(a.textContent?.slice(0, 5000) || '')) inBanner = true;
      }
      if (!inBanner) continue;
      out.push({ kind, text, tag: el.tagName.toLowerCase(), width: Math.round(r.width), height: Math.round(r.height), color: s.color, background: s.backgroundColor, fontSize: s.fontSize });
      if (!window.__gaEls) window.__gaEls = [];
      window.__gaEls[out.length - 1] = el;
    }
  };
  walk(document);
  return out;
}

function pageFacts({ privacy, imprint }) {
  const privacyRx = new RegExp(privacy, 'i'), imprintRx = new RegExp(imprint, 'i');
  const secure = location.protocol === 'https:';
  const links = [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.href, text: (a.innerText || '').trim().slice(0, 80) })).filter((l) => /^https?:/.test(l.href));
  const forms = [...document.querySelectorAll('form')].map((f) => {
    const action = f.action || location.href;
    const boxes = [...f.querySelectorAll('input[type=checkbox]')];
    return {
      method: f.method,
      actionHost: new URL(action).hostname,
      offSite: new URL(action).hostname !== location.hostname,
      insecureAction: action.startsWith('http:') && (secure || !/^http:\/\/(localhost|127\.0\.0\.1)/.test(action)),
      personalFields: [...f.querySelectorAll('input,textarea')].filter((i) => /email|tel|password/.test(i.type) || /name|mail|phone|address/i.test(i.name || '')).map((i) => i.name || i.type),
      checkboxes: boxes.length,
      preTicked: boxes.filter((b) => b.defaultChecked || b.checked).map((b) => (b.labels?.[0]?.innerText || b.name || '').trim().slice(0, 100)),
    };
  });
  return {
    title: document.title.slice(0, 120),
    links,
    forms,
    privacyLinks: links.filter((l) => privacyRx.test(l.href) || privacyRx.test(l.text)).map((l) => l.href),
    imprintLinks: links.filter((l) => imprintRx.test(l.href) || imprintRx.test(l.text)).map((l) => l.href),
    bodyText: (document.body?.innerText || '').slice(0, 300),
  };
}

function tcfState() {
  if (typeof window.__tcfapi !== 'function') return null;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ present: true, loaded: false }), 1500);
    window.__tcfapi('addEventListener', 2, (d, ok) => {
      if (!ok || !['tcloaded', 'useractioncomplete', 'cmpuishown'].includes(d.eventStatus)) return;
      clearTimeout(timer);
      if (d.listenerId) window.__tcfapi('removeEventListener', 2, () => {}, d.listenerId);
      const on = (o) => Object.keys(o || {}).filter((k) => o[k]);
      resolve({ present: true, loaded: true, gdprApplies: d.gdprApplies, eventStatus: d.eventStatus, cmpId: d.cmpId, purposeConsents: on(d.purpose?.consents), legitimateInterests: on(d.purpose?.legitimateInterests), vendorConsentCount: on(d.vendor?.consents).length });
    });
  });
}

function storageKeys() {
  const dump = (kind, s) => { try { return Object.keys(s).map((key) => ({ kind, key, size: (s.getItem(key) || '').length })); } catch { return []; } };
  return [...dump('localStorage', localStorage), ...dump('sessionStorage', sessionStorage)];
}

async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(SETTLE_MS);
}

async function perFrame(page, fn, arg, fallback) {
  const results = await Promise.all(page.frames().map((f) => f.evaluate(fn, arg).catch(() => fallback)));
  return results;
}

async function findControls(page) {
  const arg = { reject: REJECT.source, accept: ACCEPT.source, manage: MANAGE.source, context: BANNER_CONTEXT.source };
  const frames = page.frames();
  const found = [];
  for (const frame of frames) {
    const items = await frame.evaluate(controlsInFrame, arg).catch(() => []);
    items.forEach((item, index) => found.push({ ...item, frame, index }));
  }
  return found;
}

async function clickControl(control) {
  const handle = await control.frame.evaluateHandle((i) => window.__gaEls[i], control.index);
  await handle.asElement().click({ timeout: 4000 }).catch(() => control.frame.evaluate((i) => window.__gaEls[i].click(), control.index));
}

const publicControl = ({ frame, index, ...rest }) => rest;

async function scanScenario({ browser, playwrightOpts, url, name, innerPages, pageLimit, getDomain, cookieDb, autoconsentScript, rules, outDir }) {
  const ctx = await browser.newContext(playwrightOpts);
  const firstSite = getDomain(new URL(url).hostname, { allowPrivateDomains: true }) || new URL(url).hostname;
  const siteOf = (host) => getDomain(host, { allowPrivateDomains: true }) || host;

  let phase = 'pre-choice';
  const requests = new Map(), websockets = [], cookies = new Map(), storage = new Map(), sensitiveUrls = [], mixedContent = new Set(), gcs = new Map();
  const canvas = new Map(), pages = [], clicks = [], forms = [];
  const ac = { cmp: null, popupFrame: null, resolve: null };

  ctx.on('request', (req) => {
    if (!/^https?:/.test(req.url())) return;
    const d = describeUrl(req.url());
    const thirdParty = siteOf(d.host) !== firstSite;
    const key = `${phase} ${d.host} ${d.path} ${req.resourceType()}`;
    if (requests.has(key)) { requests.get(key).count++; }
    else requests.set(key, { phase, host: d.host, path: d.path, params: d.params.slice(0, 30), method: req.method(), type: req.resourceType(), thirdParty, ...vendorFor(d.host, d.path), count: 1 });
    if (d.scheme === 'http' && url.startsWith('https:')) mixedContent.add(`${d.host}${d.path}`);
    if (d.gcs) gcs.set(`${phase} ${d.gcs}`, { phase, gcs: d.gcs, host: d.host });
    for (const s of d.sensitive) sensitiveUrls.push({ ...s, host: d.host, thirdParty });
  });

  await ctx.exposeBinding('__gaClick', (_, text) => { clicks.push(text); });
  await ctx.exposeBinding('autoconsentSendMessage', async ({ frame }, msg) => {
    const reply = (m) => frame.evaluate((x) => window.autoconsentReceiveMessage?.(x), m).catch(() => {});
    switch (msg?.type) {
      case 'init':
        return reply({ type: 'initResp', rules, config: { enabled: true, autoAction: null, disabledCmps: [], enablePrehide: false, enableCosmeticRules: false, enableGeneratedRules: true, detectRetries: 20, isMainWorld: false, prehideTimeout: 0, enableHeuristicDetection: true, heuristicMode: 'tier2', logs: { lifecycle: false, rulesteps: false, detectionsteps: false, evals: false, errors: false, messages: false, waits: false } } });
      case 'eval': {
        const result = await frame.evaluate(msg.code).catch(() => false);
        return reply({ type: 'evalResp', id: msg.id, result });
      }
      case 'cmpDetected': ac.cmp ??= msg.cmp; break;
      case 'popupFound': ac.cmp = msg.cmp; ac.popupFrame = frame; break;
      case 'optOutResult': case 'optInResult': ac.resolve?.(msg.result); break;
    }
  });
  await ctx.addInitScript(HOOKS);
  if (autoconsentScript) await ctx.addInitScript(autoconsentScript);

  const page = await ctx.newPage();
  page.on('websocket', (ws) => websockets.push({ phase, url: describeUrl(ws.url().replace(/^ws/, 'http')).host }));

  const snapshot = async () => {
    for (const c of await ctx.cookies()) {
      const key = `${c.name} ${c.domain}`;
      if (cookies.has(key)) continue;
      cookies.set(key, {
        firstSeen: phase, name: c.name, domain: c.domain, thirdParty: siteOf(c.domain.replace(/^\./, '')) !== firstSite,
        expiresDays: c.expires > 0 ? Math.round((c.expires * 1000 - Date.now()) / 864e5) : null, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite,
        ocd: lookupCookie(cookieDb, c.name),
      });
    }
    for (const list of await perFrame(page, storageKeys, undefined, [])) {
      for (const s of list) {
        if (!storage.has(`${s.kind} ${s.key}`)) storage.set(`${s.kind} ${s.key}`, { firstSeen: phase, ...s });
      }
    }
    for (const list of await perFrame(page, () => window.__gaCanvas || [], undefined, [])) {
      for (const c of list) canvas.set(`${c.script} ${c.api}`, { phase, ...c });
    }
  };

  const visit = async (target) => {
    const res = await page.goto(target, { waitUntil: 'load', timeout: 45000 }).catch((e) => ({ error: e.message.split('\n')[0] }));
    if (res?.error) { pages.push({ url: target, error: res.error }); return null; }
    await settle(page);
    const facts = await page.evaluate(pageFacts, { privacy: PRIVACY_LINK.source, imprint: IMPRINT_LINK.source }).catch(() => ({ links: [], forms: [], privacyLinks: [], imprintLinks: [], bodyText: '', title: '' }));
    const status = res?.status?.() ?? null;
    pages.push({
      url: page.url(), status, title: facts.title, phase,
      challenge: CHALLENGE.test(facts.title) || (CHALLENGE.test(facts.bodyText) && facts.links.length < 10) || status === 403 || status === 429 || status === 503,
      hasPrivacyLink: facts.privacyLinks.length > 0, hasImprintLink: facts.imprintLinks.length > 0,
    });
    forms.push(...facts.forms.filter((f) => f.personalFields.length || f.checkboxes || f.insecureAction).map((f) => ({ page: page.url(), ...f })));
    await snapshot();
    return { facts, headers: res?.headers?.() ?? {} };
  };

  const landing = await visit(url);
  if (!landing) { await ctx.close(); return { name, requests: [], cookies: [], storage: [], pages, forms, canvas: [], websockets, sensitiveUrls, mixedContent: [], gcs: [], banner: { detected: false }, tcf: {}, landing: null }; }

  const firstLayer = await findControls(page);
  await page.screenshot({ path: join(outDir, `${name}-before-choice.png`) }).catch(() => {});
  const tcfBefore = await page.evaluate(tcfState).catch(() => null);

  const banner = {
    detected: Boolean(ac.popupFrame) || firstLayer.some((c) => c.kind !== 'manage'),
    cmp: ac.cmp,
    firstLayer: firstLayer.map(publicControl),
    rejectOnFirstLayer: firstLayer.some((c) => c.kind === 'reject'),
    action: null,
  };

  if (name !== 'none') {
    const kind = name === 'reject' ? 'reject' : 'accept';
    clicks.length = 0;
    const action = { wanted: kind, method: 'none-found', completed: false, clicks: [], autoconsentResult: null };
    // A visible button first, since that is what a visitor uses. Autoconsent then handles
    // choices buried in deeper layers, or labels the patterns don't cover.
    const control = firstLayer.find((c) => c.kind === kind);
    if (control) {
      phase = 'post-choice';
      await clickControl(control);
      action.method = 'text-click';
      action.text = control.text;
    } else if (ac.popupFrame) {
      const done = new Promise((r) => { ac.resolve = r; setTimeout(() => r(null), 15000); });
      phase = 'post-choice';
      ac.popupFrame.evaluate((m) => { window.autoconsentReceiveMessage?.(m); }, { type: kind === 'reject' ? 'optOut' : 'optIn' }).catch(() => {});
      action.autoconsentResult = await done;
      // No click means a CMP API call or a hidden banner, which proves no visitor-usable control.
      action.method = clicks.length ? 'autoconsent-click' : 'autoconsent-no-click';
    }
    phase = 'post-choice';
    await settle(page);
    action.clicks = clicks.slice(0, 10);
    banner.stillVisibleAfterChoice = (await findControls(page)).some((c) => c.kind === 'accept' || c.kind === 'reject');
    action.completed = action.method.endsWith('-click') && action.method !== 'autoconsent-no-click' && !banner.stillVisibleAfterChoice;
    banner.action = action;
    await snapshot();
    await page.screenshot({ path: join(outDir, `${name}-after-choice.png`) }).catch(() => {});
    if (page.url() !== url && !pages.some((p) => p.url === page.url())) pages.push({ url: page.url(), phase, navigatedAfterChoice: true });
  }

  const tcfAfter = await page.evaluate(tcfState).catch(() => null);

  // A second page catches consent that is ignored or lost on navigation.
  // All scenarios visit the pages chosen by the first, so they stay comparable.
  const chosen = innerPages ?? chooseInnerPages(landing.facts, url, siteOf, firstSite, pageLimit);
  for (const target of chosen) await visit(target);

  const result = {
    name, banner, pages, forms, innerPages: chosen,
    requests: [...requests.values()],
    cookies: [...cookies.values()],
    storage: [...storage.values()],
    canvas: [...canvas.values()],
    websockets, sensitiveUrls: dedupe(sensitiveUrls), mixedContent: [...mixedContent], gcs: [...gcs.values()],
    tcf: { beforeChoice: tcfBefore, afterChoice: tcfAfter },
    landing,
  };
  await ctx.close();
  return result;
}

function dedupe(list) {
  return [...new Map(list.map((x) => [JSON.stringify(x), x])).values()];
}

export function chooseInnerPages(facts, url, siteOf, firstSite, limit) {
  const base = new URL(url);
  const seen = new Set([base.pathname.split('/')[1] || '']);
  const chosen = [];
  for (const { href } of facts.links) {
    const u = new URL(href);
    if (siteOf(u.hostname) !== firstSite || PRIVACY_LINK.test(href) || IMPRINT_LINK.test(href)) continue;
    if (/\.(pdf|zip|png|jpe?g|svg|gif|mp4|docx?)$/i.test(u.pathname) || /log.?out|sign.?out/i.test(href)) continue;
    const segment = u.pathname.split('/')[1] || '';
    if (seen.has(segment)) continue;
    seen.add(segment);
    chosen.push(`${u.origin}${u.pathname}`);
    if (chosen.length >= limit) break;
  }
  return chosen;
}

async function savePolicies(browser, playwrightOpts, facts, outDir, siteOf, firstSite) {
  const out = [];
  const ctx = await browser.newContext(playwrightOpts);
  const page = await ctx.newPage();
  for (const [kind, links] of [['privacy', facts.privacyLinks], ['imprint', facts.imprintLinks]]) {
    // Banners and widgets often link their own vendor's policy, so the site's own comes first.
    const own = links.filter((l) => siteOf(new URL(l).hostname) === firstSite);
    const href = own[0] ?? links[0];
    if (!href) { out.push({ kind, found: false }); continue; }
    const res = await page.goto(href, { waitUntil: 'load', timeout: 30000 }).catch(() => null);
    await page.waitForTimeout(SETTLE_MS);
    const text = await page.evaluate(() => document.body?.innerText || '').catch(() => '');
    const file = `policy-${kind}.txt`;
    writeFileSync(join(outDir, file), text.slice(0, MAX_POLICY_CHARS));
    out.push({ kind, found: true, sameSite: own.length > 0, url: href, status: res?.status() ?? null, chars: text.length, file, lang: await page.evaluate(() => document.documentElement.lang).catch(() => '') });
  }
  await ctx.close();
  return out;
}

function vendorMap(scenarios) {
  const map = new Map();
  for (const s of scenarios) {
    for (const r of s.requests) {
      if (!r.thirdParty) continue;
      const key = r.vendor ?? r.host;
      const v = map.get(key) ?? { vendor: r.vendor, category: r.category, hosts: new Set(), seen: {} };
      v.hosts.add(r.host);
      (v.seen[s.name] ??= new Set()).add(r.phase);
      map.set(key, v);
    }
  }
  return [...map.values()].map((v) => ({ ...v, hosts: [...v.hosts], seen: Object.fromEntries(Object.entries(v.seen).map(([k, p]) => [k, [...p]])) }));
}

export function summarise(scenarios) {
  const by = Object.fromEntries(scenarios.map((s) => [s.name, s]));
  const hosts = (s, phase) => [...new Set((s?.requests ?? []).filter((r) => r.thirdParty && r.phase === phase).map((r) => r.host))].sort();
  const cookieNames = (s, phase) => (s?.cookies ?? []).filter((c) => c.firstSeen === phase).map((c) => c.name).sort();
  const rejectPost = hosts(by.reject, 'post-choice');
  const rejectPre = new Set(hosts(by.reject, 'pre-choice'));
  return {
    preChoiceThirdParties: hosts(by.none, 'pre-choice'),
    preChoiceCookies: cookieNames(by.none, 'pre-choice'),
    preChoiceStorageKeys: (by.none?.storage ?? []).map((s) => `${s.kind}:${s.key}`),
    rejectCompleted: by.reject?.banner.action?.completed ?? false,
    rejectMethod: by.reject?.banner.action?.method ?? null,
    newThirdPartiesAfterReject: rejectPost.filter((h) => !rejectPre.has(h)),
    thirdPartiesAfterReject: rejectPost,
    newCookiesAfterReject: cookieNames(by.reject, 'post-choice'),
    newThirdPartiesAfterAccept: hosts(by.accept, 'post-choice').filter((h) => !hosts(by.accept, 'pre-choice').includes(h)),
    newCookiesAfterAccept: cookieNames(by.accept, 'post-choice'),
  };
}

async function securitySignals(url, headers) {
  const h = (n) => headers[n] ?? null;
  const out = {
    https: url.startsWith('https:'),
    headers: { hsts: h('strict-transport-security'), csp: h('content-security-policy'), cspReportOnly: h('content-security-policy-report-only'), referrerPolicy: h('referrer-policy'), contentTypeOptions: h('x-content-type-options'), frameOptions: h('x-frame-options') },
    httpRedirect: null,
  };
  if (out.https) {
    const u = new URL(url);
    out.httpRedirect = await fetch(`http://${u.host}/`, { redirect: 'manual', signal: AbortSignal.timeout(10000) })
      .then((r) => ({ status: r.status, toHttps: /^https:/i.test(r.headers.get('location') || '') }))
      .catch((e) => ({ error: e.cause?.code || e.message }));
  }
  return out;
}

function loadDeps() {
  const require = createRequire(join(CACHE, 'package.json'));
  try {
    return { chromium: require('playwright').chromium, getDomain: require('tldts').getDomain, acDir: join(CACHE, 'node_modules', '@duckduckgo', 'autoconsent') };
  } catch {
    return null;
  }
}

export function parseArgs(argv) {
  const opts = { url: null, out: null, pages: 3, headless: false, proxy: null, locale: 'en-GB', browser: 'chrome', install: false, installBrowser: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--headless') opts.headless = true;
    else if (a === '--install') opts.install = true;
    else if (a === '--install-browser') opts.installBrowser = true;
    else if (a === '--out') opts.out = argv[++i];
    else if (a === '--pages') opts.pages = Number(argv[++i]);
    else if (a === '--proxy') opts.proxy = argv[++i];
    else if (a === '--locale') opts.locale = argv[++i];
    else if (a === '--browser') opts.browser = argv[++i];
    else if (a.startsWith('--')) throw new Error(`Unknown option ${a}`);
    else opts.url = a;
  }
  if (opts.url) {
    const u = new URL(opts.url);
    if (!/^https?:$/.test(u.protocol)) throw new Error('Only http and https URLs can be scanned');
  }
  return opts;
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
  if (opts.install) {
    mkdirSync(CACHE, { recursive: true });
    copyFileSync(join(HERE, 'package.json'), join(CACHE, 'package.json'));
    execFileSync('npm', ['install', '--no-audit', '--no-fund', '--silent'], { cwd: CACHE, stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' } });
    console.log(`Installed to ${CACHE}`);
    return;
  }
  const deps = loadDeps();
  if (!deps) {
    console.error('Scanner dependencies are not installed. Ask the user, then run: node scan.mjs --install');
    process.exit(3);
  }
  if (opts.installBrowser) {
    execFileSync('npx', ['playwright', 'install', 'chromium'], { cwd: CACHE, stdio: 'inherit' });
    return;
  }
  if (!opts.url) {
    console.error('Usage: node scan.mjs <url> [--out dir] [--pages 3] [--headless] [--proxy url] [--locale en-GB] [--browser chrome|chromium]');
    process.exit(2);
  }

  const { chromium, getDomain, acDir } = deps;
  const launch = { headless: opts.headless, ...(opts.browser === 'chrome' ? { channel: 'chrome' } : {}), ...(opts.proxy ? { proxy: { server: opts.proxy } } : {}) };
  let browser;
  try {
    browser = await chromium.launch(launch);
  } catch (e) {
    console.error(`Could not start ${opts.browser}: ${e.message.split('\n')[0]}\nAsk the user, then run: node scan.mjs --install-browser, and scan with --browser chromium`);
    process.exit(4);
  }

  const u = new URL(opts.url);
  const date = new Date().toISOString().slice(0, 10);
  const outDir = opts.out ?? join(process.cwd(), 'gdpr-audit-reports', `${u.hostname}-${date}`);
  mkdirSync(outDir, { recursive: true });

  const cookieDb = loadCookieDb(readFileSync(join(HERE, '..', 'data', 'open-cookie-database.csv'), 'utf8'));
  const autoconsentScript = readFileSync(join(acDir, 'dist', 'autoconsent.playwright.js'), 'utf8');
  const rules = JSON.parse(readFileSync(join(acDir, 'rules', 'rules.json'), 'utf8'));
  // Fresh contexts share nothing, and blocked service workers can't hide requests.
  const playwrightOpts = { locale: opts.locale, viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' };

  const egressCtx = await browser.newContext(playwrightOpts);
  const trace = await egressCtx.request.get('https://www.cloudflare.com/cdn-cgi/trace', { timeout: 10000 }).then((r) => r.text()).catch(() => '');
  await egressCtx.close();
  const country = parseEgress(trace);
  const local = /^(localhost|127\.0\.0\.1|\[::1\]|.*\.localhost|.*\.test)$/.test(u.hostname);

  const scenarios = [];
  let innerPages = null;
  for (const name of SCENARIOS) {
    const s = await scanScenario({ browser, playwrightOpts, url: opts.url, name, innerPages, pageLimit: opts.pages, getDomain, cookieDb, autoconsentScript, rules, outDir });
    innerPages ??= s.innerPages;
    scenarios.push(s);
  }

  const noneLanding = scenarios[0].landing;
  const siteOf = (h) => getDomain(h, { allowPrivateDomains: true }) || h;
  const policies = noneLanding ? await savePolicies(browser, playwrightOpts, noneLanding.facts, outDir, siteOf, siteOf(u.hostname)) : [];
  const security = noneLanding ? await securitySignals(opts.url, noneLanding.headers) : null;
  await browser.close();

  const challenged = scenarios.filter((s) => s.pages.length === 0 || s.pages[0].error || s.pages[0].challenge).map((s) => s.name);
  const report = {
    meta: {
      url: opts.url, scannedAt: new Date().toISOString(), tool: 'gdpr-audit 0.1.0', browser: opts.browser, headless: opts.headless, locale: opts.locale,
      egressCountry: country, egressInEuUk: country ? EU_UK.has(country) : null, localTarget: local,
      assessable: challenged.length === 0, couldNotAssess: challenged,
      notes: [
        !local && country && !EU_UK.has(country) ? 'Scan left from outside the EU/UK. A missing banner is inconclusive.' : null,
        !local && !country ? 'Egress country unknown. A missing banner is inconclusive.' : null,
      ].filter(Boolean),
    },
    summary: summarise(scenarios),
    vendors: vendorMap(scenarios),
    policies,
    security: security && { ...security, mixedContent: scenarios[0].mixedContent, sensitiveUrls: dedupe(scenarios.flatMap((s) => s.sensitiveUrls)) },
    forms: dedupe(scenarios.flatMap((s) => s.forms)),
    scenarios: Object.fromEntries(scenarios.map(({ landing, sensitiveUrls, mixedContent, forms, ...s }) => [s.name, s])),
  };
  writeFileSync(join(outDir, 'scan.json'), JSON.stringify(report, null, 1));
  console.log(JSON.stringify({ outDir, meta: report.meta, summary: report.summary }, null, 1));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
