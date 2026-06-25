import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import StoryCreatorAddFeatureCard from "../../../components/StoryCreatorAddFeatureCard.vue";
import {beforeEach} from "vitest";

config.global.mocks.$t = key => key;

describe("addons/storyCreator/components/StoryCreatorAddFeatureCard.vue", () => {
    let store, wrapper;

    beforeEach(() => {
        store = createStore({
            getters: {
                visibleSubjectDataLayerConfigs: () => []
            }
        });
        wrapper = shallowMount(StoryCreatorAddFeatureCard, {
            global: {
                plugins: [store]
            }
        });
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });

        it("should render the card", () => {
            expect(wrapper.find(".card").exists()).to.be.true;
        });

        it("should emit click:close event when close button is clicked", async () => {
            await wrapper.find(".btn-close").trigger("click");
            expect(wrapper.emitted("click:close")).to.have.lengthOf(1);
        });

        it("should render addFeatureDescription and loading dots if a visible non-3D subject layer exists", () => {
            store = createStore({
                    getters: {
                        visibleSubjectDataLayerConfigs: () => [{is3DLayer: false}]
                    }
                });
            wrapper = shallowMount(StoryCreatorAddFeatureCard, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.text()).to.include("additional:modules.storyCreator.chapter.addFeatureDescription");
            expect(wrapper.find(".dot-flashing").exists()).to.be.true;
        });

        it("should render noSubjectLayerHint if no visible non-3D subject layer exists", () => {
            store = createStore({
                    getters: {
                        visibleSubjectDataLayerConfigs: () => [{is3DLayer: true}]
                    }
                });
            wrapper = shallowMount(StoryCreatorAddFeatureCard, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.text()).to.include("additional:modules.storyCreator.chapter.noSubjectLayerHint");
            expect(wrapper.find(".dot-flashing").exists()).to.be.false;
        });
    });

    describe("Computed Properties", () => {
        it("should set computed existsVisibleSubjectLayer to true if at least one visible non-3D layer exists", () => {
            store = createStore({
                    getters: {
                        visibleSubjectDataLayerConfigs: () => [{is3DLayer: true}, {is3DLayer: false}]
                    }
                });
            wrapper = shallowMount(StoryCreatorAddFeatureCard, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.existsVisibleSubjectLayer).to.be.true;
        });

        it("should set computed existsVisibleSubjectLayer to false if only 3D layers exist", () => {
            store = createStore({
                    getters: {
                        visibleSubjectDataLayerConfigs: () => [{is3DLayer: true}]
                    }
                });
            wrapper = shallowMount(StoryCreatorAddFeatureCard, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.existsVisibleSubjectLayer).to.be.false;
        });
    });
});
