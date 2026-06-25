---
applyTo: "**/*.spec.js"
---

# Test Conventions — Masterportal

## Stack
- **Vitest** — test runner (`describe`, `it`, `beforeEach`, `afterEach`)
- **Chai** — assertions (`expect`)
- **Sinon** — stubs, spies, fakes
- **@vue/test-utils** — Vue component mounting (`shallowMount`, `mount`)
- **Vuex** — `createStore` for component tests that need a store

## Forbidden
```js
// ESLint error — vitest/no-focused-tests
it.only(...)
test.only(...)
describe.only(...)
```

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
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import MyModuleComponent from "@modules/myModule/components/MyModule.vue";

// Mock i18next — always add this at file level for components
config.global.mocks.$t = key => key;

describe("src/modules/myModule/components/MyModule.vue", () => {
    let store, wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        MyModule: {
                            namespaced: true,
                            getters: {
                                myProp: () => "someValue",
                                active: () => true
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
                // Add other top-level modules your component dispatches to:
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
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("renders the component", () => {
        wrapper = shallowMount(MyModuleComponent, {
            global: {plugins: [store]}
        });
        expect(wrapper.find("#my-module").exists()).to.be.true;
    });

    it("does not render when inactive", () => {
        // override getter for this test
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        MyModule: {namespaced: true, getters: {active: () => false}}
                    }
                }
            }
        });
        wrapper = shallowMount(MyModuleComponent, {
            global: {plugins: [store]}
        });
        expect(wrapper.find("#my-module").exists()).to.be.false;
    });
});
```

## Key Rules

- **Each function needs a positive test** (valid input produces expected output) **and a negative test** (invalid input: `undefined`, `[]`, `{}`, `""`, `null`)
- **Always call `sinon.restore()`** in `afterEach` — sinon stubs on imported modules persist between tests within the same file when `isolate: false` is set in vitest config
- **`config.global.mocks.$t = key => key`** — add at file level for all component tests; prevents i18n errors
- Use `shallowMount` by default; use `mount` only when child component rendering is explicitly under test
- Mock only what the component actually uses — do not replicate the entire real store
- Global variables (`Config`, `i18next`, `mapCollection`) are available in the jsdom environment as properties of `globalThis`. Assign them directly and clean up in `afterEach`:
  ```js
  let originalConfig;
  beforeEach(() => { originalConfig = globalThis.Config; globalThis.Config = {someKey: "value"}; });
  afterEach(() => { globalThis.Config = originalConfig; });
  ```
  Do **not** use `sinon.stub(global, 'Config')` — it throws if the property is non-configurable or does not exist on the target object.

## Test File Location

```
src/modules/myModule/tests/unit/
  components/MyModule.spec.js      ← component tests (PascalCase, matches component filename)
  store/
    actionsMyModule.spec.js
    gettersMyModule.spec.js
    mutationsMyModule.spec.js

addons/myAddon/tests/              ← addon tests (flat, no tests/unit/ subfolder)
  components/MyAddon.spec.js
  store/actionsMyAddon.spec.js
```

Test files are auto-discovered by two patterns defined in `devtools/vitest.config.js`:
- `src/**/*.spec.js` — all core module tests
- `addons/**/*.spec.js` — all addon tests

The `applyTo` pattern in this file's frontmatter (`**/*.spec.js`) intentionally covers both locations.
