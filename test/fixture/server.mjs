// Local site with known violations. 127.0.0.1 plays the third party because
// its site differs from localhost.
import { createServer } from 'node:http';

const banner = (buttons) => `<div id="banner"><p>We use cookies to improve your experience.</p>${buttons}</div>`;
const shell = (body, head = '') => `<!doctype html><html lang="en"><head><title>Fixture</title>${head}</head><body>${body}
<a href="/about">About</a> <a href="/privacy">Privacy policy</a></body></html>`;

export function startFixture(port = 0) {
  const hits = [];
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const { port } = server.address();
    const pixel = (name) => `new Image().src='http://127.0.0.1:${port}/${name}.gif';`;
    const html = (b) => { res.setHeader('content-type', 'text/html'); res.end(b); };
    if (url.pathname.endsWith('.gif')) { hits.push(url.pathname); res.setHeader('content-type', 'image/gif'); return res.end(); }
    switch (url.pathname) {
      // Tracks before any choice, and keeps tracking after reject.
      case '/bad':
        return html(shell(`${banner(`<button onclick="${pixel('after-reject')}document.cookie='_fbp=1';this.parentNode.remove()">Reject all</button><button onclick="${pixel('after-accept')}this.parentNode.remove()">Accept all</button>`)}
          <form action="http://example.com/subscribe" method="post"><input type="email" name="email"><label><input type="checkbox" name="news" checked>Send me marketing</label></form>
          <script>document.cookie='_ga=GA1.1.1;max-age=63072000';localStorage.setItem('uid','abc');${pixel('before-choice')}</script>`));
      // Tracks only after accept.
      case '/good':
        return html(shell(banner(`<button onclick="this.parentNode.remove()">Reject all</button><button onclick="${pixel('after-accept')}document.cookie='_ga=GA1.1.1';this.parentNode.remove()">Accept all</button>`)));
      // Accept only, and a CMP rule whose opt-out merely hides the banner.
      case '/hide-only':
        return html(shell(`<div class="cc_banner-wrapper"><div class="cc_banner"><p>This site uses cookies.</p><a class="cc_btn cc_btn_accept_all" href="#" onclick="${pixel('after-accept')}this.closest('.cc_banner-wrapper').remove();return false">Got it</a></div></div>`));
      // Label the text patterns can't match, so only a CMP rule can find it.
      case '/cmp-rule':
        return html(shell(`<div class="cky-consent-container"><p>Cookies?</p><button data-cky-tag="reject-button" onclick="this.parentNode.remove()">Nope thanks</button><button data-cky-tag="accept-button" onclick="this.parentNode.remove()">Yes please</button></div>`));
      // Reject button that does nothing.
      case '/sticky':
        return html(shell(banner('<button>Reject all</button><button>Accept all</button>')));
      // A vendor's policy link appears before the site's own.
      case '/vendor-link':
        return html(`<!doctype html><title>Fixture</title><a href="http://127.0.0.1:${port}/privacy">Vendor privacy</a><a href="/privacy">Privacy policy</a>`);
      case '/no-banner':
        return html(shell('<p>Nothing tracks here.</p>'));
      case '/fingerprint':
        return html(shell(`<script>const c=document.createElement('canvas');c.width=200;c.height=50;c.getContext('2d').fillText('Cwm fjordbank glyphs',2,2);c.toDataURL();</script>`));
      case '/challenge':
        res.statusCode = 403;
        return html('<!doctype html><title>Just a moment...</title><p>Verify you are human</p>');
      case '/privacy':
        return html(shell('<h1>Privacy policy</h1><p>We are Fixture Ltd.</p>'));
      case '/about':
        return html(shell('<h1>About</h1>'));
      default:
        res.statusCode = 404;
        return html('not found');
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve({ port: server.address().port, hits, close: () => server.close() })));
}

if (process.argv[2]) await startFixture(Number(process.argv[2]));
