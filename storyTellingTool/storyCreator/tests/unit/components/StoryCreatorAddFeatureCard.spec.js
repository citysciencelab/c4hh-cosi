import {beforeEach} from "vitest";
import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import StoryCreatorAddFeatureCard from "../../../components/StoryCreatorAddFeatureCard.vue";

config.global.mocks.$t = key => key;

describe("addons/storyCreator/components/StoryCreatorAddFeatureCard.vue", () => {
    let store, wrapper;

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StoryManager: {
                            namespaced: true,
                            getters: {
                                gfiFeatures: (state) => state.gfiFeatures
                            },
                            actions: {
                                collectGfiFeatures: () => sinon.spy()
                            },
                            state: {
                                gfiFeatures: null
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        clickCoordinate: () => sinon.stub()
                    },
                    actions: {
                        placingPointMarker: sinon.spy(),
                        removePointMarker: sinon.spy(),
                        zoomToCoordinates: sinon.spy()
                    }
                }
            },
            getters: {
                layerConfigById: () => sinon.stub()
            }
        });
        wrapper = shallowMount(StoryCreatorAddFeatureCard, {
            global: {
                plugins: [store]
            },
            props: {
                selectedLayers: [],
                initialContent: undefined
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

        it("should render the geo icon", () => {
            expect(wrapper.find(".bi-geo-alt-fill").exists()).to.be.true;
        });

        it("should render the noSubjectLayerHint text", () => {
            expect(wrapper.find(".text-muted").text()).to.equal("additional:modules.storyCreator.chapter.noSubjectLayerHint");
        });

        it("should render the addFeatureDescription text", () => {
            wrapper = shallowMount(StoryCreatorAddFeatureCard, {
                global: {
                    plugins: [store]
                },
                props: {
                    selectedLayers: [{layerId: "1"}]
                }
            });

            expect(wrapper.find(".text-muted").text()).to.equal("additional:modules.storyCreator.chapter.addFeatureDescription");
        });

        it("should render the InputText component", async () => {
            await wrapper.setData({attributes: {}});

            expect(wrapper.findComponent({name: "InputText"}).exists()).to.be.true;
            expect(wrapper.findAllComponents({name: "InputText"}).length).to.equal(2);
        });

        it("should render a table", async () => {
            await wrapper.setData({attributes: {id: "1"}});

            expect(wrapper.find(".table").exists()).to.be.true;
        });

        it("should render the FlatButton component", async () => {
            await wrapper.setData({attributes: {}});

            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.true;
            expect(wrapper.findAllComponents({name: "FlatButton"}).length).to.equal(2);
        });
    });

    describe("Methods", () => {
        describe("getTitle", () => {
            it("should return the default title", () => {
                expect(wrapper.vm.getTitle("title")).to.equal("title");
            });

            it("should call the function getDefaultTitle", () => {
                const spyGetDefaultTitle = sinon.spy(wrapper.vm, "getDefaultTitle");

                wrapper.vm.getTitle(null);

                expect(spyGetDefaultTitle.calledOnce).to.be.true;
            });

            it("should return the title from initial content", () => {
                wrapper = shallowMount(StoryCreatorAddFeatureCard, {
                    global: {
                        plugins: [store]
                    },
                    props: {
                        selectedLayers: [{layerId: "1"}],
                        initialContent: {
                            attrs: {
                                title: "title"
                            }
                        }
                    }
                });

                sinon.spy(wrapper.vm, "getDefaultTitle");

                expect(wrapper.vm.getTitle(null)).to.equal("title");
            });
        });

        describe("removeAttribute", () => {
            it("should not delete any element", async () => {
                await wrapper.setData({attributes: {id: "1", text: "text"}});

                wrapper.vm.removeAttribute("key");
                expect(wrapper.vm.attributes).to.deep.equal({id: "1", text: "text"});
            });

            it("should delete one element", async () => {
                await wrapper.setData({attributes: {id: "1", text: "text"}});

                wrapper.vm.removeAttribute("text");
                expect(wrapper.vm.attributes).to.deep.equal({id: "1"});
            });
        });

        describe("saveFeature", () => {
            it("should emit the function addFeature", async () => {
                wrapper.vm.saveFeature();
                await wrapper.vm.$nextTick();
                expect(wrapper.emitted()).to.have.property("addFeature");
            });
        });
    });
});
