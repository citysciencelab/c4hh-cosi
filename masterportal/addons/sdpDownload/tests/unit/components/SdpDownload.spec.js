import {createStore} from "vuex";
import {config, shallowMount, mount} from "@vue/test-utils";
import Map from "ol/Map.js";
import SDPComponent from "../../../components/SdpDownload.vue";
import GraphicalSelect from "../../../../../src/shared/modules/graphicalSelect/components/GraphicalSelect.vue";
import SdpDownload from "../../../store/index.js";
import sinon from "sinon";
import {expect} from "chai";

config.global.mocks.$t = key => key;

describe("addons/sdpDownload/components/SdpDownload.vue", () => {

    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        SdpDownload:
                            {
                                "name": "SDP Download",
                                "icon": "bi-download"
                            }
                    }
                }
            }
        }
    };
    let store;

    beforeEach(() => {
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        SdpDownload,
                        GraphicalSelect
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: sinon.spy()
                    }
                }
            },
            state: {
                configJson: mockConfigJson,
                selectedAreaGeoJson: {}
            }
        });
        sinon.stub(SDPComponent, "mounted");
        sinon.stub(GraphicalSelect, "mounted");
        store.commit("Modules/SdpDownload/setActive", true);
    });

    it("should find form in component", () => {
        const wrapper = shallowMount(SDPComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("form").exists()).to.be.true;

    });

    it("renders the SDPAddon", () => {
        const wrapper = shallowMount(SDPComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#sdp-download").exists()).to.be.true;

    });
    it("SDPAddon contains correct amount (4 formats) of available options in format select", () => {
        const wrapper = shallowMount(SDPComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.findAll("select#formatSelection > option").length).to.be.equal(4);

    });
    it("SDPAddon contains div for graphical selection", () => {
        const wrapper = shallowMount(SDPComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find(".form-group").exists()).to.be.true;

    });
    it("flatbutton for download exists and has interaction", () => {
        const wrapper = shallowMount(SDPComponent, {
                global: {
                    plugins: [store]
                }
            }),
            button = wrapper.find("#flatButton-selectedDownload");

        expect(button.exists()).to.be.true;
        expect(button.html().includes("interaction=\"[Function]\"")).to.be.true;

    });
    it("should call setSelectedFormat function if select is changed", async () => {
        const spy = sinon.spy(SDPComponent.methods, "setSelectedFormat"),
            wrapper = shallowMount(SDPComponent, {
                global: {
                    plugins: [store]
                }
            }),
            select = wrapper.find("#formatSelection");

        await select.trigger("change");
        expect(spy.calledOnce).to.be.true;

        spy.restore();
    });
    it("clearGraphicalSelect execute setStatus,resetView", () => {
        const map = new Map({
                id: "ol",
                mode: "2D"
            }),
            wrapper = mount(SDPComponent, {
                global: {
                    plugins: [store]
                }
            }),
            mockedsetStatus = sinon.spy(wrapper.vm.$refs.graphicalSelection, "setStatus"),
            mockedresetView = sinon.spy(wrapper.vm.$refs.graphicalSelection, "resetView");

        mapCollection.clear();
        mapCollection.addMap(map, "2D");


        wrapper.vm.clearGraphicalSelect();

        expect(mockedsetStatus.calledOnce).to.be.true;
        expect(mockedresetView.calledOnce).to.be.true;
    });
});
