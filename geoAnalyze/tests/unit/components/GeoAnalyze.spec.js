import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import GeoAnalyze from "../../../components/GeoAnalyze.vue";
config.mocks.$t = key => key;
import sinon from "sinon";

describe("addons/geoAnalyze/components/GeoAnalyze.vue", () => {
    let spyToggleInteraction,
        spyGetData;

    const factory = {
        getShallowMount: (values = {}, isActive = false) => {
            return shallowMount(GeoAnalyze, {
                data () {
                    return {
                        ...values
                    };
                },
                computed: {
                    clickCoordinate: () => [],
                    name: () => "Hallo",
                    renderToWindow: () => true,
                    resizableWindow: () => false,
                    deactivateGFI: () => true,
                    active: () => isActive,
                    icon: () => "bi-list-task"
                }
            });
        }
    };

    before(() => {
        spyToggleInteraction = sinon.spy(GeoAnalyze.methods, "toggleInteraction");
        spyGetData = sinon.spy(GeoAnalyze.methods, "getAnalyzeData");
    });

    it("should exist", () => {
        const wrapper = factory.getShallowMount();

        expect(wrapper.exists()).to.be.true;
    });

    it("should find Tool component", () => {
        const wrapper = factory.getShallowMount(),
            toolWrapper = wrapper.findComponent({name: "ToolTemplate"});

        expect(toolWrapper.exists()).to.be.true;
    });

    it("should not render if active is false", () => {
        const wrapper = factory.getShallowMount();

        expect(wrapper.find("form").exists()).to.be.false;
    });

    it("should render if active is true", () => {
        const wrapper = factory.getShallowMount({}, true);

        expect(wrapper.find("form").exists()).to.be.true;
    });

    it("should activate the draw interaction initially", () => {
        const wrapper = factory.getShallowMount({}, true);

        expect(wrapper.vm.draw.getActive()).to.be.true;
    });

    it("should call toggleInteraction if data 'selectedOption' is changed", async () => {
        const wrapper = factory.getShallowMount();

        await wrapper.setData({
            selectedOption: "select"
        });
        expect(spyToggleInteraction.calledOnce).to.be.true;
    });

    it("should activate select interaction if data 'selectedOption' is set to 'select'", async () => {
        const wrapper = factory.getShallowMount();

        await wrapper.setData({
            selectedOption: "select"
        });
        expect(wrapper.vm.select.getActive()).to.be.true;
    });

    it("should deactivate draw interaction if data 'selectedOption' is set to 'select'", async () => {
        const wrapper = factory.getShallowMount();

        await wrapper.setData({
            selectedOption: "select"
        });
        expect(wrapper.vm.draw.getActive()).to.be.false;
    });

    it("should set currentResultComponent to 'GeoAnalyzeResultGeometry' if data 'selectedOption' is set to 'select'", async () => {
        const wrapper = factory.getShallowMount();

        await wrapper.setData({
            selectedOption: "select"
        });
        expect(wrapper.vm.currentResultComponent).to.equal("GeoAnalyzeResultGeometry");
    });

    it("should set currentResultComponent to 'GeoAnalyzeResultGeometry' if data 'selectedOption' is set to 'click'", async () => {
        const wrapper = factory.getShallowMount();

        await wrapper.setData({
            selectedOption: "click"
        });
        expect(wrapper.vm.currentResultComponent).to.equal("GeoAnalyzeResultBuilding");
    });

    it("should find child component GeoAnalyzeResultGeometry", () => {
        const wrapper = factory.getShallowMount({
            result: {
                test: "Test"
            }
        }, true);

        expect(wrapper.findComponent({name: "GeoAnalyzeResultGeometry"}).exists()).to.be.true;
    });

    it("should find child component GeoAnalyzeResultBuilding", () => {
        const wrapper = factory.getShallowMount({
            result: ["Test"],
            selectedOption: "click"
        }, true);

        expect(wrapper.findComponent({name: "GeoAnalyzeResultBuilding"}).exists()).to.be.true;
    });

    it("should call getAnalyzeData if button is clicked", async () => {
        const wrapper = factory.getShallowMount({
                result: {
                    test: "Test"
                }
            }, true),
            button = wrapper.find("button");

        await button.trigger("click");
        expect(spyGetData.calledOnce).to.be.true;
    });

});
