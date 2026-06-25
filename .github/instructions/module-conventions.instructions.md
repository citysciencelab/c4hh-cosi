---
applyTo: "src/modules/**"
---

# Module Conventions — Masterportal

## Required File Structure (A.9.1)

Every new module must follow this layout exactly:

```
src/modules/myModule/
  components/
    MyModule.vue              ← component name must match folder (PascalCase)
  store/
    actionsMyModule.js
    gettersMyModule.js
    mutationsMyModule.js
    stateMyModule.js
    indexMyModule.js          ← wires store together
    constantsMyModule.js      ← optional, for enums/constants
  tests/unit/
    components/MyModule.spec.js
    store/
      actionsMyModule.spec.js
      gettersMyModule.spec.js
      mutationsMyModule.spec.js
```

## Store Wiring — `indexMyModule.js`

```js
import actions from "./actionsMyModule.js";
import mutations from "./mutationsMyModule.js";
import getters from "./gettersMyModule.js";
import state from "./stateMyModule.js";

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
};
```

After creating a module, register it in `src/modules/modules-store/indexModules.js` by importing the index and adding it under the `modules` key.

## Generator Utilities (B.4.1)

Use `generateSimpleMutations` and `generateSimpleGetters` from `@shared/js/utils/generators.js` instead of writing manual setters/getters for every state property:

```js
// mutationsMyModule.js
import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import state from "./stateMyModule.js";

const mutations = {
    ...generateSimpleMutations(state)
    // add custom mutations below as needed
};

export default mutations;
```

```js
// gettersMyModule.js
import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import state from "./stateMyModule.js";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
```

`generateSimpleMutations` creates a `setKey(state, value)` setter for every key in the state object. `generateSimpleGetters` creates a `key(state)` getter for every key.

## State File Pattern

```js
// stateMyModule.js
const state = {
    type: "myModule",
    name: "common:modules.myModule.name",
    icon: "bi-example",
    active: false
    // add module-specific properties here
};

export default state;
```

## JSDoc (Required — A.4.3)

Every `function` declaration, class method, and class declaration requires a JSDoc block. Arrow functions and function expressions are exempt.

```js
/**
 * Loads features from the given layer and commits them to state.
 * @param {Object} context Vuex action context.
 * @param {string} layerId The layer identifier to load features from.
 * @returns {Promise<void>}
 */
async function loadFeatures ({commit, dispatch}, layerId) {
    // ...
}
```

## Internationalization (A.7)

Never hardcode user-visible text. Use i18n keys only:

```js
// In Vue templates (inside a bound attribute — single quotes required by HTML syntax):
$t('common:modules.myModule.someLabel')

// In JavaScript:
i18next.t("common:modules.myModule.someLabel")
```

Add every new key to **all 10** locale files:
`locales/de/common.json`, `locales/en/common.json`, `locales/es/common.json`, `locales/it/common.json`, `locales/nl/common.json`, `locales/platt/common.json`, `locales/pt/common.json`, `locales/ru/common.json`, `locales/tr/common.json`, `locales/ua/common.json`

The fallback language is German (`de`). At minimum always fill `de` and `en`.

## Additional ESLint Rules Active in Modules

Beyond the core rules in `copilot-instructions.md`:

- `consistent-return` — a function must **always** return a value or **never** return one; mixing is an error
- `padding-line-between-statements` — a blank line is **required** after any `const`/`let`/`var` block before non-declaration statements
- `no-shadow` — variable names must not shadow names from an outer scope
- `no-empty-function` — empty function bodies require at least a comment inside

## Changelog

New module additions and changes go into `CHANGELOG.md` under `## Unreleased → Added` or `Changed`. Plain English, no jargon.
