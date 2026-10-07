import {createStore} from "vuex";
import {mount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import ActionButton from "../../../../components/searchBar/components/ActionButton.vue";

describe("addons/lzsResearchClient/searchBar/components/ActionButton.vue", () => {
    let store,
        wrapper,
        callActionSpy,
        searchBarActions,
        searchBarMutations,
        isModuleAvailable;

    beforeEach(() => {
        isModuleAvailable = true;
        searchBarActions = {
            activateAction: sinon.spy()
        };
        searchBarMutations = {
            setCurrentActionEvent: sinon.spy()
        };
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        ActionButton,
                        LzsResearchClient: {
                            namespaced: true,
                            actions: searchBarActions,
                            mutations: searchBarMutations,
                            getters: {
                                iconsByActions: sinon.stub().returns(
                                    {
                                        setMarker: "bi-geo-alt-fill",
                                        zoomToResult: "bi-zoom-in"
                                    }
                                )
                            }
                        }
                    }
                }
            },
            getters: {
                isModuleAvailable: () => () => isModuleAvailable
            }
        });
        callActionSpy = sinon.spy(ActionButton.methods, "callAction");
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("render ActionButton in LzsResearchClientSearchBar", () => {
        it("should render button with 'setMarker' icon", async () => {
            const props = {
                actionName: "setMarker",
                actionArgs: {
                    coordinates: [1, 2]
                }
            };

            wrapper = mount(ActionButton, {
                global: {
                    mocks: {
                        $t: key => key
                    },
                    plugins: [store]
                },
                props
            });

            expect(wrapper.find("button").exists()).to.be.true;
            expect(wrapper.find("i").exists()).to.be.true;
            expect(wrapper.find("i").attributes("class")).to.be.equals(wrapper.vm.iconsByActions[props.actionName]);
            await wrapper.find("button").trigger("click");
            expect(callActionSpy.calledOnce).to.be.true;
            expect(searchBarActions.activateAction.calledOnce).to.be.true;
            expect(searchBarActions.activateAction.firstCall.args[1]).to.be.deep.equals(props);
            expect(searchBarMutations.setCurrentActionEvent.calledOnce).to.be.true;
        });

        it("should render button with 'zoomToResult' icon in LzsResearchClientSearchBar", async () => {
            const props = {
                actionName: "zoomToResult",
                actionArgs: {
                    coordinates: [1, 2]
                }
            };

            wrapper = mount(ActionButton, {
                global: {
                    mocks: {
                        $t: key => key
                    },
                    plugins: [store]
                },
                props
            });

            expect(wrapper.find("button").exists()).to.be.true;
            expect(wrapper.find("i").exists()).to.be.true;
            expect(wrapper.find("i").attributes("class")).to.be.equals(wrapper.vm.iconsByActions[props.actionName]);
            await wrapper.find("button").trigger("click");
            expect(callActionSpy.calledOnce).to.be.true;
            expect(searchBarActions.activateAction.calledOnce).to.be.true;
            expect(searchBarActions.activateAction.firstCall.args[1]).to.be.deep.equals(props);
            expect(searchBarMutations.setCurrentActionEvent.calledOnce).to.be.true;
        });
    });
});
