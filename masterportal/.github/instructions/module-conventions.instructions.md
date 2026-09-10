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
  js/                         ← optional, for utility functions
    utility.js
  tests/unit/
    components/MyModule.spec.js
    store/
      actionsMyModule.spec.js
      gettersMyModule.spec.js
      mutationsMyModule.spec.js
    js/                       ← tests for utility functions (if js/ folder exists)
      utility.spec.js
```

## Store Wiring — `indexMyModule.js`

```js
import actions from "./actionsMyModule.js";
import mutations from "./mutationsMyModule.js";
import getters from "./gettersMyModule.js";
import state from "./stateMyModule.js";

export default {
    namespaced: true, // always true — scopes getters/actions/mutations under "Modules/MyModule/..."
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
    description: "common:modules.myModule.description",
    icon: "bi-example",
    supportedDevices: ["Desktop", "Mobile"],
    supportedMapModes: ["2D"],
    hasMouseMapInteractions: true  // only if interactions with map/mouse are required
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

/**
 * Formats a coordinate pair as a human-readable string.
 * @param {number} lon Longitude value.
 * @param {number} lat Latitude value.
 * @returns {string} The formatted coordinate string, e.g. "53.55°N 10.00°E".
 */
function formatCoordinate (lon, lat) {
    // ...
}
```

When `@returns` is not `void`, always include a description of what is returned.

## Function Length & Responsibility

For modules, apply the global function-size and complexity guardrails from `.github/copilot-instructions.md`.

Module-specific emphasis:

- Prefer one responsibility per function and extract helpers when logic naturally separates
- Keep helper functions close to usage: start module-local in `src/modules/{moduleName}/js/` (or in the local store file when tightly coupled), and move to `src/shared/js/utils/` once logic is reused across modules
- Treat large action functions as refactoring candidates early to keep tests focused and readable

## Internationalization (A.7)

Never hardcode user-visible text. Use i18n keys only:

```js
// In Vue templates (inside a bound attribute — single quotes required by HTML syntax):
$t('common:modules.myModule.someLabel')

// In JavaScript:
i18next.t("common:modules.myModule.someLabel")
```

Add every new key to **at least German and English** locale files:
`locales/de/common.json`, `locales/en/common.json`

Other languages (`es`, `it`, `nl`, `platt`, `pt`, `ru`, `tr`, `ua`) can be added but are not required.

## Additional ESLint Rules Active in Modules

Beyond the core rules in `copilot-instructions.md`:

- `consistent-return` — a function must **always** return a value or **never** return one; mixing is an error
- `padding-line-between-statements` — a blank line is **required** after any `const`/`let`/`var` block before non-declaration statements
- `no-shadow` — variable names must not shadow names from an outer scope
- `no-empty-function` — empty function bodies require at least a comment inside

## Changelog

New module additions and changes go into `CHANGELOG.md` under `## Unreleased → Added` or `Changed`. Plain English, no jargon.
