import {config, mount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import BimFactoryWorkflowInputText from "../../../components/BimFactoryWorkflowInputText.vue";

config.global.mocks.$t = key => key;

describe("BimFactoryWorkflowInputText.vue", () => {
    const mockConfigForStep2Component1 = {
            "containerTitle": "Projektinformationen",
            "containerId": "Projektinformationen",
            "component": {
                "type": "textinput",
                "title": "Projektname",
                "machineName": "projectname",
                "defaultValue": "Projektname"
            }
        },
        mockConfigForStep2Component2 = {
            "containerTitle": "Projektinformationen",
            "containerId": "Projektinformationen",
            "component": {
                "type": "textinput",
                "title": "IfcSite",
                "machineName": "ifc_site",
                "defaultValue": "Projektlage"
            }
        },
        mockConfigForStep2Component3 = {
            "containerTitle": "Projektinformationen",
            "containerId": "Projektinformationen",
            "component": {
                "type": "textinput",
                "title": "IfcBuilding",
                "machineName": "ifc_building",
                "defaultValue": "Gebäudename"
            }
        },
        mockConfigs = [
            mockConfigForStep2Component1,
            mockConfigForStep2Component2,
            mockConfigForStep2Component3
        ],
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BimFactory: {
                            namespaced: true,
                            state: {
                                workflowFormData: {
                                    containers: [
                                        {
                                            containerId: "Projektinformationen",
                                            containerTitle: "Projektinformationen",
                                            components: {
                                                projectname: {
                                                    title: "Projektname",
                                                    value: "Projektname"
                                                },
                                                ifc_site: {
                                                    title: "IfcSite",
                                                    value: "Projektlage"
                                                },
                                                ifc_building: {
                                                    title: "IfcBuilding",
                                                    value: "Gebäudename"
                                                }
                                            }
                                        }
                                    ]
                                }
                            },
                            mutations: {
                                updateWorkflowFormData (state, {containerId, machineName, value}) {
                                    const container = state.workflowFormData.containers.find(
                                        c => c.containerId === containerId
                                    );

                                    if (container && container.components[machineName]) {
                                        container.components[machineName].value = value;
                                    }
                                },
                                clearComponentErrors: sinon.stub()
                            }
                        }
                    }
                }
            }
        }),
        globalMocks = {
            plugins: [store]
        };

    let wrapper;

    /**
     * Mounts the component with the given config
     * @param {Object} configProp - The configuration object for the component
     * @returns {wrapper} - A Vue Test Utils wrapper instance for the mounted component
     */
    function mountComponent (configProp) {
        return mount(BimFactoryWorkflowInputText, {
            props: {
                config: configProp
            },
            global: globalMocks
        });
    }

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    mockConfigs.forEach((mockConfig) => {
        it("renders the InputText component with correct props for each component", () => {
            wrapper = mountComponent(mockConfig);

            const inputText = wrapper.find(`#${mockConfig.component.machineName}`);

            expect(inputText.exists()).to.be.true;
            expect(inputText.attributes("id")).to.equal(`${mockConfig.component.machineName}`);
            expect(inputText.attributes("placeholder")).to.equal(mockConfig.component.defaultValue);
            expect(inputText.element.value).to.equal(mockConfig.component.defaultValue);
        });

        it(`commits updateWorkflowFormData() to the store on input event for ${mockConfig.component.title}`, async () => {
            wrapper = mountComponent(mockConfig);

            const inputText = wrapper.find(`#${mockConfig.component.machineName}`),
                newValue = "New Input Value",
                container = store.state.Modules.BimFactory.workflowFormData.containers.find(
                    c => c.containerId === mockConfig.containerId
                );

            inputText.element.value = newValue;
            await inputText.trigger("input");

            expect(container.components[mockConfig.component.machineName].value).to.equal(newValue);
        });
    });

    it("throws an error if config is missing required properties", () => {
        expect(() => {
            mount(BimFactoryWorkflowInputText, {
                props: {
                    config: {
                        containerId: "Projektinformationen"
                        // Missing component object
                    }
                },
                global: globalMocks
            });
        }).to.throw();
    });

    it("checks clearComponentErrors() to the store on input event", async () => {
        let inputText = "";

        const
            commitSpy = sinon.spy();


        wrapper = mount(BimFactoryWorkflowInputText, {
            props: {
                config: mockConfigForStep2Component1
            },
            global: {
                mocks: {
                    $store: {commit: commitSpy},
                    $t: k => k
                }
            }
        });

        inputText = wrapper.find(`#${mockConfigForStep2Component1.component.machineName}`);

        inputText.element.value = "new value";

        await inputText.trigger("input");

        expect(commitSpy.calledWith("Modules/BimFactory/clearComponentErrors", {
            containerId: mockConfigForStep2Component1.containerId,
            machineName: mockConfigForStep2Component1.component.machineName,
            emptyError: true
        })).to.be.true;
    });

    it("checks clearComponentErrors() before updateWorkflowFormData() on input", async () => {
        const commitSpy = sinon.spy();

        let
            inputText = "",
            firstCall = commitSpy,
            secondCall = commitSpy;

        wrapper = mount(BimFactoryWorkflowInputText, {
            props: {
                config: mockConfigForStep2Component1
            },
            global: {
                mocks: {
                    $store: {commit: commitSpy},
                    $t: k => k
                }
            }
        });

        inputText = wrapper.find(`#${mockConfigForStep2Component1.component.machineName}`);

        inputText.element.value = "Noch ein Wert";

        await inputText.trigger("input");

        firstCall = commitSpy.getCall(0).args[0];
        secondCall = commitSpy.getCall(1).args[0];

        expect(firstCall).to.equal("Modules/BimFactory/clearComponentErrors");
        expect(secondCall).to.equal("Modules/BimFactory/updateWorkflowFormData");
    });
});
