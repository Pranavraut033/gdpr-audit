# Fix patterns

Every fix ends the same way: re-scan and confirm the evidence changed. Class: **auto** = apply after the plan is approved. **human** = owner decides. **legal** = draft only.

Check the project's installed versions first. These patterns were written in Nov 2026.

## The one rule behind most fixes

Trackers load only after a recorded choice. Three parts:

1. A consent store with a default of denied.
2. A gate that renders or loads tags only when granted.
3. A control to change the choice later (CK-13).

No site needs a paid CMP by law. A small first-party banner is fine with few vendors. Larger or TCF sites usually want a CMP, and that choice is **human**.

A banner needs Accept and Reject on the first layer with comparable prominence, purposes and third parties listed, and a link to the notice (CK-8, CK-9, CK-11). Keep banner wording minimal and factual so the banner works, and flag it as provisional. Its final wording is **legal**.

## Google tag and GTM (auto for defaults, human for mode)

Order matters: defaults, then the tag, then the CMP. ([Google](https://developers.google.com/tag-platform/security/guides/consent))

```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    ad_storage: 'denied', analytics_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied',
    wait_for_update: 500
  });
</script>
<!-- then the tag, in Basic mode only after consent -->
```

```js
gtag('consent', 'update', { analytics_storage: 'granted' }); // on the visitor's choice
```

- **Basic** (default here): no Google tag loads until consent, which clears CK-1.
- **Advanced:** tags load and send cookieless pings while denied, so Google requests stay visible before choice. Owner's call with legal input. It stays an Info finding.
- German first-instance ruling: GTM itself needs prior consent. So load GTM after consent for German sites, not just its tags.

## Next.js

**Fonts (auto).** Replace `fonts.googleapis.com` links with [`next/font`](https://nextjs.org/docs/app/getting-started/fonts), which self-hosts:

```tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
```

**Scripts (auto).** No `<Script>` strategy knows about consent, so render it conditionally:

```tsx
'use client';
import Script from 'next/script';
import { useConsent } from './consent'; // the project's consent store

export function Analytics() {
  const { analytics } = useConsent();
  if (!analytics) return null;
  return <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXX" />;
}
```

Withdrawing should stop further loads and delete the cookies set. A script already loaded stays in memory until the page reloads, so reload on withdrawal.

**CMP scripts** go under `beforeInteractive`, so they run before others. ([Next.js](https://nextjs.org/docs/app/api-reference/components/script))

## WordPress

Gate on the [WP Consent API](https://wordpress.org/plugins/wp-consent-api/):

```php
if ( function_exists( 'wp_has_consent' ) && wp_has_consent( 'statistics' ) ) { /* enqueue */ }
```

**Trap:** with no CMP setting a consent type, `wp_has_consent()` returns true for everything. So confirm a CMP plugin that sets one is active, then re-scan. Plugin choice is **human**. Fix fonts and embeds through theme or plugin settings before editing theme files, so updates don't undo it.

## Shopify

Use [`customerPrivacy`](https://shopify.dev/docs/api/customer-privacy):

```js
Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], (err) => {
  if (err) return;
  if (window.Shopify.customerPrivacy.analyticsProcessingAllowed()) { /* load */ }
});
```

Also `marketingAllowed()`. Don't touch Shopify's own cookies. Enable the region's banner in admin, which is **human**, then re-scan from an EU location.

## Plain HTML (human review)

Load tags from a function called on consent, not from a `<script src>` in the head. Script blocking with `type="text/plain"` depends on the CMP, so check its docs and verify by re-scan.

```js
function loadTag(src) { const s = document.createElement('script'); s.src = src; s.async = true; document.head.append(s); }
```

## Embeds (auto)

Don't load third-party iframes until asked (CK-15).

**YouTube:** a click-to-load facade, such as [lite-youtube-embed](https://github.com/paulirish/lite-youtube-embed). `youtube-nocookie.com` alone isn't enough, since storage can still be written on load, so re-scan to confirm.

**Generic:**

```html
<button data-src="https://www.google.com/maps/embed?..." onclick="this.outerHTML=`<iframe src='${this.dataset.src}' title='Map' loading='lazy'></iframe>`">
  Load map (sends data to Google)
</button>
```

Keep the placeholder keyboard-accessible, and give the iframe a title. The click moves the provider's cookies to after the click and doesn't remove them, so say so on the button. Whether that counts as valid consent is **legal**.

## Fonts (auto)

Download the font files, serve them from the site, and add `@font-face`. Check the font's licence allows it (Google Fonts generally do). Remove `preconnect` hints to `fonts.gstatic.com` as well. Done when no `fonts.googleapis.com` or `fonts.gstatic.com` request appears.

## reCAPTCHA (human)

Options: load only on the form after consent, or switch to a privacy-friendly alternative. Either changes the form's spam protection, so the owner decides.

## Forms

- **Auto:** remove `checked` from marketing or consent checkboxes (CK-6). Change `http://` actions to `https://` when the target supports it (SE-5). Separate consent from terms acceptance.
- **Auto:** stop sending emails or tokens in query strings to analytics (SE-6), for example POST instead of GET. Pixel parameters may need a redaction rule.
- **Legal:** consent wording.

## Headers (auto, except CSP rollout)

```
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: SAMEORIGIN
```

- Only add `includeSubDomains` or `preload` to HSTS once the owner confirms every subdomain serves HTTPS, since it's hard to undo.
- Start CSP as `Content-Security-Policy-Report-Only`, since a wrong CSP breaks the site. Enforcing it is **human**.
- Cookie flags: add `Secure`, `HttpOnly` and `SameSite=Lax` where the app sets the cookie (SE-3). Test that login still works.

## Rights routes (human, then auto)

If the repo has accounts: an export endpoint (RT-15, RT-20), account deletion that reaches processors (RT-17), a working unsubscribe (RT-21), and for UK sites a complaints route (NT-7). Scope is the owner's, then the code is ordinary work.

## Drafts only (legal)

Notice text, lawful bases, retention periods, cookie tables, Impressum. Fill from the scan and the owner's answers, using `[OWNER TO CONFIRM]` for the rest. Start with `DRAFT: needs legal review`.

**Observed vendor table for a draft** can be generated straight from `vendors` in `scan.json`.

## Never automate

CMP choice, removing a vendor the business relies on, pay-or-consent, whether a DPIA or DPO is needed, breach decisions.
