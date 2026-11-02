// Runs the real scanner against test/fixture. Needs `node scan.mjs --install` and Chrome.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { describeUrl, loadCookieDb, lookupCookie, parseCsv, parseEgress, vendorFor } from '../skills/gdpr-audit/scripts/scan.mjs';
import { startFixture } from './fixture/server.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN = join(ROOT, 'skills/gdpr-audit/scripts/scan.mjs');
let fixture, tmp;
const results = new Map();

function scan(path) {
  const out = join(tmp, path.replace('/', ''));
  return new Promise((resolve, reject) => {
    execFile('node', [SCAN, `http://localhost:${fixture.port}${path}`, '--out', out, '--headless', '--pages', '1'], { timeout: 180000 }, (err, _o, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(JSON.parse(readFileSync(join(out, 'scan.json'), 'utf8')));
    });
  });
}

before(async () => {
  fixture = await startFixture();
  tmp = mkdtempSync(join(tmpdir(), 'gdpr-audit-'));
  for (const p of ['/bad', '/good', '/hide-only', '/no-banner', '/fingerprint', '/challenge', '/cmp-rule', '/sticky', '/vendor-link']) results.set(p, await scan(p));
}, { timeout: 900000 });
after(() => { fixture.close(); rmSync(tmp, { recursive: true, force: true }); });

test('unit: CSV, cookie lookup, URL description, vendors, egress', () => {
  assert.deepEqual(parseCsv('a,"b,""c"""\n1,2\n'), [['a', 'b,"c"'], ['1', '2']]);
  const db = loadCookieDb('ID,Platform,Category,Name,Domain,Desc,Ret,Ctrl,Portal,Wild\n1,GA,Analytics,_ga,,d,2y,Google,,0\n2,GA,Analytics,_gac_,,d,2y,Google,,1\n');
  assert.equal(lookupCookie(db, '_ga').category, 'Analytics');
  assert.equal(lookupCookie(db, '_gac_123').platform, 'GA');
  assert.equal(lookupCookie(db, 'nope'), null);
  const d = describeUrl('https://x.io/p?e=me%40a.com&token=abc&q=1');
  assert.deepEqual(d.sensitive.map((s) => s.kind), ['email', 'credential-like']);
  assert.ok(!JSON.stringify(d).includes('me@a.com'), 'values stay out of evidence');
  assert.equal(vendorFor('www.google-analytics.com').vendor, 'Google Analytics');
  assert.equal(vendorFor('www.google.com', '/recaptcha/api.js').vendor, 'Google reCAPTCHA');
  assert.equal(vendorFor('evil-google-analytics.com').vendor, null);
  assert.equal(parseEgress('ip=1.1.1.1\nloc=DE\ntls=x'), 'DE');
});

test('bad site: pre-choice tracking is captured', () => {
  const { summary } = results.get('/bad');
  assert.ok(summary.preChoiceThirdParties.includes('127.0.0.1'));
  assert.ok(summary.preChoiceCookies.includes('_ga'));
  assert.ok(summary.preChoiceStorageKeys.includes('localStorage:uid'));
});

test('bad site: tracking after reject is captured', () => {
  const r = results.get('/bad');
  assert.equal(r.summary.rejectCompleted, true);
  assert.ok(r.scenarios.reject.requests.some((q) => q.path === '/after-reject.gif' && q.phase === 'post-choice'));
  assert.ok(r.summary.newCookiesAfterReject.includes('_fbp'));
  assert.equal(r.scenarios.reject.banner.rejectOnFirstLayer, true);
});

test('bad site: pre-ticked box, HTTP form and cookie lifetime are captured', () => {
  const r = results.get('/bad');
  const form = r.forms.find((f) => f.personalFields.includes('email'));
  assert.deepEqual(form.preTicked, ['Send me marketing']);
  assert.equal(form.insecureAction, true);
  assert.equal(form.actionHost, 'example.com');
  assert.equal(form.offSite, true);
  const ga = r.scenarios.none.cookies.find((c) => c.name === '_ga');
  assert.ok(ga.expiresDays > 300, 'Chrome caps lifetime at 400 days');
  assert.equal(ga.ocd.platform, 'Google Analytics');
});

test('good site: clean before choice and after reject, tracks after accept', () => {
  const { summary } = results.get('/good');
  assert.deepEqual(summary.preChoiceThirdParties, []);
  assert.deepEqual(summary.preChoiceCookies, []);
  assert.equal(summary.rejectCompleted, true);
  assert.deepEqual(summary.thirdPartiesAfterReject, []);
  assert.deepEqual(summary.newCookiesAfterReject, []);
  assert.deepEqual(summary.newThirdPartiesAfterAccept, ['127.0.0.1']);
});

test('accept-only banner with a hide-only rule: reject is not completed', () => {
  const r = results.get('/hide-only');
  assert.equal(r.scenarios.reject.banner.detected, true);
  assert.equal(r.scenarios.reject.banner.cmp, null, 'hide-only rules are cosmetic, and cosmetic rules are off');
  assert.equal(r.summary.rejectCompleted, false);
  assert.equal(r.summary.rejectMethod, 'none-found');
  assert.equal(r.scenarios.accept.banner.action.completed, true);
  assert.ok(r.summary.newThirdPartiesAfterAccept.includes('127.0.0.1'));
});

test('CMP rule clicks what the text patterns miss, and that is not first-layer evidence', () => {
  const r = results.get('/cmp-rule');
  assert.equal(r.scenarios.reject.banner.cmp, 'cookieyes');
  assert.equal(r.summary.rejectMethod, 'autoconsent-click');
  assert.equal(r.summary.rejectCompleted, true);
  assert.equal(r.scenarios.reject.banner.rejectOnFirstLayer, false);
});

test('a click that leaves the banner up is not a completed choice', () => {
  const r = results.get('/sticky');
  assert.equal(r.summary.rejectMethod, 'text-click');
  assert.equal(r.summary.rejectCompleted, false);
  assert.equal(r.scenarios.accept.banner.action.completed, false);
});

test('the site\'s own policy wins over a vendor link', () => {
  const privacy = results.get('/vendor-link').policies.find((p) => p.kind === 'privacy');
  assert.equal(privacy.sameSite, true);
  assert.match(privacy.url, /^http:\/\/localhost/);
});

test('no banner, canvas fingerprint, challenge page', () => {
  const none = results.get('/no-banner');
  assert.equal(none.scenarios.none.banner.detected, false);
  assert.equal(none.summary.rejectMethod, 'none-found');
  assert.equal(none.meta.assessable, true);
  assert.equal(results.get('/fingerprint').scenarios.none.canvas[0].api, 'toDataURL');
  assert.equal(results.get('/challenge').meta.assessable, false);
});

test('policy text is saved and the link is found', () => {
  const r = results.get('/no-banner');
  const privacy = r.policies.find((p) => p.kind === 'privacy');
  assert.equal(privacy.found, true);
  assert.equal(r.scenarios.none.pages[0].hasPrivacyLink, true);
  assert.equal(r.scenarios.none.pages.length, 2, 'inner page visited');
});
