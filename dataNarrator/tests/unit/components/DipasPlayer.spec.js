import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import {vi, beforeEach, afterEach, describe, it} from "vitest";
import DipasPlayer from "../../../components/storyPlayer/DipasPlayer.vue";


describe("addons/dataNarrator/tests/unit/DipasPlayer.spec.js", () => {
    let steps;
    let store;
    let wrapper;
    let storyConf;
    let toolDiv;
    let headingDiv;

    /**
     * Helper function to create a fresh store
     * @param {Object} storyConfOverride - Optional override for storyConf
     * @returns {Object} Vuex store
     */
    function createTestStore (storyConfOverride = null, isMobile = false) {
        const conf = storyConfOverride || {
            title: "Geschichten mit Karten erzählen",
            showDipasLogo: true,
            showHomeButton: true,
            styleCSS: "",
            coverImagePath: "",
            coverImageAlt: "",
            coverImageCaption: "",
            coverImageCopyright: ""
        };

        return createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        DataNarrator: {
                            namespaced: true,
                            state: () => ({
                                showLoadingSpinner: false,
                                autoplay: false,
                                storyConf: conf
                            }),
                            getters: {
                                showLoadingSpinner: state => state.showLoadingSpinner,
                                autoplay: state => state.autoplay,
                                storyConf: state => state.storyConf
                            },
                            mutations: {}
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    state: () => ({
                        mainMenu: {sections: []},
                        secondaryMenu: {sections: []},
                        secondaryExpanded: true,
                        mainExpanded: false,
                        menuBySide: "40%"
                    }),
                    getters: {
                        mainMenu: state => state.mainMenu,
                        secondaryMenu: state => state.secondaryMenu,
                        secondaryExpanded: state => state.secondaryExpanded,
                        mainExpanded: state => state.mainExpanded,
                        menuBySide: state => side => state[side] || {}
                    },
                    mutations: {
                        setExpandedBySide: (state, {expanded, side}) => {
                            state[`${side}Expanded`] = expanded;
                        }
                    }
                }
            },
            getters: {
                isMobile: () => isMobile,
                uiStyle: () => "DEFAULT"
            },
            mutations: {
                setDeviceMode (state, mode) {
                    state.deviceMode = mode;
                }
            }
        });
    }

    /**
     * Helper function to mount the component
     * @param {Object} storeInstance - Vuex store instance
     * @returns {Object} Vue wrapper
     */
    function mountComponent (storeInstance, isMobileDevice = false) {
        return shallowMount(DipasPlayer, {
            props: {
                steps,
                stepsobjects: [],
                storyConfPath: "",
                isMobileDevice,
                screenOrientationType: screen.orientation?.type || "portrait-primary"
            },
            global: {
                plugins: [storeInstance],
                mocks: {
                    $t: key => key
                },
                stubs: {
                    teleport: true,
                    TableOfContents: true
                }
            }
        });
    }

    /**
     * Helper to mock matchMedia
     * @param {boolean} matches - whether media query matches
     * @returns {void}
     */
    function mockMatchMedia (matches) {
        vi.stubGlobal("matchMedia", (query) => ({
            matches,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn()
        }));
    }

    /**
     * Helper to mock screen orientation
     * @param {string} type - orientation type e.g. "portrait-primary" or "landscape-primary"
     * @returns {void}
     */
    function mockScreenOrientation (type) {
        Object.defineProperty(screen, "orientation", {
            value: {
                type,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            },
            configurable: true,
            writable: true
        });
    }

    /**
     * Helper to mock navigator.userAgent for mobile
     * @param {boolean} isMobile - whether to simulate mobile user agent
     * @returns {void}
     */
    function mockUserAgent (isMobile) {
        Object.defineProperty(navigator, "userAgent", {
            value: isMobile
                ? "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
                : "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            configurable: true,
            writable: true
        });
    }

    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal("scrollTo", vi.fn());

        // Use vi.stubGlobal for proper cleanup
        vi.stubGlobal("IntersectionObserver", class {
            /**
             * mock implementation
             */
            observe () {
                return null;
            }
            /**
             * mock implementation
             */
            unobserve () {
                return null;
            }
            /**
             * mock implementation
             */
            disconnect () {
                return null;
            }
        });

        vi.stubGlobal("XMLHttpRequest", class {
            /**
             * mock implementation
             */
            open () {
                return null;
            }
            /**
             * mock implementation
             */
            send () {
                return null;
            }
            /**
             * mock implementation
             */
            setRequestHeader () {
                return null;
            }
            /**
             * mock implementation
             */
            abort () {
                return null;
            }
            /**
             * mock implementation
             */
            addEventListener () {
                return null;
            }
            /**
             * mock implementation
             */
            removeEventListener () {
                return null;
            }
            /**
             * mock implementation
             */
            get responseText () {
                return "";
            }
            /**
             * mock implementation
             */
            get readyState () {
                return 4;
            }
            /**
             * mock implementation
             */
            get status () {
                return 200;
            }
        });

        // Create DOM elements needed by the component
        toolDiv = document.createElement("div");
        toolDiv.id = "mp-body-secondaryMenu";
        Object.defineProperty(toolDiv, "clientWidth", {
            value: 500,
            configurable: true,
            writable: true
        });
        document.body.appendChild(toolDiv);

        headingDiv = document.createElement("div");
        headingDiv.id = "mp-menu-navigation-secondaryMenu";
        headingDiv.style.display = "block";
        document.body.appendChild(headingDiv);

        // Mocked steps data
        steps = [
            {
                title: "Die Daten der Stadt"
            },
            {
                title: "Hamburg ist Grün"
            },
            {
                title: "Hamburg ist Blau"
            }
        ];
        // Mocked storyConf data
        storyConf = {
            title: "Geschichten mit Karten erzählen",
            showDipasLogo: true,
            showHomeButton: true,
            styleCSS: "",
            coverImagePath: "",
            coverImageAlt: "",
            coverImageCaption: "",
            coverImageCopyright: ""
        };
        // Create store and mount wrapper
        store = createTestStore(storyConf);
        wrapper = mountComponent(store);
    });

    afterEach(() => {
        // Unmount wrapper first
        if (wrapper) {
            wrapper.unmount();
            wrapper = null;
        }

        vi.runAllTimers();
        vi.useRealTimers();

        // Clean up DOM elements
        const existingToolDiv = document.getElementById("mp-body-secondaryMenu");

        if (existingToolDiv && existingToolDiv.parentNode) {
            existingToolDiv.parentNode.removeChild(existingToolDiv);
        }
        toolDiv = null;

        const existingHeadingDiv = document.getElementById("mp-menu-navigation-secondaryMenu");

        if (existingHeadingDiv && existingHeadingDiv.parentNode) {
            existingHeadingDiv.parentNode.removeChild(existingHeadingDiv);
        }
        headingDiv = null;

        // Restore all mocks and stubs
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("DipasPlayer should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("renders the main story title from storyConf.title in the DOM", () => {
        const storyTitleElement = wrapper.find(".storyTitle h1");

        expect(storyTitleElement.exists()).to.be.true;
        expect(storyTitleElement.text()).to.equal(storyConf.title);
    });

    it("renders step titles in the DOM from mocked steps", () => {
        const stepElements = wrapper.findAll(".stepper");

        steps.forEach(step => {
            const el = stepElements.find(e => e.text().includes(step.title));

            expect(el).to.exist;
        });

        expect(stepElements.length).to.equal(steps.length);
    });

    it("each .stepper has correct index and class for first/last step", () => {
        const stepElements = wrapper.findAll(".stepper");

        expect(stepElements.length).to.equal(steps.length);

        stepElements.forEach((el, idx) => {
            // Check firstStep class
            if (idx === 0) {
                expect(el.classes()).to.include("firstStep");
            }
            else {
                expect(el.classes()).to.not.include("firstStep");
            }

            // Check lastStep class
            if (idx === steps.length - 1) {
                expect(el.classes()).to.include("lastStep");
            }
            else {
                expect(el.classes()).to.not.include("lastStep");
            }
        });
    });

    it("renders home button only if storyConf.showHomeButton is true", () => {
        expect(wrapper.find(".home-button").exists()).to.be.true;
    });

    it("does not render home button if storyConf.showHomeButton is false", () => {
        wrapper.unmount();
        const newStore = createTestStore({
            ...storyConf,
            showHomeButton: false
        });

        wrapper = mountComponent(newStore);

        expect(wrapper.find(".home-button").exists()).to.be.false;
    });

    it("renders DIPAS logo only if storyConf.showDipasLogo is true", () => {
        expect(wrapper.find(".dipasLogo").exists()).to.be.true;
    });

    it("does not render DIPAS logo if storyConf.showDipasLogo is false", () => {
        wrapper.unmount();
        const newStore = createTestStore({
            ...storyConf,
            showDipasLogo: false
        });

        wrapper = mountComponent(newStore);

        expect(wrapper.find(".dipasLogo").exists()).to.be.false;
    });

    it("renders navigation buttons", () => {
        const prevButton = wrapper.find(".nav-buttons .bootstrap-icon:nth-child(1)"),
            nextButton = wrapper.find(".nav-buttons .bootstrap-icon:nth-child(2)");

        expect(prevButton.exists(), "Previous navigation button should exist").to.be.true;
        expect(nextButton.exists(), "Next navigation button should exist").to.be.true;
    });

    it("toggles the table of contents when the button is clicked", async () => {
        expect(wrapper.find(".table-of-contents").exists()).to.be.false;

        const tocButton = wrapper.find(".tob-button");

        expect(tocButton.exists(), "TOC button should exist").to.be.true;

        await tocButton.trigger("click");
        expect(wrapper.find(".table-of-contents").exists()).to.be.true;

        await tocButton.trigger("click");
        expect(wrapper.find(".table-of-contents").exists()).to.be.false;
    });

    // ── Mobile / Orientation Tests ──────────────────────────────────────────

    describe("mobile portrait mode", () => {
        beforeEach(() => {
            mockUserAgent(true);
            mockMatchMedia(true); // max-width: 768px matches
            mockScreenOrientation("portrait-primary");

            wrapper.unmount();
            store = createTestStore(storyConf, true);
            wrapper = mountComponent(store, true);
        });

        it("renders drag-indicator in mobile portrait mode", () => {
            expect(wrapper.find(".drag-indicator").exists()).to.be.true;
        });

        it("isMobilePortrait computed is true when userAgent is mobile and orientation is portrait", () => {
            expect(wrapper.vm.isMobilePortrait).to.be.true;
        });

        it("cssVars uses portrait tob-button-top value (9%) in mobile portrait", () => {
            expect(wrapper.vm.cssVars["--tob-button-top"]).to.equal("9%");
        });

        it("cssVars uses portrait progress-bottom value (12px) in mobile portrait", () => {
            expect(wrapper.vm.cssVars["--progress-bottom"]).to.equal("12px");
        });

        it("still renders all stepper elements in mobile portrait mode", () => {
            expect(wrapper.findAll(".stepper").length).to.equal(steps.length);
        });

        it("still renders navigation buttons in mobile portrait mode", () => {
            expect(wrapper.find(".nav-buttons").exists()).to.be.true;
        });

        it("still renders tob-button in mobile portrait mode", () => {
            expect(wrapper.find(".tob-button").exists()).to.be.true;
        });
    });

    describe("mobile landscape mode", () => {
        beforeEach(() => {
            mockUserAgent(true);
            mockMatchMedia(true); // max-width: 768px matches
            mockScreenOrientation("landscape-primary");

            wrapper.unmount();
            store = createTestStore(storyConf, true);
            wrapper = mountComponent(store, true);
        });

        it("does NOT render drag-indicator in mobile landscape mode", () => {
            expect(wrapper.find(".drag-indicator").exists()).to.be.false;
        });

        it("isMobilePortrait computed is false in landscape orientation", () => {
            expect(wrapper.vm.isMobilePortrait).to.be.false;
        });

        it("cssVars uses default tob-button-top value (9%) in mobile landscape", () => {
            expect(wrapper.vm.cssVars["--tob-button-top"]).to.equal("9%");
        });

        it("cssVars uses 12px progress-bottom in mobile landscape", () => {
            expect(wrapper.vm.cssVars["--progress-bottom"]).to.equal("12px");
        });

        it("still renders stepper elements in mobile landscape mode", () => {
            expect(wrapper.findAll(".stepper").length).to.equal(steps.length);
        });

        it("still renders home button in mobile landscape mode when showHomeButton is true", () => {
            expect(wrapper.find(".home-button").exists()).to.be.true;
        });
    });

    describe("desktop (non-mobile) mode", () => {
        beforeEach(() => {
            mockUserAgent(false);
            mockMatchMedia(false); // max-width: 768px does NOT match
            mockScreenOrientation("landscape-primary");

            wrapper.unmount();
            store = createTestStore(storyConf);
            wrapper = mountComponent(store);
        });

        it("does NOT render drag-indicator on desktop", () => {
            expect(wrapper.find(".drag-indicator").exists()).to.be.false;
        });

        it("isMobilePortrait is false on desktop", () => {
            expect(wrapper.vm.isMobilePortrait).to.be.false;
        });

        it("isMobileDevice is false on desktop with desktop user agent", () => {
            expect(wrapper.vm.isMobileDevice).to.be.false;
        });

        it("cssVars uses default tob-button-top (12%) on desktop", () => {
            expect(wrapper.vm.cssVars["--tob-button-top"]).to.equal("12%");
        });

        it("cssVars uses default progress-bottom (8px) on desktop", () => {
            expect(wrapper.vm.cssVars["--progress-bottom"]).to.equal("8px");
        });
    });
});
