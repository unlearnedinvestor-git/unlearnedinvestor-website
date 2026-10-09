# The Unlearned Investor

Astro website for The Unlearned Investor. Built for GitHub Pages with Substack RSS imports and Pages CMS.

## Development

```bash
npm install
npm run import:substack
npm run dev
npm run build
```

## Deployment

In repository Settings → Pages, set Source to **GitHub Actions**. The workflow builds on every push and checks the Substack feed every Monday. Keep the DNS for unlearnedinvestor.com unchanged until the GitHub Pages build succeeds and the preview has been reviewed. After review, add a CNAME and configure DNS.

## Editing

Open https://app.pagescms.org/ and explicitly grant access to this repository to edit articles in a browser.

Imported articles retain their original Substack canonical URL, to reduce duplicate-indexing issues. This site is educational and is not personalised financial advice.
