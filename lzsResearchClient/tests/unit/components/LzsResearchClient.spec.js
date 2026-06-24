import {flushPromises, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import sinon from "sinon";

import Component from "../../../components/LzsResearchClient.vue";

describe("addons/lzsResearchClient/tests/unit/LzsResearchClient.spec.js", () => {
    let wrapper,
        store;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        LzsResearchClient: {
                            namespaced: true,
                            state: () => ({
                                showLoadingSpinner: false,
                                requestToken: "test-token",
                                errorMessage: ""
                            }),
                            getters: {
                                showLoadingSpinner: state => state.showLoadingSpinner,
                                errorMessage: () => "",
                                globalError: state => state.globalError ?? null,
                                requestToken: state => state.requestToken,
                                progressNow: () => -1,
                                currentProgressValue: () => "",
                                searchAttributeResponse: () => null,
                                selectedInstanceId: () => null
                            },
                            mutations: {
                                setShowLoadingSpinner (state, payload) {
                                    state.showLoadingSpinner = payload;
                                },
                                setGlobalError (state, payload) {
                                    state.globalError = payload;
                                },
                                setErrorMessage (state, payload) {
                                    state.errorMessage = payload;
                                }
                            },
                            actions: {
                                fetchRequestToken: () => Promise.resolve("mocked-request-token")
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
        sinon.restore();
    });

    it("should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("should have requestToken state set to 'test-token'", () => {
        expect(store.state.Modules.LzsResearchClient.requestToken).to.equal("test-token");
    });

    it("should have showLoadingSpinner state set to false", async () => {
        // Wait for all promises in mounted to resolve
        await flushPromises();

        expect(store.state.Modules.LzsResearchClient.showLoadingSpinner).to.equal(false);
    });

    it("should set globalError state when setGlobalError mutation is committed", async () => {
        const errorPayload = {
            type: "server",
            message: "Test error message"
        };

        store.commit("Modules/LzsResearchClient/setGlobalError", errorPayload);

        await wrapper.vm.$nextTick();

        expect(wrapper.find("confirm-modal-stub").attributes("showmodal")).to.equal("true");
    });

    describe("attachTabWatcher", () => {
        let tabResultMock, tabSearchMock, tabContainerMock, watchCallback, changeActiveTab;

        beforeEach(async () => {
            tabResultMock = {
                hideGeom: sinon.spy(),
                clearGeomAndGeomIndicator: sinon.spy(),
                showGeomAgain: sinon.spy(),
                syncGeomToInstance: sinon.spy()
            };
            tabSearchMock = {
                setMapInteractionsActive: sinon.spy(),
                cancelIncompleteDrawing: sinon.spy()
            };

            watchCallback = null;
            tabContainerMock = {
                $watch: (prop, callback) => {
                    if (prop === "activeTabIdLocal") {
                        watchCallback = callback;
                    }
                    return sinon.stub();
                },
                $refs: {
                    tabResult: [tabResultMock],
                    tabSearch: [tabSearchMock]
                }
            };

            await flushPromises();

            Object.defineProperty(wrapper.vm.$refs, "tabContainer", {
                configurable: true,
                get: () => tabContainerMock,
                set: sinon.stub()
            });

            wrapper.vm.tabWatcherAttached = false;

            await wrapper.vm.attachTabWatcher();

            changeActiveTab = (newTabId, oldTabId) => watchCallback(newTabId, oldTabId);
        });

        it("does nothing when tabContainer ref is not yet available", async () => {
            Object.defineProperty(wrapper.vm.$refs, "tabContainer", {
                configurable: true,
                get: () => null,
                set: sinon.stub()
            });
            wrapper.vm.tabWatcherAttached = false;

            await wrapper.vm.attachTabWatcher();

            expect(wrapper.vm.tabWatcherAttached).to.be.false;
        });

        it("switching to tabSearch hides the geometry", () => {
            changeActiveTab("tabSearch", "tabResult");
            expect(tabResultMock.hideGeom.calledOnce).to.be.true;
        });

        it("switching from tabSearch to tabResult after a new search clears the geometry", () => {
            wrapper.vm.newSearchPerformed = true;
            changeActiveTab("tabResult", "tabSearch");

            expect(wrapper.vm.newSearchPerformed).to.be.false;
            expect(tabResultMock.clearGeomAndGeomIndicator.calledOnce).to.be.true;
        });

        it("switching from tabSearch to tabResult without a new search shows the geometry again", () => {
            wrapper.vm.newSearchPerformed = false;
            changeActiveTab("tabResult", "tabSearch");
            expect(tabResultMock.showGeomAgain.calledOnce).to.be.true;
        });

        it("switching from tabDetails to tabResult shows the geometry again", () => {
            changeActiveTab("tabResult", "tabDetails");
            expect(tabResultMock.showGeomAgain.calledOnce).to.be.true;
        });

        it("switching to tabDetails syncs the geom instance with the current selectedInstanceId", () => {
            changeActiveTab("tabDetails", "tabResult");
            expect(tabResultMock.syncGeomToInstance.calledWith(null)).to.be.true;
        });

        it("switching to tabSearch activates map interactions", () => {
            watchCallback("tabSearch", "tabResult");
            expect(tabSearchMock.setMapInteractionsActive.calledWith(true)).to.be.true;
        });

        it("switching from tabSearch deactivates map interactions and cancels incomplete drawing", () => {
            watchCallback("tabDetails", "tabSearch");
            expect(tabSearchMock.setMapInteractionsActive.calledWith(false)).to.be.true;
            expect(tabSearchMock.cancelIncompleteDrawing.calledOnce).to.be.true;
        });
    });
});
