# Rechrom website

Official Rechrom landing page. Static HTML, CSS, SVG and JavaScript.

Live site: https://rechrom.dev/

Cloudflare Pages fallback: https://rechrom-website.pages.dev/

Production is hosted on Cloudflare Pages. The GitHub Actions workflow requires the two deployment secrets described below.

## Development

Use Node.js 22 or newer and Python 3. No npm install or build is required.

```sh
npm run check
npm run dev
```

Open http://localhost:4317. If the existing preview occupies that port, use `python3 -m http.server 4318 --directory public`.

Edit files in `public/`. The seven sections cover the engine, modular browser assembly, app platforms, footprint targets, web technologies and extension concepts. Performance figures and future platform capabilities are estimates or development targets, not published benchmark results.

## Deployment

Production branch: `main`. Deployment directory: `public/`. Cloudflare Pages project: `rechrom-website`, using Direct Upload, not Cloudflare's Git integration.

1. Create a Cloudflare API token scoped to the intended account with **Account → Cloudflare Pages → Edit**.
2. Add these repository **Actions secrets** at [Settings → Secrets and variables → Actions](https://github.com/rechrom/website/settings/secrets/actions):
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
3. Push to `main` or manually run **Cloudflare Pages** in the Actions tab.

The first deployment automatically creates `rechrom-website` with production branch `main`. Subsequent deployments reuse it. An existing Git-integrated project or a different production branch is rejected without modifying its configuration.

Pull requests run syntax and local asset checks without deployment credentials. Production deploys only after those checks pass. Action revisions and Wrangler are pinned. Only `public/` is uploaded; local previews, comparison images, repository files and credentials are excluded.

Cloudflare's [Direct Upload CI guide](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/) describes the deployment method and token permissions. Custom domains are configured separately from deployment.

## Custom domains

Intended primary domain: `rechrom.dev`. Redirect domain: `rechrom.com`.

Both domains are attached to the Pages project and have Cloudflare Free DNS zones. Namecheap remains the registrar for `rechrom.dev`; Alibaba Cloud remains the registrar for `rechrom.com`. Both registrars now use `jeff.ns.cloudflare.com` and `natasha.ns.cloudflare.com`, as independently assigned to these two zones. The original Namecheap MX and SPF records were preserved. The original Alibaba Cloud DNS zone had no records.

Each apex has a proxied CNAME to `rechrom-website.pages.dev`. The `rechrom.com` zone has an active rule named **Rechrom canonical domain redirect**, matching the specification in `ops/rechrom-com-redirect.json` in the `http_request_dynamic_redirect` phase. It redirects to `https://rechrom.dev`, preserving the URL path and query string. Existing unrelated rules must be preserved when changing this configuration.

The custom-domain setup is separate from ordinary Actions deployment. Keep the deployment token scoped to Pages; DNS and redirect configuration was completed through the Cloudflare and registrar dashboards. `.cloudflare-domain-token` is gitignored and is not required for routine deployment.

Verification on October 1, 2026: both registrars saved the new nameservers, both Pages custom domains are active, and `https://rechrom.dev/` returns 200 with valid HTTPS. The `.com` HTTPS edge returns 301 with the original path and query string when tested using its current public DNS addresses. Cloudflare DNS resolves both domains; some local resolvers still have the previous `.com` negative DNS response cached. The Pages fallback remains available while those caches update.

## Site links

The GitHub links point to the Rechrom organization. Docs and the Reon app framework entry remain marked as coming soon until their sites exist.

## Assets

- Rechrom logo and layout demonstrations: project assets.
- Inter Tight and Inter: SIL Open Font License; licenses are included in `public/assets/`.
- GitHub icon: Octicons, MIT; included license.
- Chromium logo: unmodified asset from [browser-logos](https://github.com/alrra/browser-logos/tree/main/src/chromium); source recorded in `public/assets/chromium-logo-source.txt`. Chromium is a third-party trademark.
