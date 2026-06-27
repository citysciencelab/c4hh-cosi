// import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {shallowMount} from "@vue/test-utils";
// import DistrictFinderFilterExport from "../../../components/DistrictFinderFilterExport.vue";
import {expect} from "chai";
import sinon from "sinon";

// config.mocks.$t = key => key;

// const localVue = createLocalVue();

describe.skip("addons/cosi/DistrictFinder/components/DistrictFinderFilterExport.vue", () => {
    const DistrictFinderFilterExport = undefined,
        factory = {
            getShallowMount: (values = {}) => {
                return shallowMount(DistrictFinderFilterExport, {
                    data () {
                        return {
                            ...values
                        };
                    },
                    props: {
                        conditionId: 0
                    }
                    // localVue
                });
            }
        };

    describe("Component DOM", () => {
        it("should exists", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });
        it("should find a header", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find("h5").exists()).to.be.true;
            expect(wrapper.find("h5").text()).to.be.equal("additional:modules.tools.cosi.districtFinder.conditionsExport");
        });
        it("should find a text input", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find("input#export-name").exists()).to.be.true;
            expect(wrapper.find("input#export-name").attributes("type")).to.be.equal("text");
        });
        it("should find a checkbox input", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find("input#export-areas").exists()).to.be.true;
            expect(wrapper.find("input#export-areas").attributes("type")).to.be.equal("checkbox");
        });
        it("should find a export button", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find("button").exists()).to.be.true;
            expect(wrapper.find("button").text()).to.be.equal("additional:modules.tools.cosi.districtFinder.button.export");
        });
    });

    describe("Methods", () => {
        describe("emitExport", () => {
            it("should emits 'exportConditions' with right arguments", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.setData({
                    exportName: "SpongeBob",
                    withAreas: true
                });
                wrapper.vm.emitExport();
                await wrapper.vm.$nextTick();
                expect(wrapper.emitted()).to.have.property("exportConditions");
                expect(wrapper.emitted().exportConditions[0]).to.deep.equal(["SpongeBob", true]);
            });
        });
    });

    describe("User Interactions", () => {
        it("should call 'emitExport' if user click the export button", async () => {
            const stubExport = sinon.stub(DistrictFinderFilterExport.methods, "emitExport"),
                wrapper = factory.getShallowMount(),
                buttonWrapper = wrapper.find("button");

            await buttonWrapper.trigger("click");

            expect(stubExport.calledOnce).to.be.true;
            sinon.restore();
        });
    });
});
