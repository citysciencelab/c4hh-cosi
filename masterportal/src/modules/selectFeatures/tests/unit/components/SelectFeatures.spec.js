import {createStore} from "vuex";
import VectorLayer from "ol/layer/Vector.js";
import {config, shallowMount} from "@vue/test-utils";
import SelectFeaturesComponent from "@modules/selectFeatures/components/SelectFeatures.vue";
import SelectFeaturesModule from "@modules/selectFeatures/store/indexSelectFeatures.js";
import {expect} from "chai";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/selectFeatures/components/SelectFeatures.vue", () => {
    const mockMapActions = {
            addInteraction: sinon.stub(),
            removeInteraction: sinon.stub()
        },
        mockSelectedFeaturesWithRenderInformation = [
            {
                item: null,
                properties: [
                    ["Name", "Max-Brauer-Schule"],
                    ["Schulform", "Grundschule"],
                    ["Schulstandort", "Hauptstandort"],
                    ["Scherpunktschule Inklusion", ""]
                ]
            }
        ];

    let store, map, layer1, layer2;

    beforeEach(() => {
        layer1 = new VectorLayer();
        layer2 = new VectorLayer();
        map = {
            id: "ol",
            mode: "2D",
            getLayers: () => {
                return {
                    getArray: () => [layer1, layer2]
                };
            }
        };
        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    actions: mockMapActions
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        SelectFeatures: SelectFeaturesModule
                    }
                }
            },
            getters: {
                uiStyle: () => true,
                treeType: () => undefined,
                isMobile: () => false,
                ignoredKeys: () => []
            }
        });
        mapCollection.clear();
        mapCollection.addMap(map, "2D");
    });


    it("renders the SelectFeatures tool if mounted and active", () => {
        const wrapper = shallowMount(SelectFeaturesComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#selectFeatures").exists()).to.be.true;
        expect(wrapper.find(".selectFeaturesDefaultMessage").exists()).to.be.true;
    });

    it("renders the SelectFeatures-Table if it has data", async () => {
        await store.commit("Modules/SelectFeatures/setSelectedFeaturesWithRenderInformation", mockSelectedFeaturesWithRenderInformation);
        const wrapper = shallowMount(SelectFeaturesComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find(".select-features-tables").exists()).to.be.true;
        expect(wrapper.find(".featureName").exists()).to.be.true;
        expect(wrapper.find(".featureValue").exists()).to.be.true;
        expect(wrapper.find(".select-features-zoom-link").exists()).to.be.true;
    });

    it("selectFeatures functions return correct results", async () => {
        const wrapper = shallowMount(SelectFeaturesComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.vm.beautifyKey("very_important_field")).to.equal("Very Important Field");
        expect(wrapper.vm.beautifyValue("very|important|field")).to.equal("very<br/>important<br/>field");
        expect(wrapper.vm.isValidValue("NULL")).to.equal(false);
        expect(wrapper.vm.isValidValue(1)).to.equal(false);
        expect(wrapper.vm.isValidValue("Wert")).to.equal(true);
    });

    it("clears all selected features when clearFeatures is called", async () => {
        const mockFeature1 = {getId: () => "f1", setStyle: sinon.spy()},
            mockFeature2 = {getId: () => "f2", setStyle: sinon.spy()},
            wrapper = shallowMount(SelectFeaturesComponent, {
                global: {
                    plugins: [store]
                }
            });

        await store.commit("Modules/SelectFeatures/setSelectedFeatures", [mockFeature1, mockFeature2]);
        await store.commit("Modules/SelectFeatures/setSelectedFeaturesWithRenderInformation", [{
            item: mockFeature1,
            properties: []
        }, {
            item: mockFeature2,
            properties: []
        }]);

        wrapper.vm.clearFeatures();
        expect(wrapper.vm.selectedFeatures.length).to.equal(0);
        expect(wrapper.vm.selectedFeaturesWithRenderInformation.length).to.equal(0);
        expect(mockFeature1.setStyle.calledOnceWith(null)).to.be.true;
        expect(mockFeature2.setStyle.calledOnceWith(null)).to.be.true;
    });

    it("removes a single feature from the selection when removeFeature is called", async () => {
        const mockFeatureF1 = {getId: () => "f1", setStyle: sinon.spy()},
            mockFeatureF2 = {getId: () => "f2", setStyle: sinon.spy()},
            wrapper = shallowMount(SelectFeaturesComponent, {
                global: {
                    plugins: [store]
                }
            });

        await store.commit("Modules/SelectFeatures/setSelectedFeatures", [mockFeatureF1, mockFeatureF2]);
        await store.commit("Modules/SelectFeatures/setSelectedFeaturesWithRenderInformation", [{
            item: mockFeatureF1,
            properties: [["Name", "Feature1"]]
        }, {
            item: mockFeatureF2,
            properties: [["Name", "Feature2"]]
        }]);

        wrapper.vm.removeFeature(0, mockFeatureF1);

        expect(wrapper.vm.selectedFeatures.length).to.equal(1);
        expect(wrapper.vm.selectedFeatures[0].getId()).to.equal("f2");
        expect(wrapper.vm.selectedFeaturesWithRenderInformation.length).to.equal(1);
        expect(wrapper.vm.selectedFeaturesWithRenderInformation[0].item.getId()).to.equal("f2");
        expect(mockFeatureF1.setStyle.calledOnceWith(null)).to.be.true;
    });

    it("processLinksAndBreaks creates clickable links and breaks from an array", () => {
        const wrapper = shallowMount(SelectFeaturesComponent, {
                global: {
                    plugins: [store]
                }
            }),
            inputProperties = {
                "LINKS": ["http://example.com", "http://test.com"],
                "TEXT": "Just a simple text"
            },
            result = wrapper.vm.processLinksAndBreaks({...inputProperties});

        expect(result.LINKS).to.include("http://example.com");
        expect(result.LINKS).to.include("<br/>");
        expect(result.TEXT).to.equal("Just a simple text");
    });

    it("translateGFI returns pretty printed key-value pairs when gfiAttributes=showAll", () => {
        const wrapper = shallowMount(SelectFeaturesComponent, {
                global: {
                    plugins: [store]
                }
            }),
            properties = {"very_important_field": "some value", "another_key": "another value"},
            result = wrapper.vm.translateGFI(properties, "showAll");

        expect(result.length).to.equal(2);
        expect(result[0][0]).to.equal("Very Important Field");
        expect(result[0][1]).to.equal("some value");
        expect(result[1][0]).to.equal("Another Key");
        expect(result[1][1]).to.equal("another value");
    });

    it("translateGFI returns an empty array when gfiAttributes=ignore", () => {
        const wrapper = shallowMount(SelectFeaturesComponent, {
                global: {
                    plugins: [store]
                }
            }),
            properties = {"very_important_field": "some value", "another_key": "another value"},
            result = wrapper.vm.translateGFI(properties, "ignore");

        expect(Array.isArray(result)).to.be.true;
        expect(result.length).to.equal(0);
    });
});
