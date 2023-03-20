import Vuex from "vuex";
import {config, mount, createLocalVue} from "@vue/test-utils";
import ScenarioBuilderStore from "../../../store/indexScenarioBuilder";
import ScenarioBuilder from "../../../components/ScenarioBuilder.vue";
import {expect} from "chai";
import sinon from "sinon";
import Vuetify from "vuetify";
import Vue from "vue";
import Layer from "ol/layer/Vector.js";
import Source from "ol/source/Vector.js";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import mockFeatureTypeDesc from "./mockFeatureTypeDesc.json";

config.mocks.$t = key => key;
Vue.use(Vuetify);

const localVue = createLocalVue();

localVue.use(Vuex);

global.requestAnimationFrame = (fn) => fn();

/**
 * mocks vuetify data-app attr
 * @returns {void}
 */
function addElemWithDataAppToBody () {
    const app = document.createElement("div");

    app.setAttribute("data-app", true);
    document.body.append(app);
}

describe("addons/cosi/ScenarioBuilder/components/ScenarioBuilder.vue", () => {
    before(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            updateSize: () => sinon.stub(),
            addEventListener: () => sinon.stub(),
            removeInteraction: () => sinon.stub(),
            removeEventListener: () => sinon.stub()
        };

        mapCollection.addMap(map, "2D");
        addElemWithDataAppToBody();
    });

    let store, vuetify, wrapper, sourceStub;

    const
        factory = {
            getMount: (mountFn = mount) => {
                return mountFn(ScenarioBuilder, {
                    store,
                    localVue,
                    vuetify,
                    sync: false
                });
            },
            initialize: async (mountFn = mount) => {
                wrapper = factory.getMount(mountFn);
                await wrapper.vm.$nextTick();
            }
        },
        feature = new Feature({
            id: "id",
            schulname: "feature 1",
            anzahl_schueler: 42,
            adresse_strasse_hausnr: "Hauptstraße",
            adresse_ort: "Hamburg",
            kapitelbezeichnung: "Grundschule",
            geometry: new Point([
                10.086822509765625,
                53.55825752009741
            ])
        }),
        layer = new Layer({
            id: "1234",
            name: "Staatliche Schulen",
            source: new Source({
                features: [feature]
            })
        }),
        layerMap = {
            layerId: "1234",
            id: "Staatliche Schulen",
            keyOfAttrName: "schulname",
            addressField: []
        };

    /**
     * @returns {void}
     */
    async function fakeDescribeFeatureType () {
        return mockFeatureTypeDesc;
    }

    /**
     * @param {Object} desc - the description for the featureType
     * @returns {void}
     */
    async function fakeGetValuesForFields (desc) {
        this.valuesForFields = {};

        for (const field of desc) {
            this.valuesForFields = {
                ...this.valuesForFields,
                [field.name]: ["placeholder"]
            };
        }
    }

    /**
     * @returns {void}
     */
    function setStubs () {
        sinon.stub(ScenarioBuilder.methods, "describeFeatureTypeByLayerId").callsFake(fakeDescribeFeatureType);
        sinon.stub(ScenarioBuilder.methods, "asyncGetValuesForField").callsFake(fakeGetValuesForFields);
    }

    beforeEach(async () => {
        vuetify = new Vuetify();
        sourceStub = {
            clear: sinon.stub()
        };
        store = new Vuex.Store({
            namespaced: true,
            modules: {
                Language: {
                    namespaced: true,
                    getters: {
                        currentLocale: () => "de-DE"
                    }
                },
                Tools: {
                    namespaced: true,
                    modules: {
                        ScenarioBuilder: ScenarioBuilderStore,
                        FeaturesList: {
                            namespaced: true,
                            getters: {
                                groupActiveLayer: sinon.stub().returns([{value: layerMap, text: layerMap.id}]),
                                activeVectorLayerList: sinon.stub().returns([layer])
                            }
                        },
                        Routing: {
                            namespaced: true,
                            getters: {
                                geosearchReverse: sinon.stub().returns({type: "NOMINATIM"})
                            }
                        }
                    }
                },
                mockFeatureTypeDesc: {
                    namespaced: true,
                    getters: {
                        getLayerById: () => sinon.stub().returns(layer),
                        // ol2DMap: () => ({
                        //     getLayers: () => ({getArray: sinon.stub()}),
                        //     addEventListener: sinon.stub(),
                        //     removeEventListener: sinon.stub(),
                        //     addInteraction: sinon.stub(),
                        //     removeInteraction: sinon.stub()
                        // }),
                        projectionCode: sinon.stub().returns("EPSG:25832")
                    },
                    mutations: {
                        setCenter: sinon.stub(),
                        removeLayerFromMap: () => sinon.stub()
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        projectionCode: () => "EPSG:25832"
                    },
                    actions: {
                        removeInteraction: () => sinon.stub(),
                        removeHighlightFeature: () => sinon.stub(),
                        addNewLayerIfNotExists: () => {
                            return Promise.resolve({
                                setVisible: () => sinon.stub(),
                                setZIndex: () => sinon.stub(),
                                setStyle: () => sinon.stub(),
                                setSource: () => sinon.stub(),
                                addEventListener: sinon.stub(),
                                getSource: () => sourceStub
                            });
                        }
                    },
                    mutations: {
                        removeLayerFromMap: () => sinon.stub()
                    }
                },
                MapMarker: {
                    namespaced: true,
                    actions: {
                        placingPointMarker: sinon.stub(),
                        removePointMarker: sinon.stub()
                    }
                }
            },
            getters: {
                isDefaultStyle: () => true,
                uiStyle: () => true,
                mobile: () => sinon.stub()
            }
        });
        store.commit("Tools/ScenarioBuilder/setActive", true);
        window.requestAnimationFrame = sinon.stub();
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper) {
            wrapper.destroy();
        }
    });

    describe("Component DOM", () => {
        it("should render Component", async () => {
            await factory.initialize();

            expect(wrapper.find("#scenario-builder-wrapper").exists()).to.be.true;
            expect(wrapper.find("#scenario-builder-wrapper").html()).to.not.be.empty;
            expect(wrapper.find("#scenario-manager").exists()).to.be.true;
            expect(wrapper.find("form").exists()).to.be.true;
        });

        it("should add property fields when layer is selected", async () => {
            setStubs();
            await factory.initialize();
            await wrapper.setData({workingLayer: layerMap});
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.workingLayer).to.deep.equal(layerMap);
            expect(wrapper.vm.featureTypeDescSorted.optional).to.have.lengthOf(3);
            expect(wrapper.vm.featureTypeDescSorted.required).to.have.lengthOf(1);
            expect(wrapper.vm.featureTypeDescSorted.required).to.have.lengthOf(1);
            expect(wrapper.vm.valuesForFields.schulname).to.deep.equal(["placeholder"]);
        });
    });
});
