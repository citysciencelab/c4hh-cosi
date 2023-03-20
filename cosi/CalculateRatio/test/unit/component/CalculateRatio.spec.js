import Vuex from "vuex";
import
{
    config,
    shallowMount,
    createLocalVue
} from "@vue/test-utils";
import CalculateRatioComponent from "../../../components/CalculateRatio.vue";
import CalculateRatio from "../../../store/index";
import
{
    expect
} from "chai";
import sinon from "sinon";
import Vuetify from "vuetify";
import Vue from "vue";
import Tool from "../../../../../../src/modules/tools/ToolTemplate.vue";
import features_bev from "./features_bev.json";
import features_stadtteile from "./features_stadtteile.json";
import facilitiesMapping from "./facilitiesMapping.json";
import snapshot01 from "./snapshot01.json";
import snapshot02 from "./snapshot02.json";
import GeoJSON from "ol/format/GeoJSON";

Vue.use(Vuetify);

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

describe("CalculateRatio.vue", () => {
    // eslint-disable-next-line no-unused-vars
    let component, store, sandbox, selectedFeaturesStub, addSingleAlertStub, cleanupStub, vuetify, loadendStub,
        facilitiesMappingStub, layerListStub, expFacilitiesOptions, expFacilityList, expFeaturesOptions,
        selectedDistrictLevelStub, groupActiveLayerStub;

    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        CalculateRatio: {
                            name: "translate#additional:modules.tools.vueAddon.title",
                            icon: "bi-sliders2",
                            yearSelector: "jahr_"
                        }
                    }
                }
            }
        }
    };

    beforeEach(() => {
        vuetify = new Vuetify();
        sandbox = sinon.createSandbox();
        addSingleAlertStub = sinon.stub();
        cleanupStub = sinon.stub();
        loadendStub = sinon.stub();
        selectedFeaturesStub = sinon.stub();
        facilitiesMappingStub = sinon.stub();
        layerListStub = sinon.stub();
        selectedDistrictLevelStub = sinon.stub();
        groupActiveLayerStub = sinon.stub();

        expFacilityList = [{
            "group": "Kultur, Freizeit, Sport und Tourismus",
            "layer": [{
                "layerId": "19574",
                "id": "Öffentliche Bibliotheken",
                "numericalValues": [{
                    "id": "medienanzahl",
                    "name": "Medienanzahl",
                    "useConfigName": true
                }],
                "addressField": ["adresse"],
                "categoryField": "bezeichnung",
                "keyOfAttrName": "bezeichnung"
            }]
        }];

        expFacilitiesOptions = [{
            "header": "Kultur, Freizeit, Sport und Tourismus"
        },
        {
            "text": "Öffentliche Bibliotheken",
            "value": {
                "addressField": [
                    "adresse",
                    "ort"
                ],
                "categoryField": "bezeichnung",
                "id": "Öffentliche Bibliotheken",
                "keyOfAttrName": "bezeichnung",
                "layerId": "19574",
                "numericalValues": [
                    {
                        "id": "medienanzahl",
                        "name": "Medienanzahl",
                        "useConfigName": true
                    }
                ]
            }
        }];

        expFeaturesOptions = [
            {
                "header": "Bevölkerung"
            },
            {
                "text": "Bevölkerung insgesamt",
                "value": "Bevölkerung insgesamt"
            },
            {
                "text": "Bevölkerung weiblich",
                "value": "Bevölkerung weiblich"
            },
            {
                "text": "Bevölkerung männlich",
                "value": "Bevölkerung männlich"
            },
            {
                "text": "Bevölkerung unter 6 Jahren",
                "value": "Bevölkerung unter 6 Jahren"
            },
            {
                "text": "Bevölkerung unter 18 Jahren",
                "value": "Bevölkerung unter 18 Jahren"
            },
            {
                "text": "Bevölkerung 10 bis unter 15 Jahren",
                "value": "Bevölkerung 10 bis unter 15 Jahren"
            },
            {
                "text": "Bevölkerung 15 bis unter 21 Jahren",
                "value": "Bevölkerung 15 bis unter 21 Jahren"
            },
            {
                "text": "Bevölkerung 15 bis unter 65 Jahren",
                "value": "Bevölkerung 15 bis unter 65 Jahren"
            },
            {
                "text": "Bevölkerung 21 bis unter 45 Jahren",
                "value": "Bevölkerung 21 bis unter 45 Jahren"
            },
            {
                "text": "Bevölkerung 45 bis unter 65 Jahren",
                "value": "Bevölkerung 45 bis unter 65 Jahren"
            },
            {
                "text": "Bevölkerung 6 bis unter 10 Jahren",
                "value": "Bevölkerung 6 bis unter 10 Jahren"
            },
            {
                "text": "Bevölkerung ab 65 Jahren",
                "value": "Bevölkerung ab 65 Jahren"
            },
            {
                "text": "Ausländer insgesamt",
                "value": "Ausländer insgesamt"
            },
            {
                "text": "Bevölkerung mit Migrationshintergrund",
                "value": "Bevölkerung mit Migrationshintergrund"
            },
            {
                "header": "Bevölkerung Prognose"
            },
            {
                "text": "Bevölkerung weiblich unter 6 Jahren",
                "value": "Bevölkerung weiblich unter 6 Jahren"
            },
            {
                "text": "Bevölkerung maennlich unter 6 Jahren",
                "value": "Bevölkerung maennlich unter 6 Jahren"
            },
            {
                "text": "Bevölkerung weiblich 6 bis 17 Jahren",
                "value": "Bevölkerung weiblich 6 bis 17 Jahren"
            },
            {
                "text": "Bevölkerung maennlich 6 bis 17 Jahren",
                "value": "Bevölkerung maennlich 6 bis 17 Jahren"
            },
            {
                "text": "Bevölkerung weiblich 18 bis 64 Jahren",
                "value": "Bevölkerung weiblich 18 bis 64 Jahren"
            },
            {
                "text": "Bevölkerung maennlich 18 bis 64 Jahren",
                "value": "Bevölkerung maennlich 18 bis 64 Jahren"
            },
            {
                "text": "Bevölkerung weiblich ab 65 Jahren",
                "value": "Bevölkerung weiblich ab 65 Jahren"
            },
            {
                "text": "Bevölkerung maennlich ab 65 Jahren",
                "value": "Bevölkerung maennlich ab 65 Jahren"
            },
            {
                "header": "Fläche"
            },
            {
                "text": "Bruttofläche in ha",
                "value": "Bruttofläche in ha"
            },
            {
                "header": "Haushalte"
            },
            {
                "text": "Alleinerziehende",
                "value": "Alleinerziehende"
            },
            {
                "text": "Einpersonenhaushalte",
                "value": "Einpersonenhaushalte"
            },
            {
                "text": "Haushalte mit Kindern",
                "value": "Haushalte mit Kindern"
            },
            {
                "text": "Privathaushalte",
                "value": "Privathaushalte"
            },
            {
                "header": "Sozialversicherungspflichtige"
            },
            {
                "text": "Sozialversicherungspflichtig beschäftigte Frauen",
                "value": "Sozialversicherungspflichtig beschäftigte Frauen"
            },
            {
                "text": "Sozialversicherungspflichtig beschäftigte Männer",
                "value": "Sozialversicherungspflichtig beschäftigte Männer"
            },
            {
                "text": "Sozialversicherungspflichtig Beschäftigte insgesamt",
                "value": "Sozialversicherungspflichtig Beschäftigte insgesamt"
            },
            {
                "header": "Arbeitslose"
            },
            {
                "text": "SGB II (Arbeitlosengeld II) Empfänger insgesamt",
                "value": "SGB II (Arbeitlosengeld II) Empfänger insgesamt"
            },
            {
                "text": "SGB III (Arbeitslosengeld) Empfänger insgesamt",
                "value": "SGB III (Arbeitslosengeld) Empfänger insgesamt"
            },
            {
                "text": "Arbeitslose insgesamt",
                "value": "Arbeitslose insgesamt"
            },
            {
                "header": "SGB II Leistungen"
            },
            {
                "text": "Ausländische erwerbsfähige Leistungsempfänger/-innen nach SGB II",
                "value": "Ausländische erwerbsfähige Leistungsempfänger/-innen nach SGB II"
            },
            {
                "text": "Bedarfsgemeinschaften nach SGB II",
                "value": "Bedarfsgemeinschaften nach SGB II"
            },
            {
                "text": "Erwerbsfähige Leistungsempfänger/-innen nach SGB II",
                "value": "Erwerbsfähige Leistungsempfänger/-innen nach SGB II"
            },
            {
                "text": "Leistungsempfänger/-innen nach SGB II 15 bis unter 25 Jahren",
                "value": "Leistungsempfänger/-innen nach SGB II 15 bis unter 25 Jahren"
            },
            {
                "text": "Leistungsempfänger/-innen nach SGB II",
                "value": "Leistungsempfänger/-innen nach SGB II"
            },
            {
                "text": "Nicht erwerbsfähige Leistungs-empfänger/-innen nach SGB II",
                "value": "Nicht erwerbsfähige Leistungs-empfänger/-innen nach SGB II"
            },
            {
                "header": "Grundsicherung im Alter"
            },
            {
                "text": "Empfänger von Grundsicherung und weiteren Hilfeleistungen ab 65 Jahre",
                "value": "Empfänger von Grundsicherung und weiteren Hilfeleistungen ab 65 Jahre"
            },
            {
                "header": "Wohnen"
            },
            {
                "text": "Sozialwohnung mit Bindungsauslauf",
                "value": "Sozialwohnung mit Bindungsauslauf"
            },
            {
                "text": "Sozialwohnungen",
                "value": "Sozialwohnungen"
            },
            {
                "text": "Wohngebäude",
                "value": "Wohngebäude"
            },
            {
                "text": "Wohnungen in Wohn- und Nichtwohngebäuden",
                "value": "Wohnungen in Wohn- und Nichtwohngebäuden"
            },
            {
                "header": "Verkehr"
            },
            {
                "text": "Gewerbliche PKW",
                "value": "Gewerbliche PKW"
            },
            {
                "text": "PKW Bestand",
                "value": "PKW Bestand"
            },
            {
                "text": "Private PKW",
                "value": "Private PKW"
            }
        ];


        loadendStub.returns(true);
        selectedDistrictLevelStub.returns({districts: []});

        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        CalculateRatio,
                        DistrictSelector: {
                            namespaced: true,
                            getters: {
                                loadend: loadendStub,
                                keyOfAttrNameStats: () => "stadtteil",
                                keyOfAttrName: () => "stadtteil_name",
                                selectedFeatures: selectedFeaturesStub,
                                selectedDistrictLevel: selectedDistrictLevelStub
                            }
                        },
                        FeaturesList: {
                            namespaced: true,
                            getters: {
                                mapping: facilitiesMappingStub,
                                groupActiveLayer: groupActiveLayerStub
                            }
                        },
                        ColorCodeMap: {
                            namespaced: true,
                            getters: {
                                visualizationState: () => true
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        getVisibleLayerList: layerListStub
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: addSingleAlertStub,
                        cleanup: cleanupStub
                    }
                },
                Language: {
                    namespaced: true,
                    getters: {
                        currentLocale: () => "de-DE"
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            },
            getters: {
                uiStyle: () => true,
                mobile: () => sinon.stub()
            }
        });
        store.commit("Tools/CalculateRatio/setActive", true);
    });

    afterEach(function () {
        component.destroy();
        sandbox.restore();
    });

    // eslint-disable-next-line require-jsdoc
    async function mount (callLoadend) {

        component = shallowMount(CalculateRatioComponent, {
            stubs: {Tool},
            store,
            localVue,
            vuetify
        });

        await component.vm.$nextTick();
        if (callLoadend) {
            component.vm.$options.watch.loadend.call(component.vm, true);
        }
        return component;
    }

    describe("Component DOM", () => {
        it("should mount", async () => {
            const wrapper = await mount();

            expect(wrapper.find("#calculateratio").html()).to.not.be.empty;
            expect(wrapper.find("#calculateratio").html()).to.contain("additional:modules.tools.cosi.calculateRatio.warningNoData");
        });

        it.skip("should update data on loadend", async () => {
            selectedFeaturesStub.returns(new GeoJSON().readFeatures(features_stadtteile));

            const wrapper = await mount();

            expect(wrapper.vm.featuresList.length).to.be.eql(0);
            expect(wrapper.vm.subFeaturesList.length).to.be.eql(0);

            wrapper.vm.$options.watch.loadend.call(wrapper.vm, true);

            expect(wrapper.vm.featuresList.length).to.be.eql(57);
            expect(wrapper.vm.subFeaturesList.length).to.be.eql(8);
        });

        it("should show message on missing facilities", async () => {
            selectedFeaturesStub.returns(new GeoJSON().readFeatures(features_stadtteile));
            sinon.assert.callCount(addSingleAlertStub, 0);

            const wrapper = await mount(true);

            wrapper.find("#switchA").trigger("click");

            sinon.assert.callCount(addSingleAlertStub, 1);
            expect(addSingleAlertStub.firstCall.args[1]).to.include({
                category: "Warnung",
                content: "additional:modules.tools.cosi.calculateRatio.noFacilitiesWarning"
            });
        });

        it("should update facilityList", async () => {
            layerListStub.returns([{
                getProperties: () => ({name: "Öffentliche Bibliotheken"}),
                get: (id)=>id === "name" && "Öffentliche Bibliothekenname"
            }]);
            facilitiesMappingStub.returns(facilitiesMapping);
            selectedFeaturesStub.returns(new GeoJSON().readFeatures(features_stadtteile));
            groupActiveLayerStub.returns(expFacilitiesOptions);
            const wrapper = await mount(true);

            wrapper.vm.$options.watch.getVisibleLayerList.call(wrapper.vm);

            expect(wrapper.vm.facilityList).to.be.eql(expFacilityList);
        });

        it.skip("should switch after facilities available", async () => {
            layerListStub.returns([{
                getProperties: () => ({name: "Öffentliche Bibliotheken"}),
                get: (id)=>id === "name" && "Öffentliche Bibliothekenname"
            }]);
            facilitiesMappingStub.returns(facilitiesMapping);
            selectedFeaturesStub.returns(new GeoJSON().readFeatures(features_stadtteile));
            groupActiveLayerStub.returns(expFacilitiesOptions);
            const wrapper = await mount(true);

            await wrapper.vm.$options.watch.getVisibleLayerList.call(wrapper.vm);
            expect(wrapper.find("#switchA").text()).to.be.equal("additional:modules.tools.cosi.calculateRatio.dataA");
            expect(wrapper.find("#groupActiveLayerSelect").props("items")).to.be.eql(expFacilitiesOptions);

            await wrapper.find("#switchA").trigger("click");
            expect(wrapper.find("#switchA").text()).to.be.equal("additional:modules.tools.cosi.calculateRatio.dataB");
            expect(wrapper.find("#feature_selector_A").props("items")).to.be.eql(expFeaturesOptions);
        });

        it("should compute result on selection", async () => {
            selectedFeaturesStub.returns(new GeoJSON().readFeatures(features_stadtteile));

            const wrapper = await mount(true);

            let ms = wrapper.find("#feature_selector_A");

            wrapper.setData({selectedStatFeatures: new GeoJSON().readFeatures(features_bev)});
            ms.trigger("focus");
            ms.vm.$emit("input", "Bevölkerung insgesamt");

            await wrapper.vm.$nextTick();

            expect(wrapper.findAll(".feature_selection")).to.have.length(2);

            ms = wrapper.find("#feature_selector_B");
            ms.trigger("focus");
            ms.vm.$emit("input", "Bevölkerung weiblich");

            expect(wrapper.vm.selectedFieldA.id).to.be.equal("Bevölkerung insgesamt");
            expect(wrapper.vm.selectedFieldB.id).to.be.equal("Bevölkerung weiblich");

            await wrapper.vm.$nextTick();

            wrapper.find(".confirm").trigger("click");
            expect(JSON.parse(JSON.stringify(wrapper.vm.results))).to.be.eql(snapshot01);
            expect(JSON.parse(JSON.stringify(wrapper.vm.resultData(0)))).to.be.eql(snapshot02);
        });
    });
});

