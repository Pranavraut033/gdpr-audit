# GDPR, ePrivacy and PECR reference for website audits

**Law as of 2026-11-02.** Not legal advice. This doc gives an auditor testable rules and their sources. It does not decide whether a business is compliant.

**How each line was seen**

| Tag | Meaning |
|---|---|
| P | Primary text read (legislation, judgment, regulator document) |
| R | Court or regulator press release or web page summary read |
| M | Secondary source or mirror read |
| S | Search snippet only |
| K | Standard legal text, not re-read for this edition |
| I | Our inference from the cited source, no authority says it directly |

Do not state an S, K or I line to a user as settled. Say how sure it is.

**Severity:** C = repeatedly fined. H = invalid consent or design. M = information or lifecycle gap. Info = contested, report without calling it a breach.

## Contents

1. [Which law applies](#1-which-law-applies)
2. [Rules: cookies and consent (CK)](#2-rules-cookies-and-consent-ck)
3. [Rules: privacy notice (NT)](#3-rules-privacy-notice-nt)
4. [Rules: data subject rights (RT)](#4-rules-data-subject-rights-rt)
5. [Rules: third parties and transfers (TP)](#5-rules-third-parties-and-transfers-tp)
6. [Rules: security signals (SE)](#6-rules-security-signals-se)
7. [Rules: governance, owner input only (GV)](#7-rules-governance-owner-input-only-gv)
8. [Technology table](#8-technology-table)
9. [Pay-or-consent](#9-pay-or-consent)
10. [National differences](#10-national-differences)
11. [UK differences](#11-uk-differences)
12. [Child consent ages](#12-child-consent-ages)
13. [Fine precedents](#13-fine-precedents)
14. [Watchlist: not law yet, or could change](#14-watchlist-not-law-yet-or-could-change)
15. [Limits of this edition](#15-limits-of-this-edition)

## 1. Which law applies

**Two regimes, and reports must label which one a finding falls under.** Placing or reading anything on a device is governed by national ePrivacy law (or UK PECR). Later processing of personal data is governed by GDPR. The one-stop-shop does not cover ePrivacy, so several authorities can act on the same banner. ([EDPB Taskforce report](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf) paras 1-2, P)

**The core text**, ePrivacy Directive Art 5(3) ([EUR-Lex consolidated](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219), P): storing or accessing information on a user's device needs consent after clear and comprehensive information, except "for the sole purpose of carrying out the transmission of a communication" or "as strictly necessary in order for the provider of an information society service explicitly requested by the subscriber or user to provide the service".

**GDPR reach**
- Art 3(1): processing in the context of an EU establishment, wherever it happens. Art 3(2): non-EU operators offering goods or services to people in the EU, free included, or monitoring their behaviour there. ([Art 3](https://gdpr-info.eu/art-3-gdpr/), M)
- Art 2(2)(c): household exemption. ([GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng), K)
- Art 27: non-EU Art 3(2) operators need an EU representative unless processing is occasional, low risk and without large-scale special category data. ([Art 27](https://gdpr-info.eu/art-27-gdpr/), M)

**Personal data online**
- Art 4(1) names online identifiers. Recital 26 sets the "means reasonably likely" test, and Recital 30 lists IP addresses and cookie identifiers. (K)
- *Breyer* C-582/14: a dynamic IP is personal data for an operator with legal means to identify the user through the ISP. Decided under Directive 95/46. ([judgment](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A62014CJ0582), S)
- *EDPS v SRB* C-413/23 P (4 Sep 2025): pseudonymised data is not personal for every recipient in all cases. Decided under Regulation 2018/1725, so it applies to GDPR by analogy. ([judgment](https://eur-lex.europa.eu/eli/C/2025/5551/oj/eng), S)
- That ruling does not help under Art 5(3), which covers non-personal information too. ([EDPB 2/2023](https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf) paras 9-12, P; link is I)

**Principles and bases**
- Art 5: lawfulness, fairness, transparency; purpose limitation; minimisation; accuracy; storage limitation; integrity and confidentiality; accountability. (K)
- Art 6(1): consent, contract, legal obligation, vital interests, public task, legitimate interests. (K)
- Art 7: demonstrable consent, distinguishable request, withdrawal as easy as giving. (K)
- Art 9 and 10: special category and criminal data need a specific condition. (K)

## 2. Rules: cookies and consent (CK)

Scan fields in `scan.json` are named so you can go straight to the evidence.

| ID | The site must | Evidence | Source | Sev | Tag |
|---|---|---|---|---|---|
| CK-1 | Set or read no non-exempt tracker before an affirmative choice | `none`: `requests`/`cookies`/`storage` with phase `pre-choice` | [Taskforce](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf) para 7; [CNIL Shein](https://www.cnil.fr/en/cookies-placed-without-consent-shein-fined-150-million-euros-cnil); [CNIL Condé Nast](https://www.cnil.fr/en/cookies-placed-without-consent-company-publishes-website-vanityfairfr-fined-750000-euros) | C | P |
| CK-2 | Stop new trackers and reads after Reject or withdrawal | `reject`: phase `post-choice`, compare with `accept` | Shein; Condé Nast (above) | C | R |
| CK-3 | Pass the same test for non-cookie techniques: local storage, pixels, tracking URLs, JS-instructed sends, fingerprinting, IP tracking. Non-personal data and any duration count | `storage`, `requests`, `canvas` | [EDPB 2/2023](https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf) paras 9-12, 33, 37, 43, 47-55 | H | P |
| CK-4 | Treat on-device use as outside Art 5(3) only if nothing leaves the device | Owner input | 2/2023 paras 44, 52-53 | M | P |
| CK-5 | Exempt only transmission, or what is strictly necessary for a service the user explicitly requested, and be able to document why for each "essential" cookie | `cookies` with `ocd.category`, owner input | Art 5(3); Taskforce paras 26-30 | H | P |
| CK-6 | Use no pre-ticked boxes | Banner screenshot, `forms[].preTicked` | [Planet49 C-673/17](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62017CJ0673) para 63 and ruling; Taskforce para 10 | H | P |
| CK-7 | Not treat scrolling or continued browsing as consent | `none`: compare with a scrolled visit if suspected | [EDPB 05/2020](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf) example 16 | H | S |
| CK-8 | Offer reject on any layer that has an accept button. A "vast majority" of authorities hold this, not all, so say so | `banner.reject` | Taskforce para 8; France only "strongly recommends" same screen, see §10 | H | P |
| CK-9 | Not bury reject as an in-text or off-banner link, or make it unreadable. No colour standard can be imposed, so flag manifest cases only | Screenshot | Taskforce paras 14, 17-18; [CNIL notices](https://www.cnil.fr/en/dark-patterns-cookie-banners-cnil-issues-formal-notice-website-publishers) | H | P |
| CK-10 | Not claim legitimate interest for storage or access. Avoid a second legitimate-interest opt-out for ads | Banner text, TCF | Taskforce paras 22, 24; [C-252/21 release](https://curia.europa.eu/site/upload/docs/application/pdf/2023-07/cp230113en.pdf) | H | P |
| CK-11 | Disclose purposes, third parties with access and cookie duration | Banner and `policies` text | Planet49 ruling, point 3; Shein | M | P |
| CK-12 | Offer per-purpose choice | Banner second layer | 05/2020 paras 42-45 | M | P |
| CK-13 | Make withdrawal available any time and as easy as consent. An icon or visible link is suggested, no specific form can be mandated | Look for a re-open control after choice | Taskforce paras 32-35; GDPR Art 7(3) | M | P |
| CK-14 | Be able to prove consent. The burden is on the controller, and it requires active behaviour after prior information | Owner input | [Orange Romania C-61/19](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62019CJ0061) ruling | M | P |
| CK-15 | Get consent and inform visitors, as joint controller, for collection and transmission by embeds. Not liable for the provider's later processing | `requests` to embed hosts before choice | [Fashion ID C-40/17 release](https://curia.europa.eu/site/upload/docs/application/pdf/2019-07/cp190099en.pdf) | H | R |
| CK-16 | Not gate access on accepting cookies without an equivalent same-controller option. National views differ, see §9 and §10 | Banner | 05/2020 paras 37-41 | H | P |
| CK-17 | Treat page visits and button clicks that may reveal sensitive data as possible Art 9 data, for example health shop pixels | Site subject plus `requests` | C-252/21 release | H | R |
| CK-18 | Not treat the TCF as proof of compliance. The TC String is personal data | `tcf` | [IAB Europe C-604/22 release](https://curia.europa.eu/site/upload/docs/application/pdf/2024-03/cp240044en.pdf); rule is I | M | R |
| CK-20 | Get prior consent for marketing email, with a soft opt-in only for similar products to existing customers. Keep it separate from cookie consent, and flag it for legal review, since national rules differ (such as §7 UWG in Germany) | `forms` | ePrivacy Art 13 ([consolidated text](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219)); [Inteligo C-654/23](https://www.matheson.com/insights/cjeu-clarifies-direct-marketing-rules-under-eprivacy-directive/) | M | M |
| CK-19 | After reject, have no TCF purpose consent set to true | `reject`: `tcf.purposeConsents` | I, from CK-2 | H | I |

**Limits on these rules**
- The Taskforce report calls itself a minimum threshold, not a green light.
- [EDPB Guidelines 03/2022](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-032022-deceptive-design-patterns-social-media_en) concern social media platforms. Apply them to other sites by analogy only. (S)
- The Belgian Market Court's IAB Europe review of 14 May 2025 covered TCF 1.0 and 2.0, not 2.2. ([Freshfields](https://www.freshfields.com/en/our-thinking/blogs/technology-quotient/brussels-market-court-clarifies-gdpr-roles-in-adtech-and-upholds-sanctions-agains-102kcx6), M)
- No 2024-2026 CJEU ruling squarely on Art 5(3) was found. That reflects our searches, not proof that none exists.

## 3. Rules: privacy notice (NT)

**NT-1, Art 12(1):** concise, transparent, plain language, easily accessible. Sev M.

**NT-2, Art 13, data collected from the visitor, at collection.** ([Art 13](https://gdpr-info.eu/art-13-gdpr/), M) Sev M unless noted. Check `policies` text for each item:

- [ ] Controller identity and contact, plus representative
- [ ] DPO contact, where there is one
- [ ] Purposes and legal basis for each
- [ ] The legitimate interests, where Art 6(1)(f) is used
- [ ] Recipients or categories of recipients
- [ ] Third-country transfers, the adequacy decision or safeguard, and how to get a copy
- [ ] Retention period or the criteria
- [ ] Rights: access, rectification, erasure, restriction, objection, portability
- [ ] Right to withdraw consent
- [ ] Right to complain to a supervisory authority
- [ ] Whether providing data is statutory or contractual, and the consequence of not providing it
- [ ] Automated decisions and profiling: logic, significance, consequences

**NT-3, Art 14, data obtained elsewhere.** Same core items, plus the categories of data and the source, and without the statutory or contractual item. Give it within a reasonable period and at most one month. ([Art 14](https://gdpr-info.eu/art-14-gdpr/), M)

**NT-4:** recipients named in the notice should match vendors observed in the scan. An observed vendor with no mention is a `Likely issue`. (I, from Art 13(1)(e))

**NT-5:** a privacy notice link should be reachable from every page (`policies`, `pages`). (I, from Art 12(1))

**NT-6, Germany only:** Impressum, see §10.

**NT-8, language:** a banner or notice only in English for visitors in another targeted country is a `Likely issue`, since Art 12(1) requires intelligible information and consent must be informed. No specific authority was found. (I)

Wording is a legal matter. Report gaps; drafts need review.

## 4. Rules: data subject rights (RT)

**Deadline, Art 12(3):** without undue delay and within one month, extendable by two months if complex or numerous, with notice inside the first month. Free unless manifestly unfounded or excessive. ([Art 12](https://gdpr-info.eu/art-12-gdpr/), M)

| ID | Art | Right | What to look for on a site or in a repo | Tag |
|---|---|---|---|---|
| RT-15 | 15 | Access and copy | Export covers account data, user-linked logs, recipients | K |
| RT-16 | 16 | Rectification | Profile editing | K |
| RT-17 | 17, 19 | Erasure | Account deletion, propagated to processors | K |
| RT-18 | 18 | Restriction | Ability to flag or freeze records | K |
| RT-20 | 20 | Portability | Machine-readable export for consent or contract data | K |
| RT-21 | 21 | Objection | Absolute for direct marketing, working unsubscribe | K |
| RT-22 | 22 | Solely automated decisions | Human review route | K |

Without a repo or an account these are `Not assessed: owner input`, plus whether the notice explains how to exercise them.

## 5. Rules: third parties and transfers (TP)

| ID | Rule | Source | Sev | Tag |
|---|---|---|---|---|
| TP-1 | Every observed vendor has a processor contract or is a named independent or joint controller. Owner input, pre-filled with `vendors` | [Art 28(3)](https://gdpr-info.eu/art-28-gdpr/), Art 26 | M | M |
| TP-2 | Every transfer outside the EEA has a basis: adequacy (Art 45), safeguards (Art 46-47) or a narrow derogation (Art 49) | [GDPR Ch V](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) | M | K |
| TP-3 | A US vendor relying on the DPF is actually listed on [dataprivacyframework.gov](https://www.dataprivacyframework.gov/list). Adequacy covers participants only | [Commission adequacy list](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en) | M | P |
| TP-4 | A valid transfer basis does not replace consent for the tracker | CNIL [GA FAQ](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/questions-reponses-sur-les-mises-en-demeure-de-la-cnil-concernant-lutilisation-de-google-analytics); rule is I | M | I |

**Adequacy list:** Andorra, Argentina, Brazil (27 Jan 2026), Canada (commercial only), Faroe Islands, Guernsey, Israel, Isle of Man, Japan, Jersey, New Zealand, South Korea, Switzerland, UK (renewed Dec 2025), US (DPF participants only), Uruguay, European Patent Organisation. (P)

**SCCs:** Decision [2021/914](https://eur-lex.europa.eu/eli/dec_impl/2021/914/oj). (K) The Commission says they are not designed for importers already subject to GDPR under Art 3. (S)

**DPF today:** valid. *Latombe* T-553/23 was dismissed on 3 Sep 2025. Appeal C-703/25 P, lodged 31 Oct 2025, is pending, with an order of 4 Jun 2026 whose content we have not read. ([InfoCuria](https://infocuria.curia.europa.eu/tabs/affair?lang=EN&searchTerm=%22T-553%2F23%22&publishedId=C-703%2F25+P), P) Advise keeping SCCs as a fallback. See §14.

## 6. Rules: security signals (SE)

Art 32 requires risk-appropriate measures and names no specific header. ([Art 32](https://gdpr-info.eu/art-32-gdpr/), M) **Report these as risk signals, never as breaches.** Thresholds below come from [Mozilla Observatory scoring](https://github.com/mozilla/http-observatory/blob/main/httpobs/docs/scoring.md) (M), not from law.

| ID | Signal | Evidence | Sev |
|---|---|---|---|
| SE-1 | HTTP redirects to HTTPS on the same host | `security.httpRedirect` | H |
| SE-2 | HSTS, `max-age` of at least 6 months | `security.headers` | M |
| SE-3 | Session cookies have `Secure`, `HttpOnly`, `SameSite` | `cookies` | M |
| SE-4 | No `http://` subresources on an HTTPS page | `security.mixedContent` | M |
| SE-5 | No form posts over HTTP | `forms[].insecureAction` | H |
| SE-6 | No emails or tokens in URLs, above all to third parties ([OWASP](https://community.owasp.org/vulnerabilities/Information_exposure_through_query_strings_in_url)) | `security.sensitiveUrls` | H |
| SE-7 | CSP present, `Referrer-Policy`, `nosniff`, framing protection | `security.headers` | Info |

**Breach duties (owner input):** notify the authority within 72 hours of awareness unless risk is unlikely, and document every breach (Art 33, M). Tell data subjects without undue delay if high risk (Art 34, K).

For deep TLS checks suggest [testssl.sh](https://testssl.sh). For application security, this skill is not a substitute for a security audit.

## 7. Rules: governance, owner input only (GV)

None of these can be seen from outside. Always report as `Not assessed: owner input` until answered. Never imply a pass.

| ID | Question for the owner | Source |
|---|---|---|
| GV-1 | What is the lawful basis for each purpose? | Art 6, K |
| GV-2 | Is there a processor contract with each vendor, covering Art 28(3)(a)-(h) and sub-processors? | [Art 28](https://gdpr-info.eu/art-28-gdpr/), M |
| GV-3 | Which transfer mechanism applies to each non-EEA vendor? | Ch V, K |
| GV-4 | Do records of processing exist? The under-250-staff exemption falls away if processing is risky, not occasional, or involves Art 9/10 data | [Art 30](https://gdpr-info.eu/art-30-gdpr/), M |
| GV-5 | Is a DPIA needed or done? | Art 35, K |
| GV-6 | Is a DPO required or appointed? Required for public bodies and core large-scale monitoring or Art 9/10 processing | [Art 37](https://gdpr-info.eu/art-37-gdpr/), M |
| GV-7 | What retention actually applies, including server logs and backups? | Art 5(1)(e), K |
| GV-8 | Are access control, backups and restore tests in place? | Art 32, M |
| GV-9 | How are rights requests received, tracked and answered within a month? | Art 12(3), M |
| GV-10 | Are consent records kept, and can they prove what was shown? | Art 7(1), CK-14 |
| GV-11 | Is there a breach process and log? | Art 33, M |
| GV-12 | Does a non-EU operator have an EU or UK representative where required? | Art 27, M |
| GV-13 | Does the service target or attract children? | Art 8, §12 |

**EDPB position on tools:** they can list cookies but cannot establish their nature, so they serve to ask owners for documentation. (Taskforce para 29, P)

## 8. Technology table

| Tool | Position | Test | Sev | Tag |
|---|---|---|---|---|
| Google Fonts, remote | [LG München 3 O 17493/20](https://www.ihk.de/bergische/recht-und-steuern/wettbewerbsrecht/google-fonts-5646176) (20 Jan 2022): €100 plus injunction for passing the IP to Google without consent. One German civil court, not EU-wide | No `fonts.googleapis.com` or `fonts.gstatic.com` request | M | M |
| Google Analytics | [CNIL](https://cnil.fr/sites/cnil/files/2023-05/cnil_-_43e_rapport_annuel_-_2022.pdf), [Garante, Austrian DSB](https://noyb.eu/en/update-further-eu-dpa-orders-stop-google-analytics) found unlawful transfers for Universal Analytics, before the DPF. The Garante said a shortened IP is not anonymised | Consent-gated, Google's DPF listing checked | M | S |
| Meta Pixel | [IMY Apoteket](https://imy.se/globalassets/dokument/beslut/2024/beslut-tillsyn-apoteket-ab.pdf) SEK 37m and [Apohem](https://imy.se/globalassets/dokument/beslut/2024/beslut-tillsyn-apohem.pdf) SEK 8m, for sensitive data sent to Meta | Consent-gated, no sensitive parameters in the request | H | S |
| reCAPTCHA | [CNIL Cityscoot](https://cnil.fr/en/node/86038), €125k (2023): not strictly necessary, needs consent and disclosure. France | No request before choice, or an alternative | M | S |
| YouTube, Maps | No specific authority found. Derived from Fashion ID and 2/2023 | Click-to-load, no third-party request first. `youtube-nocookie.com` alone is not proof, re-scan | H | I |
| Google Tag Manager | [VG Hannover 10 A 5385/22](https://www.it-recht-kanzlei.de/vg-hannover-cookie-consent-ablehnen-google-tag-manager.html) (19 Mar 2025): needs prior consent, and "reject all" beside "accept all". First instance, Germany, finality unverified | No `googletagmanager.com` before choice | M | M |
| Consent Mode v2 Advanced | No regulator position found. [Google says](https://developers.google.com/tag-platform/security/concepts/consent-mode) tags load and send cookieless pings while denied. JS-instructed sends fall within 2/2023 paras 33, 42-43, and whether an exemption applies is open | `consentMode.gcs` and Google requests before choice | Info | I |
| Server-side tagging | No regulator guidance found. It exempts nothing by itself, since browser sends stay in scope (2/2023 para 33) | Same tests, first-party hosts may be collection endpoints | Info | I |
| Cookieless analytics | Not automatically out of scope: fingerprint and IP are covered (2/2023 paras 43, 54-55) | `canvas`, request review | M | P |
| CNIL audience exemption | [Conditions](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience): publisher's sole account, anonymous statistics, no cross-site tracking or vendor reuse. Recommended about 13-month cookie, 25-month retention. **France only** | Owner input | Info | R |
| Global Privacy Control | No EU regulator recognition found, and UK Sch A1 para 2 covers browser-setting consent without naming GPC. Recommend only, never a failure | None | Info | M |

## 9. Pay-or-consent

- [EDPB Opinion 08/2024](https://www.edpb.europa.eu/system/files/2024-04/edpb_opinion_202408_consentorpay_en.pdf) (P) covers **large online platforms only**. A binary consent-or-fee choice will in most cases fail. A free non-behavioural option carries substantial weight, the fee must not inhibit choice, and purposes must stay granular.
- Wider EDPB guidelines are [still in progress](https://www.edpb.europa.eu/news/edpb-work-programme-2026-2027-easing-compliance-and-strengthening-cooperation-across-the_en). (R)
- Test: the paid tier sets only strictly necessary trackers, content is equivalent, and non-subscribers get granular opt-in. Source is [DSK 22 Mar 2023](https://www.datenschutzkonferenz-online.de/media/pm/DSK_Beschluss_Bewertung_von_Pur-Abo-Modellen_auf_Websites.pdf), Germany only. (P) Sev H.
- France allows conditional access only with "complete and clear understanding" of the consequences. ([CNIL Google](https://www.cnil.fr/en/cookies-and-advertisements-inserted-between-emails-google-fined-325-million-euros-cnil), R)

## 10. National differences

None of this is EU-wide. Apply a row when the site targets that country.

| Country | Law and guidance | Reject | Choice lifetime | Cookie wall |
|---|---|---|---|---|
| DE | [§25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html) (P); [DSK OH Digitale Dienste, Nov 2024](https://www.datenschutzkonferenz-online.de/media/oh/OH_Digitale_Dienste.pdf) (P) | No extra effort if the banner blocks content (paras 48-50, 58-60) | No fixed period; changed cookies or third parties need new consent (para 63) | Pur-Abo possible at market price |
| FR | Art 82 LIL; [CNIL Recommendation, consolidated 16 Jan 2026](https://www.cnil.fr/sites/default/files/2026-01/recommandation_cookies_consolidee.pdf) (P; the copy read has a "Projet" watermark) | "Strongly recommends" same screen and ease | 6 months is good practice, not a rule | Case by case |
| IT | [Garante, 10 Jun 2021](https://garanteprivacy.it/garante/doc.jsp?ID=9677876) (P) | X means no non-technical cookies, equal prominence | Do not re-prompt for at least 6 months, with exceptions | Generally unlawful without an equivalent |
| ES | [AEPD guide, Jul 2023](https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/aepd-actualiza-guia-cookies-para-adaptarla-a-nuevas-directrices-cepd) (R) | Accept and reject at same level | [24-month renewal](https://finreg360.com/alerta/la-agencia-espanola-de-proteccion-de-datos-actualiza-la-guia-sobre-el-uso-de-cookies/) is good practice (M) | Allowed with an alternative, not necessarily free |
| NL | [AP](https://autoriteitpersoonsgegevens.nl/en/themes/internet-and-smart-devices/cookies/clear-cookie-banners) (S) | Visible next to accept | Not established | Not checked |

**Germany also**
- A legitimate-interest balancing does not satisfy §25(2) (OH para 69). Withdrawal must not require a contact form or searching the policy (para 62).
- **Impressum**, [§5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html) (P): commercial services keep name and address, email, register entry, VAT ID and similar details easily recognisable, directly accessible and permanently available. An information duty, not a cookie rule. Sev M, rule ID NT-6.

## 11. UK differences

UK GDPR ([text](https://www.legislation.gov.uk/eur/2016/679/contents)) plus PECR, as changed by the [Data (Use and Access) Act 2025](https://www.legislation.gov.uk/ukpga/2025/18).

**Regulator:** the Information Commission took over from the ICO on 30 Sep 2026 under SI 2026/1015. Functions are unchanged and ICO guidance carries on. ([Lewis Silkin](https://www.lewissilkin.com/insights/2026/09/29/what-the-icos-transformation-into-the-information-commission-means-for-your-orga-102o3ni), [gov.uk](https://www.gov.uk/government/news/information-commission-succeeds-the-ico-as-uks-data-protection-regulator), S)

**Commencement:** [SI 2026/82](https://www.legislation.gov.uk/uksi/2026/82/regulation/2/made) (P): 5 Feb 2026 for most data protection and PECR provisions; 19 Jun 2026 for s.103 complaints.

**Cookie exceptions, [PECR Sch A1](https://www.legislation.gov.uk/ukpga/2025/18/schedule/12)** (P). No consent needed if the conditions are met:
- **Statistics:** sole purpose is statistics on use of your own service to improve it; no sharing except to help make those improvements; clear information; simple free objection.
- **Appearance or functionality:** sole purpose is adapting to preferences or enhancing the site; clear information; simple free objection.
- **Emergency assistance:** location only.
- **Transmission and strictly necessary,** now with examples such as security and fraud.
- There is no advertising exception, so ads and cross-site tracking need consent.
- [ICO final guidance](https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/04/final-storage-and-access-technologies-guidance-published/), 29 Apr 2026, says the analytics exception does not cover all analytics and legitimate interests cannot stand in for PECR consent. (S)

So a UK-targeted site with first-party statistics and an objection route may have no banner duty for that cookie. **Do not apply EU CK-1 to it mechanically.**

**PECR fines:** up to £17.5m or 4% for regs 5-8 and 14, 19-24. ([Sch 13](https://www.legislation.gov.uk/ukpga/2025/18/schedule/13), [DPA 2018 s.157](https://www.legislation.gov.uk/ukpga/2018/12/section/157), P) The old cap was £500,000. (S)

**Other changes**
- Recognised legitimate interests, Art 6(1)(ea): public task disclosure, security, emergencies, crime, safeguarding. ([Sch 4](https://www.legislation.gov.uk/ukpga/2025/18/schedule/4), P)
- DSAR clock starts at the latest of receipt, ID or fee, and can stop for clarification ([s.76](https://www.legislation.gov.uk/ukpga/2025/18/section/76), P). Searches need only be reasonable and proportionate ([s.78](https://www.legislation.gov.uk/ukpga/2025/18/section/78), P).
- **Complaints, in force 19 Jun 2026:** make complaints easy, for example an electronic form, and acknowledge within 30 days. ([s.103](https://www.legislation.gov.uk/ukpga/2025/18/section/103), P) Rule ID NT-7: UK sites should offer a complaints route.
- Automated decisions: Arts 22A-22D replace Art 22, and restrictions centre on special category data. ([s.80](https://www.legislation.gov.uk/ukpga/2025/18/section/80), P)
- Children: Art 25 duty for services likely to be accessed by children. ([s.81](https://www.legislation.gov.uk/ukpga/2025/18/section/81), P)
- Transfers: Chapter V rewritten by Sch 7, with a "not materially lower" test. (K, Sch 7 not read)

## 12. Child consent ages

Art 8: default 16, Member States may lower to no less than 13. **Indicative only**: no official consolidated list was found, and France and Spain are flagged as moving. Check national law before relying on a number. ([privacydesign.ch](https://privacydesign.ch/kb/ages/), 10 Sep 2026, M)

| Age | Member States |
|---|---|
| 13 | BE, DK, EE, FI, LV, MT, PT, SE |
| 14 | AT, BG, CY, IT, LT, ES |
| 15 | CZ, FR, GR, SI |
| 16 | HR, DE, HU, IE, LU, NL, PL, RO, SK |

Malta is listed as 13 per the [IDPC](https://idpc.org.mt/our-office/legislation/) (S.L. 586.11, S), overriding the privacydesign table, which says 16. UK: 13. (M)

## 13. Fine precedents

Use these to explain risk, not to predict a fine. GDPR caps: €20m or 4% for Arts 5-7, 9, 12-22, 44-49 and €10m or 2% for Arts 8, 11, 25-39. ([Art 83](https://gdpr-info.eu/art-83-gdpr/), M) Many cookie fines below are French ePrivacy fines, outside those caps.

| Amount | Year | Authority | Breach | Tag |
|---|---|---|---|---|
| €325m | 2025 | [CNIL](https://www.cnil.fr/en/cookies-and-advertisements-inserted-between-emails-google-fined-325-million-euros-cnil) | Google: Gmail ads and account-creation cookies | R |
| €150m | 2025 | [CNIL](https://www.cnil.fr/en/cookies-placed-without-consent-shein-fined-150-million-euros-cnil) | Shein: pre-consent ads, incomplete banner, ineffective reject | R |
| €150m | 2021 | [CNIL](https://www.cnil.fr/en/cookie-regulation-cnil-continuing-action-plan-initiated-2019-and-has-imposed-two-fines-shein-and) | Google: cookie practices | S |
| €100m | 2020 | [CNIL](https://elections.cnil.fr/en/cookies-council-state-confirms-sanction-imposed-cnil-2020-google) | Google: ad cookies, upheld by Conseil d'État | S |
| €60m | 2021 | CNIL | Facebook: refusal harder than accepting | S |
| €7m | 2026 | [CNIL](https://www.cnil.fr/en/sanction-app-cookies-fnac) | Fnac: app tracker, not website | R |
| €750k | 2025 | [CNIL](https://www.cnil.fr/en/cookies-placed-without-consent-company-publishes-website-vanityfairfr-fined-750000-euros) | Condé Nast: repeat breach | R |
| SEK 37m / 8m | 2024 | IMY | Apoteket / Apohem: Meta Pixel | S |
| €250k | 2022, upheld 2025 | Belgian DPA | IAB Europe: TCF | M |

## 14. Watchlist: not law yet, or could change

**Re-check these online before relying on them, and always when this doc is over 6 months old.** Report current law, and show these only as "proposed, not applicable".

**EU Digital Omnibus**, COM(2025) 837, procedure 2025/0360(COD). **Not law.** The GDPR and ePrivacy Directive are unchanged today.
- Parliament: ["Awaiting committee decision"](https://oeil.europarl.europa.eu/oeil/en/procedure-file?reference=2025/0360(COD)), joint ITRE-LIBE, read 2026-11-02. (P) Committee vote reportedly early 2027. ([nicfab](https://www.nicfab.eu/en/posts/digital-omnibus-council/), M)
- Council: [mandate 14756/26](https://data.consilium.europa.eu/doc/document/ST-14756-2026-INIT/en/pdf), agreed 21 Oct 2026. A position, not law. (P, but extraction lost strikethrough, so details below are M)
- Likely direction per the Council mandate: consent stays the default under a rewritten Art 5(3); new no-consent purposes including anonymous first-party audience measurement; one-click refusal with a 4-month re-ask bar (Commission proposed 6); personal data definition kept; breach notice only if high risk, 96 hours; DPAs enforce; 24-month transposition.
- EDPB-EDPS [Joint Opinion 2/2026](https://www.edpb.europa.eu/system/files/documents/2026-02/edpb_edps_jointopinion_202602_digitalomnibus_en.pdf) opposes the definition change. (P)

**EU-US DPF:** valid, with appeal C-703/25 P pending (§5). After *Trump v Slaughter* (29 Jun 2026), noyb asked the Commission to repeal it and threatened a CJEU challenge. No confirmed repeal or filing as of our latest source, Aug 2026. ([Leaseweb](https://blog.leaseweb.com/2026/08/20/eu-us-data-privacy-framework-risk/), S)

**EDPB:** pay-or-consent guidelines in progress. [Guidelines 02/2026 on anonymisation](https://www.edpb.europa.eu/system/files/2026-07/edpb_guidelines_202602_anonymisation_v1_en_0.pdf), consultation closed 30 Oct 2026, not final. (S)

**TCF 2.3:** status unverified.

## 15. Limits of this edition

- Not obtained: ICO guidance body (403), AP pages (403), original Google Analytics decisions, IMY and Cityscoot decision text, LG München and VG Hannover judgment text, Guidelines 03/2022 body.
- Many CJEU items rest on Court press releases, which are non-binding. Only Planet49 and Orange Romania were read in full for this edition.
- gdpr-info.eu is a mirror. For a citation that matters, read the [Official Journal text](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng).
- Other laws that may apply to a site (DSA, wider consumer and unfair competition law, AI Act, accessibility, CCPA) are out of scope. Mention them as a question for a lawyer if something looks relevant, without asserting them.
