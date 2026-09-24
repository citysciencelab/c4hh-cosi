import {beforeEach} from "vitest";
import {shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import layerCollection from "@core/layers/js/layerCollection.js";
import sinon from "sinon";
import StoryCreatorAddDrawCard from "../../../components/StoryCreatorAddDrawCard.vue";


describe("addons/storyCreator/components/StoryCreatorAddDrawCard.vue", () => {
    let map, store, wrapper;

    beforeAll(() => {
        map = {
            id: "ol",
            mode: "2D",
            render: sinon.spy(),
            updateSize: sinon.spy(),
            on: sinon.spy(),
            un: sinon.spy(),
            getLayers: () => {
                return {
                    getArray: () => {
                        return [];
                    }
                };
            },
            addLayer: sinon.stub()
        };

        mapCollection.clear();
        mapCollection.addMap(map, "2D");
    });

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
                                currentLayout: (state) => state.currentLayout,
                                drawTypeLabels: (state) => state.drawTypeLabels,
                                drawTypesMain: (state) => state.drawTypesMain,
                                selectedDrawType: (state) => state.selectedDrawType,
                                selectedDrawTypeMain: (state) => state.selectedDrawTypeMain,
                                selectedInteraction: (state) => state.selectedInteraction
                            },
                            mutations: {
                                setCurrentLayout: sinon.spy(),
                                setDrawTypeLabels: sinon.spy(),
                                setSelectedDrawType: sinon.spy(),
                                setSelectedDrawTypeMain: sinon.spy(),
                                setSelectedInteraction: sinon.spy()
                            },
                            state: {
                                currentLayout: {},
                                drawTypeLabels: [],
                                drawTypesMain: ["polygon", "box", "circle", "line"],
                                selectedDrawType: "polygon",
                                selectedDrawTypeMain: "polygon",
                                selectedInteraction: null
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        addInteraction: sinon.spy(),
                        removeInteraction: sinon.spy()
                    }
                }
            }
        });
        wrapper = shallowMount(StoryCreatorAddDrawCard, {
            global: {
                plugins: [store]
            },
            props: {
                closeable: true,
                initialContent: {attrs: [
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [
                                        565254.8753343273,
                                        5934769.70799329
                                    ],
                                    [
                                        565985.1249399926,
                                        5934208.791629518
                                    ],
                                    [
                                        564937.3755057773,
                                        5933679.625248602
                                    ],
                                    [
                                        565254.8753343273,
                                        5934769.70799329
                                    ]
                                ]
                            ]
                        },
                        "properties": {
                            "title": "test1"
                        },
                        "style": {
                            "fillColor": [
                                60,
                                95,
                                148,
                                1
                            ],
                            "strokeColor": [
                                0,
                                0,
                                0
                            ],
                            "strokeLineDash": null,
                            "strokeWidth": 2
                        }
                    },
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [
                                    566588.3746142377,
                                    5932875.292349608
                                ],
                                [
                                    565371.291938129,
                                    5932282.626002981
                                ]
                            ]
                        },
                        "properties": {
                            "title": "test2"
                        },
                        "style": {
                            "fillColor": null,
                            "strokeColor": [
                                0,
                                0,
                                0
                            ],
                            "strokeLineDash": null,
                            "strokeWidth": 2
                        }
                    }
                ]}
            }
        });
        sinon.stub(layerCollection, "addLayer");
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });

        it("should render the DrawTypes", () => {
            expect(wrapper.findComponent({name: "DrawTypes"}).exists()).to.be.true;
        });

        it("should render the DrawLayout", () => {
            expect(wrapper.findComponent({name: "DrawLayout"}).exists()).to.be.true;
        });

        it("should render the card", () => {
            expect(wrapper.find(".card").exists()).to.be.true;
        });

        it("should render a table", async () => {
            expect(wrapper.find(".table").exists()).to.be.true;
        });

        it("should render one IconButton", async () => {
            expect(wrapper.findAllComponents({name: "IconButton"}).length).to.equal(1);
        });

        it("should render two FlatButton", async () => {
            expect(wrapper.findAllComponents({name: "FlatButton"}).length).to.equal(2);
        });
    });

    describe("Methods", () => {
        describe("activateFeature", () => {
            it("should activate a feature", () => {
                const feature = {
                    getStyle: sinon.stub().returns(null),
                    setStyle: sinon.spy()
                };

                wrapper.vm.activateFeature(feature);

                expect(wrapper.vm.activeFeature).to.deep.equal(feature);
                expect(wrapper.vm.activeFeatureOriginalStyle).to.equal(null);
                expect(feature.setStyle.calledOnce).to.be.true;
            });
            it("should not activate an active feature", () => {
                const feature = {
                    getStyle: sinon.stub().returns(null),
                    setStyle: sinon.spy()
                };

                wrapper.vm.activateFeature(feature);

                const activeFeature = wrapper.vm.activeFeature;

                activeFeature.setStyle.resetHistory();

                wrapper.vm.activateFeature(activeFeature);

                expect(activeFeature.setStyle.called).to.be.false;
            });
            it("should restore the previously active feature style", () => {
                const oldStyle = {},
                    oldFeature = {
                        getStyle: sinon.stub().returns(oldStyle),
                        setStyle: sinon.spy()
                    },
                    newFeature = {
                        getStyle: sinon.stub().returns(null),
                        setStyle: sinon.spy()
                    };

                wrapper.vm.activeFeature = oldFeature;
                wrapper.vm.activeFeatureOriginalStyle = oldStyle;

                wrapper.vm.activateFeature(newFeature);

                expect(oldFeature.setStyle.calledWith(oldStyle)).to.be.true;
                expect(wrapper.vm.activeFeature).to.deep.equal(newFeature);
            });

        });

        describe("addChapterFeature", () => {
            it("should add a feature to feature array", () => {
                const evt = {
                    feature: {
                        getId: () => "feature-3",
                        getGeometry: sinon.stub().returns({
                            getType: () => "Point",
                            getCoordinates: () => [0, 0]
                        }),
                        get: key => key === "title" ? "title 2" : {},
                        getStyle: sinon.stub().returns(null),
                        set: sinon.spy(),
                        setStyle: sinon.spy()
                    }
                };

                expect(wrapper.vm.features).to.be.an("array").with.lengthOf(2);
                wrapper.vm.addChapterFeature(evt);
                expect(wrapper.vm.features).to.be.an("array").with.lengthOf(3);
            });
        });

        describe("addDrawing", () => {
            it("should emit the addDrawing function", () => {
                wrapper.vm.addDrawing();
                expect(wrapper.emitted()).to.have.property("addDrawing");
            });
        });

        describe("getFeatureIcon", () => {
            it("should return default icon class", () => {
                const feature = {
                    getGeometry: () => ({
                        getType: () => ""
                    })
                };

                expect(wrapper.vm.getFeatureIcon(feature)).to.equal("bi bi-octagon");
            });

            it("should return default LineString class", () => {
                const feature = {
                    getGeometry: () => ({
                        getType: () => "LineString"
                    })
                };

                expect(wrapper.vm.getFeatureIcon(feature)).to.equal("bi bi-slash-lg");
            });

            it("should return default Circle class", () => {
                const feature = {
                    getGeometry: () => ({
                        getType: () => "Circle"
                    })
                };

                expect(wrapper.vm.getFeatureIcon(feature)).to.equal("bi bi-circle");
            });
        });

        describe("handleCloseButtonClick", () => {
            it("should trigger the function handleDiscardButtonClick und emit the click:close event", () => {
                const handleDiscardButtonClickSpy = sinon.spy(wrapper.vm, "handleDiscardButtonClick");

                wrapper.vm.handleCloseButtonClick();
                expect(handleDiscardButtonClickSpy.calledOnce).to.be.true;
                expect(wrapper.emitted()).to.have.property("click:close");
            });
        });

        describe("removeFeature", () => {
            it("should remove the features and feature title from the index", async () => {
                await wrapper.setData({featureTitle: ["title 1", "title 2"]});
                await wrapper.vm.removeFeature(1);

                expect(wrapper.vm.featureTitle).to.deep.equal(["title 1"]);
                expect(wrapper.vm.features).to.be.an("array").with.lengthOf(1);
            });
        });
        describe("toggleFeatureActive", () => {
            it("should activate an inactive feature", () => {
                const feature = {
                    getStyle: sinon.stub().returns(null),
                    setStyle: sinon.spy()
                };

                wrapper.vm.toggleFeatureActive(feature);

                expect(wrapper.vm.activeFeature).to.deep.equal(feature);
            });
            it("should deactivate the active feature", () => {
                const originalStyle = {},
                    feature = {
                        getStyle: sinon.stub().returns(originalStyle),
                        setStyle: sinon.spy()
                    };

                wrapper.vm.activateFeature(feature);

                feature.setStyle.resetHistory();

                wrapper.vm.toggleFeatureActive(wrapper.vm.activeFeature);

                expect(feature.setStyle.calledWith(originalStyle)).to.be.true;
                expect(wrapper.vm.activeFeature).to.be.null;
                expect(wrapper.vm.activeFeatureOriginalStyle).to.be.null;
            });
        });
    });
});
