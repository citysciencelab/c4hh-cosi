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
    function createTestStore (storyConfOverride = null) {
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
                        secondaryExpanded: true
                    }),
                    getters: {
                        mainMenu: state => state.mainMenu,
                        secondaryMenu: state => state.secondaryMenu,
                        secondaryExpanded: state => state.secondaryExpanded
                    }
                }
            },
            getters: {
                isMobile: () => false,
                uiStyle: () => "DEFAULT"
            }
        });
    }

    /**
     * Helper function to mount the component
     * @param {Object} storeInstance - Vuex store instance
     * @returns {Object} Vue wrapper
     */
    function mountComponent (storeInstance) {
        return shallowMount(DipasPlayer, {
            props: {
                steps,
                stepsobjects: [],
                storyConfPath: ""
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

    beforeEach(() => {
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
});
