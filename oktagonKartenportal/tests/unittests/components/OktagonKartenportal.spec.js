import Vuex from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import OktagonKartenportalComponent from "../../../components/OktagonKartenportal.vue";
import OktagonKartenportal from "../../../store/indexOktagonKartenportal";

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("addons/oktagonKartenportal/components/OktagonKartenportal.vue", () => {
    const mockState = {
            mode: "2D"
        },
        mockMapMarkerActions = {
            placingPointMarker: sinon.stub()
        },
        mockAlertingActions = {
            addSingleAlert: sinon.stub()
        },
        mockMapActions = {
            setCenter: sinon.stub(),
            setZoomLevel: sinon.stub(),
            registerListener: sinon.stub()
        },
        mockConfigJson = {
            Portalconfig: {
                menu: {
                    tools: {
                        children: {
                            oktagonKartenportal:
                            {
                                "name": "Oktagon",
                                "icon": "bi-info-circle-fill"
                            }
                        }
                    }
                }
            }
        };
    let store,
        wrapper;

    beforeEach(() => {
        const elem = document.createElement("div");

        if (document.body) {
            document.body.appendChild(elem);
        }

        store = new Vuex.Store({
            namespaced: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        OktagonKartenportal
                    }
                },
                Maps: {
                    namespaced: true,
                    state: mockState,
                    actions: mockMapActions
                },
                MapMarker: {
                    namespaced: true,
                    actions: mockMapMarkerActions
                },
                Alerting: {
                    namespaced: true,
                    actions: mockAlertingActions
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
        store.commit("Tools/OktagonKartenportal/setActive", true);
        wrapper = shallowMount(OktagonKartenportalComponent, {store, localVue, attachTo: elem});
    });

    describe("OktagonKartenportal.vue methods", () => {
        it("close sets active to false", async () => {
            expect(store.state.Tools.OktagonKartenportal.active).to.be.true;
            wrapper.vm.close();
            await wrapper.vm.$nextTick();

            expect(store.state.Tools.OktagonKartenportal.active).to.be.false;
            expect(wrapper.find("#oktagonKartenportal").exists()).to.be.false;
        });
        it("setFocusToFirstControl sets focus to subbmit button", async () => {
            wrapper.vm.setFocusToFirstControl();
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#oktagonSubmitButton").element).to.equal(document.activeElement);

        });
        it("onMapClick shows the sidebar with it parameters", () => {
            expect(wrapper.find("#oktagonKartenportal").exists()).to.be.true;
            expect(wrapper.find("#oktagonSubmitButton").exists()).to.be.true;
            expect(wrapper.find("#oktagonCloseButton").exists()).to.be.true;

        });
    });
});
