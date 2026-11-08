# Playground

- This repo is a playground for design and code experiments; experiments are regularly replaced.
- It is deployed with GitHub Pages under the `/<repo>/` subpath, so all links and assets must respect the base path: read `BASE_PATH` (e.g. `/<repo>/`) at build time and never hard-code a leading `/`.
- Builds output to `dist/` (the deploy workflow runs the `build` script when `package.json` exists). Experiments without a build can live in the repository root and use relative URLs.
- Before finishing, run the production build, push to `main` and confirm the deploy workflow succeeded.
- No personal names in code, comments, docs or commits.
- Shared contracts: docs/contracts.md.
- Parallel sessions push only their own branch; only the foundation and integration sessions push main.
