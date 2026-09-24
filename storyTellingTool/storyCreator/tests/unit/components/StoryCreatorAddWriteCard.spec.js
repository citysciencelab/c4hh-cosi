import {createStore} from "vuex";
import {expect} from "chai";
import Point from "ol/geom/Point.js";
import {shallowMount} from "@vue/test-utils";
import sinon from "sinon";
import StoryCreatorAddWriteCard from "../../../components/StoryCreatorAddWriteCard.vue";
import {Style} from "ol/style.js";

describe("addons/storyTellingTool/storyCreator/components/StoryCreatorAddWriteCard.vue", () => {
    let map, source, store, wrapper;

    const initialContent = {
        attrs: [
            {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [565254.8753343273, 5934769.70799329]
                },
                properties: {
                    text: "Testannotation"
                }
            },
            {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [
                        [566588.3746142377, 5932875.292349608],
                        [565371.291938129, 5932282.626002981]
                    ]
                },
                properties: {}
            }
        ]
    };

    beforeEach(() => {
        map = {
            getLayers: () => ({
                getArray: () => []
            }),
            addLayer: sinon.spy(),
            removeLayer: sinon.spy()
        };
        mapCollection.clear();
        mapCollection.addMap(map, "2D");

        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    actions: {
                        addInteraction: sinon.stub(),
                        removeInteraction: sinon.stub(),
                        registerListener: sinon.stub(),
                        unregisterListener: sinon.stub()
                    }
                }
            }
        });
        source = {
            addFeature: sinon.spy(),
            addFeatures: sinon.spy(),
            getFeatures: sinon.stub().returns([]),
            removeFeature: sinon.spy()
        };
        wrapper = shallowMount(StoryCreatorAddWriteCard, {
            props: {
                initialContent
            },
            global: {
                plugins: [store]
            }
        });
        wrapper.vm.source = source;
    });

    afterEach(() => {
        wrapper?.unmount();
        mapCollection.clear();
    });
    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });
        it("should render the card", () => {
            expect(wrapper.find(".card").exists()).to.be.true;
        });

        it("should render two IconButton", () => {
            expect(wrapper.findAllComponents({name: "IconButton"}).length).to.equal(2);
        });

        it("should render two FlatButton", () => {
            expect(wrapper.findAllComponents({name: "FlatButton"}).length).to.equal(2);
        });

        it("should render the text settings", () => {
            expect(
                wrapper.findComponent({name: "StoryCreatorAddWriteCardText"}).exists()
            ).to.be.true;
        });

        it("should not render the stroke settings initially", () => {
            expect(
                wrapper.findComponent({name: "StoryCreatorAddWriteCardStroke"}).exists()
            ).to.be.false;
        });
    });

    describe("Methods", () => {
        describe("createTextStyle", () => {
            it("should create a regular text style", () => {
                wrapper.vm.text = "Testannotation";
                wrapper.vm.textLayout = {
                    textColor: "rgb(255, 255, 255)",
                    fontSize: 24,
                    fontStyle: "regular",
                    backgroundColor: "rgb(0, 0, 0)",
                    backgroundOpacity: 50
                };

                const style = wrapper.vm.createTextStyle();
                const textStyle = style.getText();

                expect(textStyle.getText()).to.equal("Testannotation");
                expect(textStyle.getFont()).to.equal("24px sans-serif");
                expect(textStyle.getPadding()).to.deep.equal([8, 8, 8, 8]);
                expect(textStyle.getFill().getColor()).to.equal("rgb(255, 255, 255)");
                expect(textStyle.getBackgroundFill().getColor()).to.deep.equal([0, 0, 0, 0.5]);
            });

            it("should include the configured font style", () => {
                wrapper.vm.text = "Bold annotation";
                wrapper.vm.textLayout = {
                    textColor: "rgb(255, 255, 255)",
                    fontSize: 32,
                    fontStyle: "bold",
                    backgroundColor: "rgb(0, 0, 0)",
                    backgroundOpacity: 75
                };

                const style = wrapper.vm.createTextStyle();
                const textStyle = style.getText();

                expect(textStyle.getText()).to.equal("Bold annotation");
                expect(textStyle.getFont()).to.equal("bold 32px sans-serif");
                expect(textStyle.getBackgroundFill().getColor()).to.deep.equal([0, 0, 0, 0.75]);
            });

            it("should use a fallback background color for an invalid color", () => {
                wrapper.vm.textLayout = {
                    textColor: "rgb(255, 255, 255)",
                    fontSize: 24,
                    fontStyle: "regular",
                    backgroundColor: null,
                    backgroundOpacity: 50
                };

                const style = wrapper.vm.createTextStyle();
                const textStyle = style.getText();

                expect(textStyle.getBackgroundFill().getColor()).to.deep.equal([0, 0, 0, 0.5]);
            });
        });
        describe("createStrokeStyle", () => {
            it("should return a line style when type is not arrow", () => {
                const feature = {
                    getGeometry: () => ({
                        getCoordinates: () => [[10, 20], [30, 40]]
                    })
                };

                wrapper.vm.strokeLayout.type = "line";

                const result = wrapper.vm.createStrokeStyle(feature);

                expect(result).to.be.instanceOf(Style);
                expect(result.getStroke().getColor()).to.equal(wrapper.vm.strokeLayout.color);
                expect(result.getStroke().getWidth()).to.equal(wrapper.vm.strokeLayout.width);
            });

            it("should return line and arrow style for an arrow", () => {
                const feature = {
                    getGeometry: () => ({
                        getCoordinates: () => [[10, 20], [30, 40]]
                    })
                };

                wrapper.vm.strokeLayout.type = "arrow";

                const result = wrapper.vm.createStrokeStyle(feature);

                expect(result).to.be.an("array").with.lengthOf(2);
                expect(result[0]).to.be.instanceOf(Style);
                expect(result[1]).to.be.instanceOf(Style);
                expect(result[1].getGeometry()).to.be.instanceOf(Point);
                expect(result[1].getGeometry().getCoordinates()).to.deep.equal([30, 40]);
            });

        });
        describe("discardAnnotations", () => {
            it("should remove write features and reset annotations", () => {
                const writeFeature = {
                        get: key => key === "storyCreatorType" ? "write" : undefined
                    },
                    drawFeature = {
                        get: key => key === "storyCreatorType" ? "draw" : undefined
                    };

                source.getFeatures.returns([writeFeature, drawFeature]);

                wrapper.vm.annotations = [writeFeature];
                wrapper.vm.previewFeature = writeFeature;
                wrapper.vm.activeAnnotation = "text";

                wrapper.vm.discardAnnotations();

                expect(source.removeFeature.calledOnceWith(writeFeature)).to.be.true;
                expect(source.removeFeature.calledWith(drawFeature)).to.be.false;
                expect(wrapper.vm.annotations).to.deep.equal([]);
                expect(wrapper.vm.previewFeature).to.be.null;
                expect(wrapper.vm.activeAnnotation).to.be.null;
            });

            it("should not remove draw features", () => {
                const drawFeature = {
                    get: key => key === "storyCreatorType" ? "draw" : undefined
                };

                source.getFeatures.returns([drawFeature]);

                wrapper.vm.discardAnnotations();

                expect(source.removeFeature.called).to.be.false;
                expect(wrapper.vm.annotations).to.deep.equal([]);
                expect(wrapper.vm.previewFeature).to.be.null;
                expect(wrapper.vm.activeAnnotation).to.be.null;
            });
        });
        describe("getBackgroundColor", () => {
            it("should convert an RGB color to RGBA", () => {
                wrapper.vm.textLayout = {
                    backgroundColor: "rgb(10, 20, 30)",
                    backgroundOpacity: 50
                };

                expect(wrapper.vm.getBackgroundColor()).to.deep.equal([10, 20, 30, 0.5]);
            });

            it("should convert an RGBA color with the new opacity", () => {
                wrapper.vm.textLayout = {
                    backgroundColor: "rgba(10, 20, 30, 0.8)",
                    backgroundOpacity: 25
                };

                expect(wrapper.vm.getBackgroundColor()).to.deep.equal([10, 20, 30, 0.25]);
            });
        });
        describe("handleMapClick", () => {
            it("should add a text annotation", async () => {
                const previewFeature = {
                    setStyle: sinon.spy()
                };

                await wrapper.setData({
                    text: "Test text",
                    activeAnnotation: "text",
                    previewFeature,
                    annotations: []
                });

                source.removeFeature.resetHistory();
                source.addFeature.resetHistory();

                wrapper.vm.handleMapClick({
                    coordinate: [10, 20]
                });

                expect(source.removeFeature.calledOnceWith(previewFeature)).to.be.true;
                expect(source.addFeature.calledOnce).to.be.true;
                expect(wrapper.vm.annotations).to.have.lengthOf(1);
                expect(wrapper.vm.annotations[0].get("storyCreatorType")).to.equal("write");
                expect(wrapper.vm.annotations[0].getGeometry().getCoordinates()).to.deep.equal([10, 20]);
                expect(wrapper.vm.previewFeature).to.be.null;
            });

            it("should not add an annotation when there is no preview feature", async () => {
                await wrapper.setData({
                    text: "Test text",
                    activeAnnotation: "text",
                    previewFeature: null,
                    annotations: []
                });

                source.removeFeature.resetHistory();
                source.addFeature.resetHistory();

                wrapper.vm.handleMapClick({
                    coordinate: [10, 20]
                });

                expect(source.removeFeature.called).to.be.false;
                expect(source.addFeature.called).to.be.false;
                expect(wrapper.vm.annotations).to.have.lengthOf(0);
            });
        });
        describe("saveAnnotations", () => {
            it("should remove the preview feature and emit annotations", async () => {
                const previewFeature = {
                    setStyle: sinon.spy()
                };

                await wrapper.setData({
                    annotations: [],
                    previewFeature,
                    activeAnnotation: "text"
                });

                source.removeFeature.resetHistory();

                wrapper.vm.saveAnnotations();

                expect(source.removeFeature.calledOnceWith(previewFeature)).to.be.true;
                expect(wrapper.vm.previewFeature).to.be.null;
                expect(wrapper.emitted("addMapText")).to.have.lengthOf(1);
                expect(wrapper.emitted("addMapText")[0][0]).to.deep.equal([]);
                expect(wrapper.vm.activeAnnotation).to.be.null;
            });

            it("should emit annotations without a preview feature", async () => {
                await wrapper.setData({
                    annotations: [],
                    previewFeature: null,
                    activeAnnotation: "arrow"
                });

                source.removeFeature.resetHistory();

                wrapper.vm.saveAnnotations();

                expect(source.removeFeature.called).to.be.false;
                expect(wrapper.emitted("addMapText")).to.have.lengthOf(1);
                expect(wrapper.emitted("addMapText")[0][0]).to.deep.equal([]);
                expect(wrapper.vm.previewFeature).to.be.null;
                expect(wrapper.vm.activeAnnotation).to.be.null;
            });
        });
    });
});
