import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import Component from "../../../components/BimFactoryWorkflow.vue";

config.global.mocks.$t = key => key;

describe("addons/bimFactory/components/BimFactoryWorkflow.vue", () => {
    const mockWorkflows = {
            "workflows": [
                {
                    "id": 1,
                    "name": "Straßenbaumkataster",
                    "layerIds": {
                        "background": ["123"],
                        "foreground": ["182", "234"]
                    },
                    "config": ""
                },
                {
                    "id": 2,
                    "name": "Gelände",
                    "layerIds": {
                        "background": ["456"],
                        "foreground": ["789", "234"]
                    },
                    "config": ""
                }
            ]
        },
        mockWorkflowDetails = [
            {
                workflowId: 1,
                title: "Workflow Baumkataster",
                imgSrc: "https://fake-domain.test/fake-image.jpg",
                steps: [
                    {
                        "stepId": 1,
                        "title": "Umring erstellen",
                        "description": "Klicke im Bereich der Karte auf den Button Quadrat und erstelle somit einen Umring vom Projektgebiet im Raum Hamburg. Klicke danach auf 'Umring filtern'. Die vorhandenen Daten werden eingelesen und in eine Tabelle übertragen. Klicke danach auf 'Weiter'. Klicke im Bereich der Karte auf den Button Quadrat und erstelle somit einen Umring vom Projektgebiet im Raum Hamburg. Klicke danach auf 'Umring filtern'. Die vorhandenen Daten werden eingelesen und in eine Tabelle übertragen. Klicke danach auf 'Weiter' Klicke im Bereich der Karte auf den Button Quadrat und erstelle somit einen Umring vom Projektgebiet im Raum Hamburg. Klicke danach auf 'Umring filtern'. Die vorhandenen Daten werden eingelesen und in eine Tabelle übertragen. Klicke danach auf 'Weiter' Klicke im Bereich der Karte auf den Button Quadrat und erstelle somit einen Umring vom Projektgebiet im Raum Hamburg. Klicke danach auf 'Umring filtern'. Die vorhandenen Daten werden eingelesen und in eine Tabelle übertragen. Klicke danach auf 'Weiter' Klicke im Bereich der Karte auf den Button Quadrat und erstelle somit einen Umring vom Projektgebiet im Raum Hamburg. Klicke danach auf 'Umring filtern'. Die vorhandenen Daten werden eingelesen und in eine Tabelle übertragen. Klicke danach auf 'Weiter' Klicke im Bereich der Karte auf den Button Quadrat und erstelle somit einen Umring vom Projektgebiet im Raum Hamburg. Klicke danach auf 'Umring filtern'. Die vorhandenen Daten werden eingelesen und in eine Tabelle übertragen. Klicke danach auf 'Weiter' Klicke im Bereich der Karte auf den Button Quadrat und erstelle somit einen Umring vom Projektgebiet im Raum Hamburg. Klicke danach auf 'Umring filtern'. Die vorhandenen Daten werden eingelesen und in eine Tabelle übertragen. Klicke danach auf 'Weiter' Klicke im Bereich der Karte auf den Button Quadrat und erstelle somit einen Umring vom Projektgebiet im Raum Hamburg. Klicke danach auf 'Umring filtern'. Die vorhandenen Daten werden eingelesen und in eine Tabelle übertragen. Klicke danach auf 'Weiter' Klicke im Bereich der Karte auf den Button Quadrat und erstelle somit einen Umring vom Projektgebiet im Raum Hamburg. Klicke danach auf 'Umring filtern'. Die vorhandenen Daten werden eingelesen und in eine Tabelle übertragen. Klicke danach auf 'Weiter' Klicke im Bereich der Karte auf den Button Quadrat und erstelle somit einen Umring vom Projektgebiet im Raum Hamburg. Klicke danach auf 'Umring filtern'. Die vorhandenen Daten werden eingelesen und in eine Tabelle übertragen. Klicke danach auf 'Weiter'",
                        "components": [
                            {
                                "componentTitle": "Bäume filtern",
                                "componentContent": [
                                    {
                                        "type": "filter",
                                        "title": "Bäume filtern",
                                        "endpoint": "PathToFilterEndpoint",
                                        "responseType": "table"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "stepId": 2,
                        "title": "Eintragen der Projektinformationen",
                        "description": "Trage die allgemeinen Projektinformationen ein, die in der IFC-Datei aufgeführt sein sollen. Klicke danach auf 'Weiter'.",
                        "components": [
                            {
                                "componentTitle": "Projektinformationen",
                                "componentContent": [
                                    {
                                        "type": "textinput",
                                        "title": "Projektname",
                                        "machineName": "projectname",
                                        "defaultValue": "Projektname"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "IfcSite",
                                        "machineName": "ifc_site",
                                        "defaultValue": "Projektlage"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "IfcBuilding",
                                        "machineName": "ifc_building",
                                        "defaultValue": "Gebäudename"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "stepId": 3,
                        "title": "Georeferenzierung und Nullpunktobjekt",
                        "description": "Trage das Koordinatensystem und die Koordinaten des Nullpunktobjektes ein. Es kommt eine Information wie das Modell georeferenziert wird.",
                        "components": [
                            {
                                "componentTitle": "Pset_Georeferenzierung",
                                "componentContent": [
                                    {
                                        "type": "textinput",
                                        "title": "_Hoehenstatus",
                                        "machineName": "hoehenstatus",
                                        "defaultValue": "HS170"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "_Hoehensystem",
                                        "machineName": "hoehensystem",
                                        "defaultValue": "DHHN2016"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "_Koordinatensystem",
                                        "machineName": "koordinatensystem",
                                        "defaultValue": "ETRS89-UTM32N"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "_Lagestatus",
                                        "machineName": "lagestatus",
                                        "defaultValue": "LS310"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "stepId": 4,
                        "title": "Eintragen der allgemeinen Merkmale",
                        "description": "Fülle die allgemeinen Merkmale aus. Diese Merkmale werden allen Bäumen hinzugefügt und sind in allen Bäumen identisch. Klicke auf 'Weiter'",
                        "components": [
                            {
                                "componentTitle": "Pset_Objektinformation",
                                "componentContent": [
                                    {
                                        "type": "textinput",
                                        "title": "_IDEbene1",
                                        "machineName": "idebene1",
                                        "defaultValue": "Nullpunktobjekt"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "_IDEbene2",
                                        "machineName": "idebene2",
                                        "defaultValue": "Nullpunktobjekt"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "_IDEbene3",
                                        "machineName": "idebene3",
                                        "defaultValue": "Nullpunktobjekt"
                                    }
                                ]
                            },
                            {
                                "componentTitle": "Pset_Modellinformation",
                                "componentContent": [
                                    {
                                        "type": "textinput",
                                        "title": "_ArtFachmodell",
                                        "machineName": "_artfachmodell",
                                        "defaultValue": "Ingenieurbau/Bauwerk"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "_ArtTeilmodell",
                                        "machineName": "_artteilmodell",
                                        "defaultValue": "Bruecke"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "_Auftraggeber",
                                        "machineName": "auftraggeber",
                                        "defaultValue": "Musterfirma"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "_Ersteller",
                                        "machineName": "ersteller",
                                        "defaultValue": "Musterfirma"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "_Erstelldatum",
                                        "machineName": "erstelldatum",
                                        "defaultValue": "2024-08-12"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "_GemObjektkatalog",
                                        "machineName": "gemobjektkatalog",
                                        "defaultValue": "Allgemein/Master_V004"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "_Projektname",
                                        "machineName": "projektname",
                                        "defaultValue": "Musterprojekt"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "_Projektnummer",
                                        "machineName": "projektnummer",
                                        "defaultValue": "12345"
                                    }
                                ]
                            },
                            {
                                "componentTitle": "Pset_Hyperlink",
                                "componentContent": [
                                    {
                                        "type": "textinput",
                                        "title": "_Hyperlink_001",
                                        "machineName": "hyperlink1",
                                        "defaultValue": "www.bim.hamburg.de"
                                    },
                                    {
                                        "type": "textinput",
                                        "title": "_Hyperlink_001_bemerkung",
                                        "machineName": "hyperlink1bem",
                                        "defaultValue": "LinkZurHomepageVonBIM.Hamburg"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "stepId": 5,
                        "title": "Detaillierungsgrad des IFC-Modells",
                        "description": "Wähle den Detaillierungsgrad der Bäume. Klicke auf 'Weiter'",
                        "components": [
                            {
                                "componentTitle": "",
                                "componentContent": [
                                    {
                                        "type": "detailselector",
                                        "details": [
                                            {
                                                "detailId": 1,
                                                "imageSource": "pfadZurImageDateiFürId1",
                                                "title": "Bäume LoD1"
                                            },
                                            {
                                                "detailId": 2,
                                                "imageSource": "pfadZurImageDateiFürId2",
                                                "title": "Bäume LoD2"
                                            },
                                            {
                                                "detailId": 3,
                                                "imageSource": "pfadZurImageDateiFürId3",
                                                "title": "Bäume LoD3"
                                            },
                                            {
                                                "detailId": 4,
                                                "imageSource": "pfadZurImageDateiFürId4",
                                                "title": "Bäume LoD4"
                                            }
                                        ],
                                        "defaultValue": 1,
                                        "machineName": "level_of_geom"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "stepId": 6,
                        "title": "Erzeugung des IFC-Modells",
                        "description": "Klicke auf 'IFC-Datei generieren' und speichere die Datei ab. Sie wird im BIMViewer in der linken Seitenspalte geöffnet.",
                        "components": [
                            {
                                "componentTitle": "",
                                "componentContent": [
                                    {
                                        "type": "submit",
                                        "ogcAPIServiceURL": "pfadDerDasIFCGeneriert",
                                        "ogcAPIServiceProcessId": "oaf_baeume",
                                        "title": "IFC-Datei generieren"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                workflowId: 2,
                title: "Workflow Gelände",
                imgSrc: "",
                steps: []
            }
        ],
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        BimFactory: {
                            namespaced: true,
                            state: {
                                workflowsDetails: []
                            },
                            getters: {
                                workflowsJSON: () => {
                                    return mockWorkflows;
                                },
                                getWorkflowForId: () => (id) => {
                                    const res = mockWorkflows.workflows.filter((mock) => {

                                        return mock.id === id;
                                    })[0];

                                    return res ?? null;
                                },
                                getWorkflowDetailsForId: (state) => (id) => {
                                    let res = state.workflowsDetails.filter((detail) => detail.workflowId === id)[0];

                                    if (!res) {
                                        res = null;
                                    }
                                    return res;
                                },
                                previousWorkflowBackgroundLayer: sinon.spy()
                            },
                            actions: {
                                loadSingleWorkflow: sinon.stub().resolves(mockWorkflowDetails[0])
                            },
                            mutations: {
                                setWorkflowsDetails (state, payload) {
                                    state.workflowsDetails.push(payload);
                                },
                                initializeWorkflowFormData (state, payload) {
                                    state.workflowFormData = payload;
                                },
                                setPreviousWorkflowBackgroundLayer: sinon.spy(),
                                setPreviousWorkflowForegroundLayers: sinon.spy()
                            }
                        }
                    }
                }
            },
            actions: {
                replaceByIdInLayerConfig: sinon.stub().resolves()
            }
        }),
        globalMocks = {
            plugins: [store]
        };

    it("should exist", () => {
        const wrapper = shallowMount(Component, {
            global: globalMocks,
            propsData: {
                workflowId: 1
            }
        });

        expect(wrapper.exists()).to.be.true;
    });

    it("should find the correct workflow", () => {
        const wrapper = shallowMount(Component, {
            global: globalMocks,
            propsData: {
                workflowId: 1
            }
        });

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.vm.currentWorkflow).to.be.an("object");
        expect(wrapper.vm.currentWorkflow).to.deep.equal(mockWorkflows.workflows[0]);
    });

    it("should find nothing for the wrong workflowId", () => {
        const wrapper = shallowMount(Component, {
            global: globalMocks,
            propsData: {
                workflowId: 4
            }
        });

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.vm.currentWorkflow).to.be.null;
    });

    it("should find the correct workflow details", async () => {
        store.commit("Modules/BimFactory/setWorkflowsDetails", mockWorkflowDetails[0]);

        const wrapper = shallowMount(Component, {
            global: globalMocks,
            propsData: {
                workflowId: 1
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.vm.currentWorkflowDetails).to.be.an("object");
        expect(wrapper.vm.currentWorkflowDetails).to.deep.equal(mockWorkflowDetails[0]);
    });

    it("should return null if no workflow details are found", async () => {
        const wrapper = shallowMount(Component, {
            global: globalMocks,
            propsData: {
                workflowId: 2
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.vm.currentWorkflowDetails).to.be.null;
    });

    it("should correctly set the current workflow layers", async () => {
        const wrapper = shallowMount(Component, {
                global: globalMocks,
                propsData: {
                    workflowId: 1
                }
            }),
            replaceByIdInLayerConfigStub = sinon.stub().resolves();

        // Update the store to use the stubbed action
        store._actions.replaceByIdInLayerConfig[0] = replaceByIdInLayerConfigStub;
        wrapper.setData({currentWorkflow: mockWorkflows.workflows[0]});
        wrapper.vm.setCurrentWorkflowLayers();

        // Assert that replaceByIdInLayerConfig was called for the background layer
        sinon.assert.calledWith(replaceByIdInLayerConfigStub, sinon.match({
            layerConfigs: [
                {
                    id: "123", // Background layer ID for workflowId 1
                    layer: {
                        visibility: true
                    }
                }
            ]
        }));

        // Assert that replaceByIdInLayerConfig was called for each foreground layer
        sinon.assert.calledWith(replaceByIdInLayerConfigStub, sinon.match({
            layerConfigs: [
                {
                    id: "182",
                    layer: {
                        visibility: true
                    }
                }
            ]
        }));

        sinon.assert.calledWith(replaceByIdInLayerConfigStub, sinon.match({
            layerConfigs: [
                {
                    id: "234",
                    layer: {
                        visibility: true
                    }
                }
            ]
        }));
    });

    it("should find the image tag with correct attributes", async () => {
        store.commit("Modules/BimFactory/setWorkflowsDetails", mockWorkflowDetails[0]);

        const
            wrapper = shallowMount(Component, {
                global: globalMocks,
                propsData: {
                    workflowId: 1
                }
            }),
            attributes = wrapper.find("img").attributes();

        expect(attributes.src).to.equal("https://fake-domain.test/fake-image.jpg");
        expect(attributes.alt).to.equal("additional:modules.bimfactory.workflow.headerImageAlt");
    });

    it("should not find the image tag but the workflow name", async () => {
        // Workflow details without image
        store.commit("Modules/BimFactory/setWorkflowsDetails", mockWorkflowDetails[1]);

        const wrapper = shallowMount(Component, {
            global: globalMocks,
            propsData: {
                workflowId: 2
            }
        });

        expect(wrapper.find("img").exists()).to.be.false;
        expect(wrapper.find("h5.bimFactoryWorkflowTitle").exists()).to.be.true;
        expect(wrapper.find("h5.bimFactoryWorkflowTitle").text()).to.equal("Workflow Gelände");
    });
});
