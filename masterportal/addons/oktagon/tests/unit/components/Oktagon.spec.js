import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import sinon from "sinon";
import {expect} from "chai";
import OktagonComponent from "../../../components/OktagonComponent.vue";

config.global.mocks.$t = key => key;

describe("OktagonComponent.vue", () => {
    let store, wrapper;

    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        oktagon: {name: "OktagonComponent", icon: "bi-info-circle-fill"}
                    }
                }
            }
        }
    };

    /**
     * Creates a mock Vuex store for Oktagon tests
     * @param {Object} [submitObject={}] - Initial submitObject state
     * @returns {import('vuex').Store} Vuex store instance
    */
    function createMockStore (submitObject = {}) {
        return createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        OktagonComponent: {
                            namespaced: true,
                            state: {submitObject},
                            getters: {
                                submitObject: state => state.submitObject,
                                layerIds: () => [],
                                zoomLevel: () => 10,
                                active: () => true,
                                name: () => "Oktagon",
                                icon: () => "bi-info-circle-fill",
                                renderToWindow: () => false,
                                resizableWindow: () => false,
                                deactivateGFI: () => false,
                                submitURL: () => "http://example.com"
                            },
                            actions: {
                                initURLParameter: sinon.stub(),
                                requestALKISWMS: sinon.stub(),
                                addCoordinatesToSubmitObject: sinon.stub(),
                                parseXML: sinon.stub()
                            },
                            mutations: {
                                setSubmitObject: sinon.spy((state, payload) => {
                                    state.submitObject = payload;
                                })
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    state: {mode: "2D"},
                    actions: {
                        setCenter: sinon.stub(),
                        setZoomLevel: sinon.stub(),
                        registerListener: sinon.stub(),
                        removePointMarker: sinon.stub(),
                        placingPointMarker: sinon.stub()
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        expanded: () => key => key === "secondaryMenu"
                    },
                    actions: {
                        toggleMenu: sinon.stub()
                    }
                }
            },
            state: {configJson: mockConfigJson}
        });
    }

    beforeEach(() => {
        store = createMockStore({foo: "bar"});
        wrapper = shallowMount(OktagonComponent, {global: {plugins: [store]}});
    });

    it("sets focus to submit button", async () => {
        const button = wrapper.find("#oktagonSubmitButton").element,
            focusSpy = sinon.spy(button, "focus");

        wrapper.vm.setFocusToFirstControl();
        await wrapper.vm.$nextTick();

        expect(focusSpy.calledOnce).to.be.true;
    });

    it("shows sidebar and buttons on map click", async () => {
        await wrapper.vm.$nextTick();
        expect(wrapper.find("#oktagon").exists()).to.be.true;
        expect(wrapper.find("#oktagonSubmitButton").exists()).to.be.true;
        expect(wrapper.find("#oktagonCloseButton").exists()).to.be.true;
    });

    it("renders table with submitObject entries", async () => {
        store.state.Modules.OktagonComponent.submitObject = {foo: "bar", baz: "qux"};
        await wrapper.vm.$nextTick();

        const rows = wrapper.findAll("tbody tr");

        expect(rows.length).to.equal(2);
        expect(rows[0].text()).to.include("foo").and.to.include("bar");
        expect(rows[1].text()).to.include("baz").and.to.include("qux");
    });

    it("calls close() correctly when Close button is clicked", async () => {
        const removePointMarkerSpy = sinon.spy(wrapper.vm, "removePointMarker"),
            toggleMenuSpy = sinon.spy(wrapper.vm, "toggleMenu"),
            setSubmitObjectSpy = sinon.spy(wrapper.vm, "setSubmitObject"),

            closeButton = wrapper.find("#oktagonCloseButton");

        await closeButton.trigger("click");

        expect(setSubmitObjectSpy.calledOnceWith({})).to.be.true;
        expect(removePointMarkerSpy.calledOnce).to.be.true;
        expect(toggleMenuSpy.calledOnceWith("secondaryMenu")).to.be.true;
    });
});
