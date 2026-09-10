# GitHub Copilot Instructions — Masterportal

## Project Overview
Masterportal is an open-source web geoportal toolkit built on **Vue 3 + Vuex 4 + OpenLayers + Cesium**. It provides a configurable GIS portal framework maintained by Geowerkstatt Hamburg. The codebase is large: 50+ core modules, 40+ addons, 10 supported languages. There is no automated CI pipeline — all validation must be run locally via `npm run prePushHook` before pushing.

---

## Runtime Requirements

Authoritative constraints live in `package.json#engines` — always check there if these appear outdated:
- **Node**: `>=22.19.0 <23` or `>=24 <25`
- **npm**: `>=10.9.3 <12`
- Always run `npm install` before any build, test, or lint command.

---

## Commands (trust these; do not search for alternatives)

| Purpose | Command |
|---------|---------|
| Install dependencies | `npm install` |
| Dev server (HTTPS, port 9001) | `npm start` |
| Run all unit tests | `npm test` |
| Lint — check only | `npm run lint` |
| Lint — auto-fix | `npm run lint:fix` |
| **Full CI gate (always run before done)** | `npm run prePushHook` |
| Production build | `npm run build` |
| Generate JSDoc HTML | `npm run buildJsDoc` |

`npm run prePushHook` runs the config-doc parser, ESLint with `--max-warnings 0`, then all unit tests. It is the canonical validation gate — run it before considering any change complete. The `test` script in `package.json` is currently defined as `rimraf node_modules/.vite && vitest run …`, so it clears the Vite cache before each run; verify the script definition if this behaviour appears to have changed.

---

## Project Layout

```
src/
  app-store/          ← Vuex root store (state, getters, mutations, actions)
  core/layers/        ← Layer abstractions (Layer2d, Layer2dVector, WMS, etc.)
  modules/            ← Feature modules (50+: draw, print, filter, login, …)
  shared/             ← Shared Vue components & JS utilities (use these first)
  plugins/            ← Vue plugins (i18next, vuetify, …)
  assets/             ← SCSS (variables.scss, Bootstrap 5.3 theming)
  App.vue             ← Root component
  masterportal.js     ← Application entry point
addons/               ← Optional plugins (40+); addonsConf.json configures them
devtools/
  vite.config.js      ← Vite config (dev + prod, HTTPS, all path aliases)
  vitest.config.js    ← Vitest config (jsdom, forks pool, no file parallelism)
locales/{de,en,es,it,nl,platt,pt,ru,tr,ua}/common.json  ← i18n translation files
eslint.config.js      ← ESLint flat config v10 (very strict — read below)
jsconfig.json         ← Path aliases for IDE resolution
portal/               ← Portal instances: auto/, basic/, master/
docs/                 ← mkdocs user & developer documentation
```

### New module structure (required by [coding convention A.9.1](docs/Dev/Contributing/codingConventions.md#a9-file-structure))
```
src/modules/myModule/
  components/MyModule.vue
  store/
    actionsMyModule.js    gettersMyModule.js
    mutationsMyModule.js  stateMyModule.js
    indexMyModule.js      constantsMyModule.js  (if needed)
  js/                     (optional, for utility functions)
    utility.js
  tests/unit/
    components/MyModule.spec.js
    store/
      actionsMyModule.spec.js  gettersMyModule.spec.js  mutationsMyModule.spec.js
    js/                   (if js/ folder exists)
      utility.spec.js
```

---

## Critical ESLint Rules — violations fail `prePushHook`

### Imports — file extensions are **mandatory**
```js
// ✅ correct
import actions from "@modules/featureLister/store/actionsFeatureLister.js";
import Comp from "@shared/modules/accordion/components/AccordionItem.vue";
import Draw from "ol/interaction/Draw.js";

// ❌ wrong — ESLint error
import actions from "@modules/featureLister/store/actionsFeatureLister";
import Draw from "ol/interaction/Draw";
```
Prefer the path aliases (`@appstore`, `@shared`, `@core`, `@modules`, `@plugins`) over deep relative paths where available. Alias imports require `.js` or `.vue`. Relative imports require `.js`, `.vue`, `.json`, `.css`, `.scss`, or `.sass`. Note: style files (`.css`, `.scss`, `.sass`) must always be imported relatively, as the alias rule only permits `.js` and `.vue`.

### General code rules
- `no-console` — only `console.warn()` and `console.error()` are allowed
- `no-var` / `prefer-const` — use `const`/`let` exclusively
- `eqeqeq` — always use `===`
- `no-param-reassign` — never mutate function parameters
- `func-style: declaration` — use named function declarations (`function foo () {}`), not `const foo = function () {}`
- Stroustrup brace style: opening `{` on the same line as the statement, closing `}` on its own line, `else`/`catch` on the line **after** `}` — never `} else {` on the same line
- Double-quoted strings (`@stylistic/quotes` defaults to `"double"`), semicolons required, file must end with a newline

### Function Size & Complexity Guardrails (for coding and reviews)
- Preferred function length: **10-30 lines**
- Soft review threshold: **>40 lines** — check whether extraction into helper functions improves readability
- Hard review trigger: **>60 lines** — requires explicit justification in review or refactoring
- Prefer one responsibility per function; if a function contains clearly separable phases (e.g. validation, transformation, side effects), split them
- Keep parameter lists short (prefer up to 4 parameters); use a config object if many optional values are needed
- Watch complexity signals: deep nesting, many branches, mixed sync/async flow, and repeated condition patterns
- If behavior needs both positive and negative paths, ensure both are covered by tests

### Vue template rules
- **4-space indent** inside `<template>`; **max 1 attribute per line**
- `<input type="text">` and `<input>` without `type` are **banned** — use `<InputText>` from `@shared/modules/inputs/components/InputText.vue`
- `<button class="accordion-button">` is **banned** — use `<AccordionItem>` from `@shared/modules/accordion/components/AccordionItem.vue`
- `<li>` must be a direct child of `<ol>`, `<ul>`, or `<menu>`
- Component filename must match `name` exactly; styles must be `scoped`; no inline styles; no `!important`
- See `.github/instructions/vue-conventions.instructions.md` for the full shared component inventory and SCSS rules.

### Test files
- `vitest/no-focused-tests` — `test.only()`, `it.only()`, `describe.only()` are **forbidden** (ESLint error)

---

## Other Required Conventions
- **JSDoc**: Required on every `function` declaration, class method, and class declaration (arrow functions exempt). See `.github/instructions/module-conventions.instructions.md` for examples.
- **i18n**: Never hardcode text. Use `$t('common:modules.myModule.key')` in templates, `i18next.t(...)` in JS. Add keys to at least German and English locale files (`locales/de/common.json`, `locales/en/common.json`). Fallback language: German.
- **Tests**: `**/*.spec.js` under `tests/unit/`. Use **chai** + **vitest** + **sinon**. Each function needs a positive and a negative test. See `.github/instructions/test-conventions.instructions.md` for setup patterns.
- **Changelog**: Every user-visible or behavioral change needs an entry in `CHANGELOG.md` under `## Unreleased` (`Added`, `Changed`, `Deprecated`, `Removed`, or `Fixed`). Plain English only. Pure housekeeping (JSDoc, test additions, internal refactoring without behavior change) does not require an entry.

---

## Addon System
Addons live in `addons/` — a **co-located independent Git repository** (not a submodule; has its own `.git/` directory and a separate remote at `bitbucket.org/geowerkstatt-hamburg/addons.git`). Addon changes must be committed and pushed to the addons remote independently from the main repo. It has its own `package.json` and `CHANGELOG.md`. Three steps to add one:
1. Create `addons/{name}/` with `index.js`, `components/`, `store/`, `locales/`
2. Register in `addons/addonsConf.json`: `"myAddon": { "type": "tool" }` (add `"path"` only when the folder name differs from the key)
3. Activate per portal: add the key to `Config.addons` in `portal/{name}/config.js`. The key must also be registered in `addons/addonsConf.json`.

**Addon types**: `tool`, `gfiTheme`, `searchInterface`, `control`, `javascript`, `vueComponent`. The `index.js` default export for `tool`/`control`/`gfiTheme` is `{ component, store, locales }`. For `searchInterface`: `{ [key]: interfaceInstance }`.

**Locale path**: `addons/{name}/locales/{lang}/additional.json` — **not** `common.json`.

**ESLint**: `no-restricted-syntax` and `vue/no-restricted-syntax` are **off** for all `addons/**` files — the `<InputText>`, `<AccordionItem>`, and `<li>` parent restrictions do **not** apply inside addons.

---

## Portal Configuration
Each portal lives in `portal/{name}/` (`auto`, `basic`, `master`) with two distinct config files — do not confuse them:
- **`config.js`** — runtime globals: `Config.addons` (active addon list), `Config.layerConf`, `Config.restConf`, `Config.styleConf`, OIDC/login settings. This file sets Node-level globals.
- **`config.json`** — UI layout: menus, map settings, module configuration, layer tree structure.

---

## Scoped Instruction Files
For detailed conventions, read the relevant file before making changes:
- Editing `src/modules/**` → `.github/instructions/module-conventions.instructions.md`
- Editing any `*.vue` file → `.github/instructions/vue-conventions.instructions.md`
- Editing any `*.spec.js` file → `.github/instructions/test-conventions.instructions.md`
- Editing `addons/**` → `.github/instructions/addon-conventions.instructions.md`

---

## Global Variables (available everywhere — do not import)
`Config`, `Cesium`, `i18next`, `mapCollection`, `moduleCollection`, `StreetSmartApi`, `MASTERPORTAL_BASE_PATH`, `MASTERPORTAL_ASSETS_PATH`
