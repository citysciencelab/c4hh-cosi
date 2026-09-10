
import {createStore} from "vuex";
import {expect} from "chai";
import {shallowMount} from "@vue/test-utils";
import sinon from "sinon";

import StoryPlayer from "../../../components/StoryPlayerToolbar.vue";

describe("addons/storyPlayer/tests/unit/components/StoryPlayerToolbar.spec.js", () => {
    let wrapper, store;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StoryPlayer: {
                            namespaced: true,
                            state: () => ({
                                fixedStoryPath: "assets/"
                            }),
                            getters: {
                                fixedStoryPath: (state) => state.fixedStoryPath
                            }
                        },
                        ShareView: {
                            namespaced: true,
                            getters: {
                                url: () => "https://example.com/portal?test=1"
                            }
                        }
                    }
                }
            }
        });
        wrapper = shallowMount(StoryPlayer, {
            global: {
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
    describe("Dom", () => {
        it("should not find Toast component", () => {
            expect(wrapper.findComponent({name: "Toast"}).exists()).to.be.false;
        });

        it("should find Toast component", async () => {
            await wrapper.setData({"linkCopied": true});
            expect(wrapper.findComponent({name: "Toast"}).exists()).to.be.true;
        });
    });

    describe("Methods", () => {
        describe("copyToClipboard", () => {
            let clipboardWriteTextStub, originalIsSecureContext, originalNavigator;

            beforeEach(() => {
                clipboardWriteTextStub = sinon.stub().resolves();
                originalIsSecureContext = globalThis.isSecureContext;
                originalNavigator = globalThis.navigator;
                globalThis.isSecureContext = true;
                globalThis.navigator = Object.assign({}, globalThis.navigator, {
                    clipboard: {writeText: clipboardWriteTextStub}
                });
            });

            afterEach(() => {
                globalThis.isSecureContext = originalIsSecureContext;
                globalThis.navigator = originalNavigator;
            });

            it("positive: writes url+'#' to clipboard when isSecureContext is true", async () => {
                await wrapper.vm.copyToClipboard();
                expect(clipboardWriteTextStub.calledOnce).to.be.true;
                expect(clipboardWriteTextStub.calledWith("https://example.com/portal?test=1#")).to.be.true;
            });

            it("positive: sets linkCopied to true after successful copy", async () => {
                await wrapper.vm.copyToClipboard();
                expect(wrapper.vm.linkCopied).to.be.true;
            });

            it("positive: clicking the share button calls copyToClipboard", async () => {
                await wrapper.findAllComponents({name: "IconButton"})[1].props("interaction")();
                expect(clipboardWriteTextStub.calledOnce).to.be.true;
                expect(clipboardWriteTextStub.calledWith("https://example.com/portal?test=1#")).to.be.true;
                expect(wrapper.vm.linkCopied).to.be.true;
            });
        });

    });
});
