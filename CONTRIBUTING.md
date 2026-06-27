# Contributing to Salmon AR

Thanks for your interest in improving Salmon AR! This project is intentionally small — a static WebAR demo with a tiny Node server — so contributions should stay focused and easy to review.

## Ways to help

- **Bug reports** — use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) and include browser, device, and how you're serving the app (localhost, Railway URL, etc.)
- **Documentation** — clearer README sections, troubleshooting notes, or deployment guides
- **AR experience** — marker tuning, salmon animation, lighting, or model improvements in `index.html`
- **Infrastructure** — server hardening, deploy config, or CI checks

## Development setup

```bash
git clone https://github.com/TheMitchyBoy/Salmon-AR.git
cd Salmon-AR
npm start
```

Open http://localhost:8080. No install step — there are no npm dependencies beyond Node itself.

## Pull request guidelines

1. Keep changes scoped to one concern per PR
2. Test on a mobile browser when touching AR, camera, or asset loading
3. Preserve the self-hosted `vendor/` approach — avoid adding CDN-only dependencies
4. Update the README if you change deploy steps, file layout, or troubleshooting behavior

## Code style

- Match existing patterns in `index.html` and `server.js`
- Prefer clear inline comments for non-obvious AR/MindAR behavior
- Do not add heavyweight build tooling unless there's a strong reason

## Questions

Open a [GitHub issue](https://github.com/TheMitchyBoy/Salmon-AR/issues) for questions or ideas before large refactors.
