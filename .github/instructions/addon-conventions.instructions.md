---
applyTo: "addons/**"
---

# Addon Conventions — Masterportal

## Overview
The `addons/` folder is a **co-located independent Git repository** — not a submodule. It has its own `.git/` directory pointing to a separate remote (`bitbucket.org/geowerkstatt-hamburg/addons.git`), its own `package.json`, and its own `CHANGELOG.md`. Addons are optional feature plugins loaded dynamically at runtime.

**Workflow**: Changes inside `addons/` must be committed and pushed to the addons remote separately from the main repo. The two repositories share a working directory but have completely independent Git histories and release cycles.

To run the full CI gate: `npm run prePushHook` from the **main repo root** (covers all addon files automatically).

---

## Addon Registration — three required steps

1. **Create** `addons/{name}/` with the structure below.
2. **Register** in `addons/addonsConf.json`:
   ```json
   "myAddon": { "type": "tool" }
   ```
   Add `"path"` only when the folder name differs from the key (e.g. GFI themes inside `gfiThemes/`):
   ```json
   "myTheme": { "type": "gfiTheme", "path": "gfiThemes/myTheme" }
   ```
3. **Activate** per portal by adding the key to `Config.addons` in `portal/{portalName}/config.js`:
   ```js
   Config.addons = ["existingAddon", "myAddon"];
   ```

---

## Addon Types & `index.js` Export Shape

| Type | `index.js` default export |
|------|--------------------------|
| `tool` | `{ component, store, locales: { de: deLocale, en: enLocale } }` |
| `control` | `{ component, store }` |
| `gfiTheme` | `{ component, store }` |
| `searchInterface` | `{ [interfaceKey]: searchInterfaceInstance }` |
| `javascript` | any — loaded and executed directly |
| `vueComponent` | Vue component registered globally |

Example for a `tool`:
```js
import MyAddonComponent from "./components/MyAddon.vue";
import MyAddonStore from "./store/indexMyAddon.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: MyAddonComponent,
    store: MyAddonStore,
    locales: {de: deLocale, en: enLocale}
};
```

---

## Folder Structure

```
addons/myAddon/               ← tool / control / gfiTheme
  components/MyAddon.vue
  store/
    actionsMyAddon.js    gettersMyAddon.js
    mutationsMyAddon.js  stateMyAddon.js
    indexMyAddon.js
  locales/
    de/additional.json   ← NOT common.json
    en/additional.json
  tests/                 ← note: tests/ (flat), not tests/unit/
    components/MyAddon.spec.js
    store/actionsMyAddon.spec.js
  index.js

addons/searchInterfaces/mySearch/    ← searchInterface
  js/searchInterfaceMySearch.js
  tests/
  index.js
```

**Locale files are `additional.json`, not `common.json`** — addon translations are merged under the `additional` namespace at runtime. Access them via `$t("additional:myAddon.key")`.

---

## ESLint — Relaxed Rules for Addons

The following rules are **turned off** for all `addons/**` files (defined in root `eslint.config.js`). Native HTML that is banned in `src/` is allowed in addons:

- `no-restricted-syntax` — `<input type="text">`, `<input>` without type, `<button class="accordion-button">`, and `<li>` parent restrictions do **not** apply
- `vue/no-restricted-syntax` — same relaxation for Vue templates
- `vue/no-deprecated-delete-set`, `vue/no-deprecated-model-definition`, `jsdoc/ts-no-empty-object-type`
- Import extension enforcement is also off for addons

All other rules from the root config still apply: `no-console` (warn/error only), `prefer-const`, `eqeqeq`, `func-style: declaration`, JSDoc on function declarations, Stroustrup braces, double-quoted strings, semicolons.

---

## Changelog
Addon changes go into `addons/CHANGELOG.md` under `## Unreleased` (separate from the root `CHANGELOG.md`), using: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`.
