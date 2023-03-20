import Vuex from "vuex";
import
{
    config,
    shallowMount,
    createLocalVue
} from "@vue/test-utils";
import ColorCodeMapComponent from "../../../components/ColorCodeMap.vue";
import ColorCodeMap from "../../../store/index";
import
{
    expect
} from "chai";
import sinon from "sinon";
import Vue from "vue";
import Vuetify from "vuetify";

Vue.use(Vuetify);

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("ColorCodeMap.vue", () => {
    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        ColorCodeMap: {
                            "name": "translate#additional:modules.tools.vueAddon.title",
                            "icon": "bi-map"
                        }
                    }
                }
            }
        }
    };

    // eslint-disable-next-line no-unused-vars
    let store, sandbox, sourceStub, selectedStatsFeaturesStub, selectedFeaturesStub, addFeatureStub, loadendStub, dashboardOpenStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        addFeatureStub = sinon.stub();
        sourceStub = {
            clear: sinon.stub(),
            addFeature: addFeatureStub
        };
        selectedStatsFeaturesStub = sandbox.stub();
        selectedFeaturesStub = sinon.stub();
        loadendStub = sinon.stub();
        dashboardOpenStub = sinon.stub();

        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        ColorCodeMap,
                        DistrictSelector: {
                            namespaced: true,
                            getters: {
                                selectedStatFeatures: selectedStatsFeaturesStub,
                                selectedFeatures: selectedFeaturesStub,
                                keyOfAttrNameStats: () => "attrKey",
                                keyOfAttrName: () => "attrKey",
                                loadend: loadendStub
                            }
                        },
                        CalculateRatio: {
                            namespaced: true,
                            getters: {
                                dataToColorCodeMap: () => sinon.stub,
                                colorCodeMapDataset: () => sinon.stub
                            }
                        }
                    }
                },
                Map: {
                    namespaced: true,
                    actions: {
                        addNewLayerIfNotExists: () => {
                            return Promise.resolve({
                                setVisible: sinon.stub(),
                                getSource: () => sourceStub
                            });
                        }
                    }
                },
                Dashboard: {
                    namespaced: true,
                    getters: {
                        dashboardOpen: dashboardOpenStub
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
    });

    afterEach(function () {
        sandbox.restore();
    });

    // eslint-disable-next-line require-jsdoc
    async function mount () {
        const ret = shallowMount(ColorCodeMapComponent, {
            store,
            localVue
        });

        await ret.vm.$nextTick();
        return ret;
    }

    describe("Component DOM", () => {
        it("should not render Component if no features are loaded", async () => {
            selectedStatsFeaturesStub.returns([]);
            const wrapper = await mount();

            expect(wrapper.find("#ccm").exists()).to.be.false;
        });

        it("should not render Component if dashboard is open", async () => {
            dashboardOpenStub.returns(true);
            const wrapper = await mount();

            expect(wrapper.find("#ccm").exists()).to.be.false;
        });

        it("should render if features are loaded and dashboard is close", async () => {
            selectedStatsFeaturesStub.returns([{
                getProperties: () => ({kategorie: "feature"})
            }]);
            selectedFeaturesStub.returns([{
                getProperties: () => ({attrKey: "test"}),
                getStyle: () => sinon.stub(),
                setStyle: () => sinon.stub(),
                clone: () => ({setStyle: sinon.stub()})
            }]);
            loadendStub.returns(true);
            dashboardOpenStub.returns(false);

            const wrapper = await mount();

            // wrapper.vm.setSelectedFeature("feature");
            // wrapper.vm.setSelectedYear(2021);
            // wrapper.vm.setShowMapNames(true);
            // await wrapper.setData({
            //     selectedFeature: "feature",
            //     selectedYear: "2021",
            //     showMapNames: true
            // });

            expect(wrapper.find("#ccm").exists()).to.be.true;
            // expect(wrapper.find("#ccm").html()).to.not.be.empty;


            // await wrapper.find("#switch").trigger("click");
            // expect(wrapper.vm.visualizationState).to.equal(true);
        });

        it("should not render if features are loaded and dashboard is open", async () => {
            selectedStatsFeaturesStub.returns([{
                getProperties: () => ({kategorie: "feature"})
            }]);
            selectedFeaturesStub.returns([{
                getProperties: () => ({attrKey: "test"}),
                getStyle: () => sinon.stub(),
                setStyle: () => sinon.stub(),
                clone: () => ({setStyle: sinon.stub()})
            }]);
            loadendStub.returns(true);
            dashboardOpenStub.returns(open);

            const wrapper = await mount();

            expect(wrapper.find("#ccm").exists()).to.be.true;
        });

        it("should find mdi-plus icon if minimize is true", async () => {
            selectedStatsFeaturesStub.returns([{
                getProperties: () => ({kategorie: "feature"})
            }]);
            selectedFeaturesStub.returns([{
                getProperties: () => ({attrKey: "test"}),
                getStyle: () => sinon.stub(),
                setStyle: () => sinon.stub(),
                clone: () => ({setStyle: sinon.stub()})
            }]);
            loadendStub.returns(true);
            dashboardOpenStub.returns(open);

            const wrapper = await mount(),
                button = wrapper.findComponent({name: "v-icon"});

            expect(button.text()).to.be.equal("mdi-plus");
        });

        it("should find mdi-minus icon if minimize is false", async () => {
            selectedStatsFeaturesStub.returns([{
                getProperties: () => ({kategorie: "feature"})
            }]);
            selectedFeaturesStub.returns([{
                getProperties: () => ({attrKey: "test"}),
                getStyle: () => sinon.stub(),
                setStyle: () => sinon.stub(),
                clone: () => ({setStyle: sinon.stub()})
            }]);
            loadendStub.returns(true);
            dashboardOpenStub.returns(open);

            const wrapper = await mount(),
                button = wrapper.findComponent({name: "v-icon"});

            await wrapper.setData({
                minimize: false
            });

            expect(button.text()).to.be.equal("mdi-minus");
        });

        it("should find mdi-eye icon if visualizationState is false", async () => {
            selectedStatsFeaturesStub.returns([{
                getProperties: () => ({kategorie: "feature"})
            }]);
            selectedFeaturesStub.returns([{
                getProperties: () => ({attrKey: "test"}),
                getStyle: () => sinon.stub(),
                setStyle: () => sinon.stub(),
                clone: () => ({setStyle: sinon.stub()})
            }]);
            loadendStub.returns(true);
            dashboardOpenStub.returns(open);

            const wrapper = await mount(),
                button = wrapper.find("#switch");

            expect(button.text()).to.be.equal("mdi-eye");
        });

        it("should find mdi-eye-off icon if visualizationState is true", async () => {
            selectedStatsFeaturesStub.returns([{
                getProperties: () => ({kategorie: "feature"})
            }]);
            selectedFeaturesStub.returns([{
                getProperties: () => ({attrKey: "test"}),
                getStyle: () => sinon.stub(),
                setStyle: () => sinon.stub(),
                clone: () => ({setStyle: sinon.stub()})
            }]);
            loadendStub.returns(true);
            dashboardOpenStub.returns(open);

            const wrapper = await mount();

            wrapper.vm.setVisualizationState(true);
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#switch").text()).to.be.equal("mdi-eye-off");
        });

        it("should find mdi-chevron-left icon", async () => {
            selectedStatsFeaturesStub.returns([{
                getProperties: () => ({kategorie: "feature"})
            }]);
            selectedFeaturesStub.returns([{
                getProperties: () => ({attrKey: "test"}),
                getStyle: () => sinon.stub(),
                setStyle: () => sinon.stub(),
                clone: () => ({setStyle: sinon.stub()})
            }]);
            loadendStub.returns(true);
            dashboardOpenStub.returns(open);

            const wrapper = await mount();

            expect(wrapper.find(".prev").text()).to.be.equal("mdi-chevron-left");
        });

        it("should find mdi-chevron-right icon", async () => {
            selectedStatsFeaturesStub.returns([{
                getProperties: () => ({kategorie: "feature"})
            }]);
            selectedFeaturesStub.returns([{
                getProperties: () => ({attrKey: "test"}),
                getStyle: () => sinon.stub(),
                setStyle: () => sinon.stub(),
                clone: () => ({setStyle: sinon.stub()})
            }]);
            loadendStub.returns(true);
            dashboardOpenStub.returns(open);

            const wrapper = await mount();

            expect(wrapper.find(".next").text()).to.be.equal("mdi-chevron-right");
        });
    });

    /**
     * @todo make robust, passes when executed in isolation, fails in prePushHooks
     */
    describe.skip("User Interactions", () => {
        it("should maximize the tool if user click on mdi-plus button", async () => {
            selectedStatsFeaturesStub.returns([{
                getProperties: () => ({kategorie: "feature"})
            }]);
            selectedFeaturesStub.returns([{
                getProperties: () => ({attrKey: "test"}),
                getStyle: () => sinon.stub(),
                setStyle: () => sinon.stub(),
                clone: () => ({setStyle: sinon.stub()})
            }]);
            loadendStub.returns(true);
            dashboardOpenStub.returns(open);

            const wrapper = await mount(),
                ccm = wrapper.find("#ccm"),
                button = wrapper.find("button");

            await button.trigger("click");
            await wrapper.vm.$nextTick();
            expect(button.text()).to.be.equal("mdi-minus");
            expect(ccm.classes("minimized")).to.be.false;
        });

        it("should minimize the tool if user click on mdi-minus button", async () => {
            selectedStatsFeaturesStub.returns([{
                getProperties: () => ({kategorie: "feature"})
            }]);
            selectedFeaturesStub.returns([{
                getProperties: () => ({attrKey: "test"}),
                getStyle: () => sinon.stub(),
                setStyle: () => sinon.stub(),
                clone: () => ({setStyle: sinon.stub()})
            }]);
            loadendStub.returns(true);
            dashboardOpenStub.returns(open);

            const wrapper = await mount(),
                ccm = wrapper.find("#ccm"),
                button = wrapper.find("button");

            wrapper.vm.setMinimized(false);
            await wrapper.vm.$nextTick();
            await button.trigger("click");
            await wrapper.vm.$nextTick();
            expect(button.text()).to.be.equal("mdi-plus");
            expect(ccm.classes("minimized")).to.be.true;
        });

        it("should toggle visualizationState", async () => {
            selectedStatsFeaturesStub.returns([{
                getProperties: () => ({kategorie: "feature"})
            }]);
            selectedFeaturesStub.returns([{
                getProperties: () => ({attrKey: "test"}),
                getStyle: () => sinon.stub(),
                setStyle: () => sinon.stub(),
                clone: () => ({setStyle: sinon.stub()})
            }]);
            loadendStub.returns(true);
            dashboardOpenStub.returns(open);

            const wrapper = await mount(),
                button = wrapper.find("#switch");

            await button.trigger("click");
            await wrapper.vm.$nextTick();
            expect(button.text()).to.be.equal("mdi-eye-off");
            await button.trigger("click");
            await wrapper.vm.$nextTick();
            expect(button.text()).to.be.equal("mdi-eye");
        });
    });
});
