import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import {reactive} from "vue";
import sinon from "sinon";

import Component from "../../../components/DownloadProgressBar.vue";

describe("addons/lzsResearchClient/tests/unit/components/DownloadProgressBar.spec.js", () => {
    let wrapper,
        store,
        storeState;

    beforeEach(() => {
        storeState = reactive({
            progressNow: -1,
            progressPhase: "",
            progressCurrent: 0,
            progressTotal: 0,
            errorMessage: "",
            downloadAbortController: null
        });

        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        LzsResearchClient: {
                            namespaced: true,
                            getters: {
                                progressNow: () => storeState.progressNow,
                                progressPhase: () => storeState.progressPhase,
                                progressCurrent: () => storeState.progressCurrent,
                                progressTotal: () => storeState.progressTotal,
                                errorMessage: () => storeState.errorMessage,
                                downloadAbortController: () => storeState.downloadAbortController
                            },
                            mutations: {
                                setProgressNow (state, val) {
                                    storeState.progressNow = val;
                                },
                                setProgressCurrent (state, val) {
                                    storeState.progressCurrent = val;
                                },
                                setProgressTotal (state, val) {
                                    storeState.progressTotal = val;
                                },
                                setProgressPhase (state, val) {
                                    storeState.progressPhase = val;
                                }
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            global: {
                mocks: {
                    $t: (key, pattern) => {
                        if (pattern) {
                            return key + ":" + Object.values(pattern).join(",");
                        }
                        return key;
                    }
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

    it("progressModalIsOpen should be true when progressNow >= 0 and false when progressNow is -1", async () => {
        expect(wrapper.vm.progressModalIsOpen).to.be.false;

        storeState.progressNow = 0;
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.progressModalIsOpen).to.be.true;

        storeState.progressNow = 100;
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.progressModalIsOpen).to.be.true;

        storeState.progressNow = -1;
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.progressModalIsOpen).to.be.false;
    });

    describe("progressBarCss", () => {
        it("should reflect progressNow as width", async () => {
            storeState.progressNow = 0;
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.progressBarCss).to.include({
                "width": "0%"
            });

            storeState.progressNow = 20;
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.progressBarCss).to.include({
                "width": "20%"
            });
        });

        it("should use blue color normally and red when errorMessage is set", async () => {
            storeState.progressNow = 20;
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.progressBarCss).to.include({
                "--progressBarColor": "#3C5F94"
            });

            storeState.errorMessage = "Something went wrong";
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.progressBarCss).to.include({
                "--progressBarColor": "#E10019"
            });
        });
    });

    it("closeModal should abort the controller and reset progressNow to -1 and progressPhase to empty string", () => {
        const abortFake = sinon.fake();

        storeState.downloadAbortController = {abort: abortFake};
        storeState.progressNow = 50;
        storeState.progressPhase = "download";

        wrapper.vm.closeModal();

        expect(abortFake.calledOnce).to.be.true;
        expect(storeState.progressNow).to.equal(-1);
        expect(storeState.progressPhase).to.equal("");
    });
});
