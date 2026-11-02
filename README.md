# GDPR Audit

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](.claude-plugin/plugin.json)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-orange.svg)](https://code.claude.com/docs/en/plugins)

A Claude Code plugin that audits any website for GDPR, ePrivacy and UK PECR issues, shows how personal data is used, and fixes what it finds only after you say go.

**This is not legal advice, and it will never tell you a site is compliant.** A tool can see trackers. It can't see your lawful basis, contracts or retention, so it asks you about those instead of guessing.

## How it works

1. **Scan.** A real browser visits the site in three clean sessions: no action, click reject, click accept. It records what loads, what's stored, and when.
2. **Report.** Claude checks that evidence against a sourced rule catalogue and writes a report with a data usage map: which vendor gets what, before and after each choice. Every finding gives its evidence, legal source, and how settled that law is.
3. **Questions.** You get a list of what can't be seen from outside, pre-filled with the vendors found.
4. **You decide.** Nothing changes until you say go. Then it writes a fix plan and waits for your approval.
5. **Fix and re-scan.** Code fixes go on a branch. Legal text is only ever a draft for a lawyer. A re-scan shows before and after.

## Usage

```
/gdpr-audit https://example.com          audit a live site
/gdpr-audit ./my-project                 audit a project, running it locally
/gdpr-audit https://example.com ./repo   audit the live site, fix from the repo
```

Or just ask: "does my cookie banner actually work?"

## What it checks

- **Before any choice:** third-party requests, cookies, local storage, canvas fingerprinting
- **After reject and accept:** whether reject really stops tracking, compared with accept
- **Banner:** whether reject is on the first layer, plus screenshots for design review
- **Consent signals:** TCF state and Google Consent Mode values
- **Notice:** saved privacy policy and Impressum text, checked against the Art 13 list and the vendors found
- **Forms:** pre-ticked boxes, personal data fields, HTTP actions
- **Security signals:** HTTPS redirect, HSTS, cookie flags, mixed content, CSP, emails or tokens in URLs

**Law covered:** EU GDPR and ePrivacy, UK GDPR, PECR and the Data (Use and Access) Act 2025, plus notes for Germany, France, Italy, Spain and the Netherlands. Each line of the [reference doc](skills/gdpr-audit/references/gdpr-reference.md) says how it was verified, and its date is on the first line. Proposals such as the EU Digital Omnibus are kept in a watchlist, not treated as law.

## Limits

- Banners vary by location. A scan from outside the EU or UK reports a missing banner as inconclusive, so use `--proxy` if you need to.
- Bot-protected sites may report "could not assess". It doesn't try to get around protection or solve CAPTCHAs.
- It only sees public pages, with no login, and only a few per site.
- Unknown third-party hosts are judged by Claude, so check those calls.
- It doesn't cover the DSA, consumer law, the AI Act or accessibility.

## Requirements

- [Claude Code](https://code.claude.com)
- Node.js 20 or newer
- Google Chrome, or about 150 MB for Playwright's Chromium (it asks first)

The first scan asks before installing about 43 MB of dependencies to `~/.cache/gdpr-audit`. Scans open a visible browser window using clean sessions, so your Chrome profile isn't touched.

## Install

```bash
claude plugin marketplace add Pranavraut033/gdpr-audit
```

```bash
claude plugin install gdpr-audit@gdpr-audit
```

Start a new session afterwards so the skill loads.

Update:

```bash
claude plugin update gdpr-audit@gdpr-audit
```

Uninstall:

```bash
claude plugin uninstall gdpr-audit@gdpr-audit
```

## Development

```bash
npm test
```

This runs the scanner against a local site with known violations, and needs the dependencies and Chrome above.

## Credits

- [Open Cookie Database](https://github.com/jkwakman/Open-Cookie-Database) by jkwakman, Apache-2.0, bundled in [`data/`](skills/gdpr-audit/data) (commit `81813835`)
- [Autoconsent](https://github.com/duckduckgo/autoconsent) by DuckDuckGo, MPL-2.0, installed at first run
- [Playwright](https://playwright.dev), Apache-2.0, and [tldts](https://github.com/remusao/tldts), MIT, installed at first run
- Detection methods draw on [EDPS Website Evidence Collector](https://code.europa.eu/EDPS/website-evidence-collector) and [The Markup's Blacklight](https://themarkup.org/blacklight/2020/09/22/how-we-built-a-real-time-privacy-inspector)

## License

MIT
