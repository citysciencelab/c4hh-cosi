import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import BimFactoryWorkflowStep from "../../../components/BimFactoryWorkflowStep.vue";
import BimFactoryWorkflowInputErrors from "../../../components/BimFactoryWorkflowInputErrors.vue";

config.global.mocks.$t = key => key;

describe("BimFactoryWorkflowStep.vue", () => {
    const mockStep2 = {
            "stepId": 2,
            "title": "Eintragen der Projektinformationen",
            "description": "Trage die allgemeinen Projektinformationen ein, die in der IFC-Datei aufgeführt sein sollen. Klicke danach auf 'Weiter'.",
            "sections": [
                {
                    "containers": [
                        {
                            "containerTitle": "Projektinformationen",
                            "direction": "row",
                            "components": [
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
                }
            ]
        },
        mockStep3 = {
            "stepId": 3,
            "title": "Georeferenzierung und Nullpunktobjekt",
            "description": "Trage das Koordinatensystem und die Koordinaten des Nullpunktobjektes ein. Es kommt eine Information wie das Modell georeferenziert wird.",
            "sections": [
                {
                    "containers": [
                        {
                            "containerTitle": "Pset_Georeferenzierung",
                            "direction": "column",
                            "components": [
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
                }
            ]
        },
        mockStep4 = {
            "stepId": 4,
            "title": "Eintragen der allgemeinen Merkmale",
            "description": "Fülle die allgemeinen Merkmale aus. Diese Merkmale werden allen Bäumen hinzugefügt und sind in allen Bäumen identisch. Klicke auf 'Weiter'",
            "sections": [
                {
                    "direction": "row",
                    "containers": [
                        {
                            "containerTitle": "Pset_Objektinformation",
                            "direction": "column",
                            "components": [
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
                            "containerTitle": "Pset_Modellinformation",
                            "direction": "column",
                            "components": [
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
                            "containerTitle": "Pset_Hyperlink",
                            "direction": "column",
                            "components": [
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
                }
            ]
        },
        mockStep5 = {
            "description": "checks component BimFactoryWorkflowInputErrors with error output",
            "isOpen": true,
            "sections": [
                {
                    "direction": "row",
                    "containers": [
                        {
                            "containerId": "c1",
                            "containerTitle": "Container 1",
                            "direction": "column",
                            "components": [
                                {
                                    "type": "BimFactoryWorkflowInputText",
                                    "errors": [
                                        {"msg": "Error 1", "type": "string_type"},
                                        {"msg": "Error 2", "type": "number_type"}
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        mockStep6 = {
            "description": "checks not render BimFactoryWorkflowInputErrors when no errors",
            "isOpen": true,
            "sections": [
                {
                    "direction": "row",
                    "containers": [
                        {
                            "containerId": "c1",
                            "containerTitle": "Container 1",
                            "direction": "column",
                            "components": [
                                {
                                    "type": "BimFactoryWorkflowInputText",
                                    "errors": []
                                }
                            ]
                        }
                    ]
                }
            ]
        };

    let wrapper;

    /**
     *
     * @param {step} step
     * @returns {wrapper} - A Vue Test Utils wrapper instance for the mounted component.
     *
     * Mounts component with the given step
     */
    function mountComponent (step) {
        return shallowMount(BimFactoryWorkflowStep, {
            props: {
                step
            }
        });
    }

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("renders the component with all steps", () => {
        wrapper = mountComponent(mockStep2);

        expect(wrapper.exists()).to.be.true;
        wrapper = mountComponent(mockStep3);

        expect(wrapper.exists()).to.be.true;
        wrapper = mountComponent(mockStep4);

        expect(wrapper.exists()).to.be.true;
    });

    it("renders the description", () => {
        wrapper = mountComponent(mockStep2);
        const description = wrapper.find(".description");

        expect(description.exists()).to.be.true;
        expect(description.text()).to.equal(mockStep2.description);
    });

    it("renders sections with correct direction classes", () => {
        wrapper = mountComponent(mockStep4);
        const sectionDivs = wrapper.findAll(".section");

        sectionDivs.forEach((sectionDiv, index) => {
            const direction = mockStep4.sections[index].direction;

            expect(sectionDiv.classes()).to.include(`flex-${direction}`);
        });
    });

    it("renders containers with correct direction classes", () => {
        wrapper = mountComponent(mockStep4);
        const containerDivs = wrapper.findAll(".container");

        containerDivs.forEach((containerDiv, index) => {
            const direction = mockStep4.sections[0].containers[index].direction;

            expect(containerDiv.classes()).to.include(`flex-${direction}`);
        });
    });

    it("mockStep5: checks component BimFactoryWorkflowInputErrors with error output", () => {
        wrapper = mountComponent(mockStep5);

        const
            errorComponents = wrapper.findAllComponents(BimFactoryWorkflowInputErrors),
            errorProps = errorComponents[0].props("config");

        expect(errorComponents.length).to.equal(1);

        expect(errorProps.length).to.equal(2);
        expect(errorProps[0].msg).to.equal("Error 1");
        expect(errorProps[1].msg).to.equal("Error 2");
    });

    it("mockStep6: checks not render BimFactoryWorkflowInputErrors when no errors", () => {
        wrapper = mountComponent(mockStep6);

        const
            errorComponents = wrapper.findAllComponents(BimFactoryWorkflowInputErrors);

        expect(errorComponents.length).to.equal(0);
    });
});
