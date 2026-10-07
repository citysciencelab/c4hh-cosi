import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import SearchBarResultListGeneralItemComponent from "../../../../components/searchBar/components/SearchBarResultListGeneralItem.vue";

describe("addons/lzsResearchClient/searchBar/components/SearchBarResultListGeneralItem.vue", () => {
    let store, wrapper, activateActionsStub;

    const baseSearchResult = {
        "category": "Straße",
        "id": "BeidemNeuenKrahnStraße",
        "index": 0,
        "name": "Bei dem Neuen Krahn",
        "searchInterfaceId": "gazetteer",
        "displayedInfo": "",
        "icon": "bi-signpost",
        "imagePath": "",
        "toolTip": "",
        "events": {}
    };

    beforeEach(() => {
        activateActionsStub = sinon.stub();

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        LzsResearchClient: {
                            namespaced: true,
                            actions: {
                                activateActions: activateActionsStub
                            }
                        }
                    }
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
        wrapper.unmount();
    });

    describe("computed: actions", () => {
        it("returns empty array when events is an empty object", () => {
            wrapper = shallowMount(SearchBarResultListGeneralItemComponent, {
                props: {searchResult: {...baseSearchResult, events: {}}},
                global:
                    {
                        mocks: {
                            $t: key => key
                        },
                        plugins: [store]
                    }
            });

            expect(wrapper.vm.actions).to.deep.equal([]);
        });

        it("returns empty array when events is undefined", () => {
            expect(wrapper.vm.actions).to.deep.equal([]);
        });

        it("returns the buttons object when events.buttons is defined", () => {
            const buttons = {
                zoomToResult: {someArg: "value"},
                highlightFeature: {otherArg: "value"}
            };

            wrapper = shallowMount(SearchBarResultListGeneralItemComponent, {
                props: {searchResult: {...baseSearchResult, events: {buttons}}},
                global: {
                    mocks: {
                        $t: key => key
                    },
                    plugins: [store]
                }
            });

            expect(wrapper.vm.actions).to.deep.equal(buttons);
        });

        it("renders no ActionButton when events has no buttons", async () => {
            wrapper = shallowMount(SearchBarResultListGeneralItemComponent, {
                props: {searchResult: {...baseSearchResult, events: {}}},
                global: {
                    mocks: {
                        $t: key => key
                    },
                    plugins: [store]
                }
            });

            await wrapper.vm.$nextTick();

            expect(wrapper.findAll("action-button-stub").length).to.equal(0);
        });
    });
});
