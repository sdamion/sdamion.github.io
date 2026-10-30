# Mesh Browser Bundle

Self-hosted Mesh SDK 1.9.1 for member wallets, staking and governance. Runtime
imports do not depend on a third-party module CDN. Only the exports used by the
website are exposed. Browser polyfills and dependency versions are locked.

Rebuild from the repository root:

```sh
npm ci --ignore-scripts --prefix vendor/mesh-src
npm run build --prefix vendor/mesh-src
```

Commit `vendor/mesh.js`, `vendor/mesh.js.LEGAL.txt` and the build sources/lockfile.
Keep the generated license notices beside the bundle. Update the module cache
version in all three consumers after rebuilding.
