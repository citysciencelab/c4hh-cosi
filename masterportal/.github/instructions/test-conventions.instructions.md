---
applyTo: "**/*.spec.js"
---

# Test Conventions — Masterportal

## Stack
- **Vitest** — test runner (`describe`, `it`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll`)
- **Chai** — assertions (`expect`)
- **Sinon** — stubs, spies, fakes
- **@vue/test-utils** — Vue component mounting (`shallowMount`, `mount`)
- **Vuex** — `createStore` for component tests that need a store

## Forbidden
```js
// ESLint error — vitest/no-focused-tests
it.only(...)
describe.only(...)
```

## Discouraged — Technical Debt
```js
// Do not add new skip calls — fix the test instead or delete it
it.skip(...)
describe.skip(...)
```

Existing `.skip` calls are known technical debt. Do not add new ones.

## Action / Getter / Mutation Test Skeleton

```js
import {expect} from "chai";
import sinon from "sinon";
import actions from "@modules/myModule/store/actionsMyModule.js";

describe("src/modules/myModule/store/actionsMyModule", () => {
    let commit, dispatch, rootGetters;

    beforeEach(() => {
        commit = sinon.spy();
        dispatch = sinon.spy();
        rootGetters = {};
    });

    describe("myAction", () => {
        it("positive: commits expected value when given valid input", async () => {
            await actions.myAction({commit, dispatch, rootGetters}, "validInput");
            expect(commit.calledWith("setMyProp", "expectedValue")).to.be.true;
        });

        it("negative: does not commit when input is undefined", async () => {
            await actions.myAction({commit, dispatch, rootGetters}, undefined);
            expect(commit.called).to.be.false;
        });
    });
});
```

## Component Test Skeleton

```js
import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import MyModuleComponent from "@modules/myModule/components/MyModule.vue";

describe("src/modules/myModule/components/MyModule.vue", () => {
    let store, wrapper, isActive;

    beforeEach(() => {
        isActive = true;
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        MyModule: {
                            namespaced: true,
                            getters: {
                                myProp: () => "someValue",
                                active: () => isActive
                            },
                            actions: {
                                myAction: sinon.stub()
                            },
                            mutations: {
                                setMyProp: sinon.stub()
                            }
                        }
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {addSingleAlert: sinon.stub()}
                }
            },
            getters: {
                isMobile: () => false
            }
        });
    });

    afterEach(() => {
        // cleanup if needed (e.g., global variables set in beforeEach)
    });

    it("renders the component", () => {
        wrapper = shallowMount(MyModuleComponent, {
            global: {plugins: [store]}
        });
        expect(wrapper.find("#my-module").exists()).to.be.true;
    });

    it("does not render when inactive", () => {
        isActive = false;
        wrapper = shallowMount(MyModuleComponent, {
            global: {plugins: [store]}
        });
        expect(wrapper.find("#my-module").exists()).to.be.false;
    });
});
```

## Key Rules

- **Each function needs a positive test** (valid input produces expected output) **and a negative test** (invalid input: `undefined`, `[]`, `{}`, `""`, `null`)
- **`config.global.mocks.$t = key => key`** — no longer necessary; existing usages are known technical debt. Do not add to new tests; remove when touching a file that contains it.
- Use `shallowMount` by default; use `mount` only when child component rendering is explicitly under test
- Mock only what the component actually uses — do not replicate the entire real store
- Global variables (`Config`, `i18next`, `mapCollection`) are available in the jsdom environment as properties of `globalThis`. Assign them directly and clean up in `afterEach`:
  ```js
  let originalConfig;
  beforeEach(() => { originalConfig = globalThis.Config; globalThis.Config = {someKey: "value"}; });
  afterEach(() => { globalThis.Config = originalConfig; });
  ```
  Do **not** use `sinon.stub(global, 'Config')` — it throws if the property is non-configurable or does not exist on the target object.

## Test File Location & Global Setup

Test files are discovered automatically — place them mirroring the source structure:

```
src/modules/myModule/tests/unit/
addons/myAddon/tests/unit/
  ├── components/
  │   └── MyComponent.spec.js      ← tests for MyComponent.vue
  ├── store/
  │   ├── actionsMyModule.spec.js  ← tests for actions
  │   ├── gettersMyModule.spec.js  ← tests for getters
  │   └── mutationsMyModule.spec.js ← tests for mutations
  └── js/                          ← tests for utility functions (if js/ folder exists)
      └── utility.spec.js
```

The test file structure **mirrors** the source structure: one test file per source file.


Every test also has access to these global mocks (from `devtools/tests/vitest.setup.js`) — do not replicate in individual test files:

- **`config.global.mocks.$t` and `config.global.mocks.t`** — set for all components; old tests may still add these per-file (technical debt — remove when touching a file)
- **`enableAutoUnmount`** — `wrapper.unmount()` in `afterEach` is therefore optional but not harmful
- **`i18next` and `i18next-vue`** — globally mocked via `vi.mock()`
- **`fetch`** — throws an error if not mocked; always stub `fetch` in tests that trigger it
- **`ResizeObserver`**, **`CanvasPattern`**, **`window.matchMedia`** — polyfilled
- **`Cesium`** — globally mocked
