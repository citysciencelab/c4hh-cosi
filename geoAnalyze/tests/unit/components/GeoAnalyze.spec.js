import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import GeoAnalyze from "../../../components/GeoAnalyze.vue";
import sinon from "sinon";
import {createStore} from "vuex";

config.global.mocks.$t = key => key;

describe("addons/geoAnalyze/components/GeoAnalyze.vue", () => {
    let store,
        wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        GeoMarker: {
                            namespaced: true,
                            actions: {
                                addLayer: sinon.stub()
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        clickCoordinate: () => [0, 0]
                    },
                    actions: {
                        addInteraction: sinon.stub(),
                        addLayer: sinon.stub(),
                        removePointMarker: sinon.stub()
                    }
                }
            },
            getters: {
                allLayerConfigs: () => []
            }
        });

        wrapper = shallowMount(GeoAnalyze, {
            global: {
                plugins: [store]
            }
        });
    });

    it("should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("should activate the draw interaction initially", () => {
        expect(wrapper.vm.draw.getActive()).to.be.true;
    });

    it("should activate select interaction if data 'selectedOption' is set to 'select'", async () => {
        await wrapper.setData({
            selectedOption: "select"
        });
        expect(wrapper.vm.select.getActive()).to.be.true;
    });

    it("should deactivate draw interaction if data 'selectedOption' is set to 'select'", async () => {
        await wrapper.setData({
            selectedOption: "select"
        });
        expect(wrapper.vm.draw.getActive()).to.be.false;
    });

    it("should set currentResultComponent to 'GeoAnalyzeResultGeometry' if data 'selectedOption' is set to 'select'", async () => {
        await wrapper.setData({
            selectedOption: "select"
        });
        expect(wrapper.vm.currentResultComponent).to.equal("GeoAnalyzeResultGeometry");
    });

    it("should set currentResultComponent to 'GeoAnalyzeResultGeometry' if data 'selectedOption' is set to 'click'", async () => {
        await wrapper.setData({
            selectedOption: "click"
        });
        expect(wrapper.vm.currentResultComponent).to.equal("GeoAnalyzeResultBuilding");
    });

    it("should find child component GeoAnalyzeResultGeometry", async () => {
        await wrapper.setData({
            result: {
                test: "Test"
            }
        });
        expect(wrapper.findComponent({name: "GeoAnalyzeResultGeometry"}).exists()).to.be.true;
    });

    it("should find child component GeoAnalyzeResultBuilding", async () => {
        await wrapper.setData({
            selectedOption: "click"
        });

        await wrapper.setData({
            result: ["Test"]
        });

        expect(wrapper.findComponent({name: "GeoAnalyzeResultBuilding"}).exists()).to.be.true;
    });

    it("should call getAnalyzeData if button is clicked", async () => {
        await wrapper.setData({
            result: {
                test: "Test"
            }
        });
        const getDataStub = sinon.stub(wrapper.vm, "getAnalyzeData"),
            button = wrapper.find("button");

        await button.trigger("click");
        expect(getDataStub.calledOnce).to.be.true;
    });

});
