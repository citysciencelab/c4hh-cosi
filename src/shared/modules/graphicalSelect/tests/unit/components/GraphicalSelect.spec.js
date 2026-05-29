import {createStore} from "vuex";
import {shallowMount, config} from "@vue/test-utils";
import {expect} from "chai";
import GraphicalSelectComponent from "@shared/modules/graphicalSelect/components/GraphicalSelect.vue";
import GraphicalSelect from "@shared/modules/graphicalSelect/store/indexGraphicalSelect.js";
import sinon from "sinon";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import Polygon from "ol/geom/Polygon.js";
import LineString from "ol/geom/LineString.js";
import Feature from "ol/Feature.js";

config.global.mocks.$t = key => key;


let store, layersOnMap, layer, mockMapGetters, mockMapActions, mockAlertActions, map;

describe("src/shared/modules/graphicalSelect/components/GraphicalSelect.vue", () => {
    GraphicalSelectComponent.props.label = "";
    beforeEach(function () {
        map = {
            id: "ol",
            mode: "2D",
            addOverlay: sinon.spy(),
            removeOverlay: sinon.spy(),
            removeLayer: sinon.spy(),
            getLayers: () => {
                return {
                    getArray: () => layersOnMap
                };
            }
        };

        mockMapGetters = {};
        mockMapActions = {
            addLayer: sinon.spy(),
            removeInteraction: sinon.spy(),
            addInteraction: sinon.spy(),
            registerListener: sinon.spy(),
            removeLayer: sinon.spy()
        };
        mockAlertActions = {
            addSingleAlert: sinon.spy()
        };
        layersOnMap = [];
        layer = new VectorLayer({
            id: "geometry_selection_layer",
            name: "Geometry-Selection",
            source: new VectorSource(),
            alwaysOnTop: true
        });

        mapCollection.clear();
        mapCollection.addMap(map, "2D");

        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        GraphicalSelect
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: mockMapGetters,
                    actions: mockMapActions
                },
                Alerting: {
                    namespaced: true,
                    actions: mockAlertActions
                }
            }
        });
    });

    describe("Component DOM", () => {
        it("Dom should exist", () => {
            const wrapper = shallowMount(GraphicalSelectComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.exists()).to.be.true;
        });

        it("should have a select element", () => {
            const wrapper = shallowMount(GraphicalSelectComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("select").exists()).to.be.true;
            expect(wrapper.find("option").exists()).to.be.true;
            expect(wrapper.find("label").exists()).to.be.true;
        });

        it("the select element of class form-select has at least one option element", () => {
            const wrapper = shallowMount(GraphicalSelectComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAll("select.form-select > option")).to.not.have.lengthOf(0);
        });

        it("options contain only provided draw modus", () => {
            const wrapper = shallowMount(GraphicalSelectComponent, {
                global: {
                    plugins: [store]
                },
                props: {
                    options: {
                        "Box": "Box Title"
                    }
                }
            });

            for (const option in wrapper.vm.options) {
                expect(wrapper.vm.geographicValues).to.include(option);
            }
        });

        it("options does contain an invalid draw modus", () => {
            const wrapper = shallowMount(GraphicalSelectComponent, {
                global: {
                    plugins: [store]
                },
                props: {
                    options: {
                        "NonExisingOption": "NonExisingOption Title"
                    }
                }
            });

            for (const option in wrapper.vm.options) {
                expect(wrapper.vm.geographicValues).to.not.include(option);
            }

            expect(mockAlertActions.addSingleAlert.calledOnce).to.be.true;
        });

        it("should add Layer 1 times to map", () => {
            shallowMount(GraphicalSelectComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(mockMapActions.addLayer.calledOnce).to.be.true;
        });

        it("should add Layer 1 times to map, though createDrawInteraction called 2 times", () => {
            const wrapper = shallowMount(GraphicalSelectComponent, {
                global: {
                    plugins: [store]
                }
            });

            layersOnMap.push(layer);

            wrapper.vm.createDrawInteraction();

            expect(mockMapActions.addLayer.calledOnce).to.be.true;
        });

        it("should show buffer distance controls when Line is selected and a line is drawn", async () => {
            const wrapper = shallowMount(GraphicalSelectComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("input[type='range']").exists()).to.be.false;

            await wrapper.setData({
                selectedOptionData: "Line",
                lineDrawn: true
            });

            expect(wrapper.find("input[type='range']").exists()).to.be.true;
            expect(wrapper.find("input[type='number']").exists()).to.be.true;
        });
    });

    describe("resetView method", () => {
        it("should clear vector source, remove layer and overlays, and remove interaction", async () => {
            const wrapper = shallowMount(GraphicalSelectComponent, {
                global: {
                    plugins: [store]
                }
            });

            // Set up initial state
            wrapper.vm.layer = layer;
            layersOnMap.push(layer);
            wrapper.vm.draw = { /* mock draw interaction */ };
            wrapper.vm.circleOverlay = {element: {innerHTML: ""}};
            wrapper.vm.tooltipOverlay = {};

            await wrapper.vm.resetView();

            expect(wrapper.vm.layer.getSource().getFeatures()).to.have.lengthOf(0);
            expect(map.removeLayer.called).to.be.true;
            expect(mockMapActions.removeInteraction.calledOnce).to.be.true;
            expect(wrapper.vm.circleOverlay.element.innerHTML).to.equal("");
            expect(map.removeOverlay.calledWith(wrapper.vm.circleOverlay)).to.be.true;
            expect(map.removeOverlay.calledWith(wrapper.vm.tooltipOverlay)).to.be.true;
        });
    });

    describe("use existing geometry", () => {
        it("should add a layer using the geometry from the startGeometry prop", () => {
            const startGeometry = new Polygon([[[0, 0],
                    [10, 0],
                    [10, 10],
                    [0, 10],
                    [0, 0]]]),
                wrapper = shallowMount(GraphicalSelectComponent, {
                    global: {
                        plugins: [store]
                    },
                    props: {
                        startGeometry
                    }
                });

            // Assert that the layer contains the geometry from startGeometry
            const features = wrapper.vm.layer.getSource().getFeatures();

            expect(features).to.have.lengthOf(1);
            expect(features[0].getGeometry().getType()).to.equal("Polygon");
            expect(features[0].getGeometry().getCoordinates()).to.deep.equal(startGeometry.getCoordinates());
        });
    });

    describe("Line drawing and buffering", () => {
        it("getDrawType should return LineString for Line", () => {
            const wrapper = shallowMount(GraphicalSelectComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.getDrawType("Line")).to.equal("LineString");
        });

        it("handleLineDrawEnd should store the line geometry and set lineDrawn to true", () => {
            const wrapper = shallowMount(GraphicalSelectComponent, {
                    global: {
                        plugins: [store]
                    }
                }),
                geometry = new LineString([[0, 0], [10, 10]]);

            wrapper.vm.createBufferFromLine = sinon.spy();
            wrapper.vm.layer = layer;

            wrapper.vm.handleLineDrawEnd({
                feature: new Feature({
                    geometry: geometry
                })
            });

            expect(wrapper.vm.lineDrawn).to.be.true;
            expect(wrapper.vm.currentLineGeometry).to.not.be.null;
            expect(wrapper.vm.createBufferFromLine.calledOnce).to.be.true;
            expect(wrapper.vm.createBufferFromLine.calledWith(sinon.match({
                layer: wrapper.vm.layer,
                bufferDistance: wrapper.vm.bufferDistanceData,
                triggerEvent: true
            }))).to.be.true;
        });

        it("resetLineState should reset lineDrawn and currentLineGeometry", () => {
            const wrapper = shallowMount(GraphicalSelectComponent, {
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.lineDrawn = true;
            wrapper.vm.currentLineGeometry = new LineString([[0, 0], [10, 10]]);
            wrapper.vm.resetLineState();

            expect(wrapper.vm.lineDrawn).to.be.false;
            expect(wrapper.vm.currentLineGeometry).to.be.null;
        });

        it("updateBufferDistance should update bufferDistanceData and call createBufferFromLine with correct parameters", () => {
            const wrapper = shallowMount(GraphicalSelectComponent, {
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.createBufferFromLine = sinon.spy();
            wrapper.vm.setBufferDistance = sinon.spy();
            wrapper.vm.lineDrawn = true;
            wrapper.vm.currentLineGeometry = new LineString([[0, 0], [10, 10]]);
            wrapper.vm.layer = layer;

            wrapper.vm.updateBufferDistance({target: {value: "100"}});

            expect(wrapper.vm.bufferDistanceData).to.equal(100);
            expect(wrapper.vm.setBufferDistance.calledWith(100)).to.be.true;
            expect(wrapper.vm.createBufferFromLine.calledOnce).to.be.true;
            expect(wrapper.vm.createBufferFromLine.calledWith({
                geometry: wrapper.vm.currentLineGeometry,
                layer: wrapper.vm.layer,
                bufferDistance: 100,
                triggerEvent: false
            })).to.be.true;
        });

        it("finalizeBufferDistance should trigger createBufferFromLine with event emission", () => {
            const wrapper = shallowMount(GraphicalSelectComponent, {
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.createBufferFromLine = sinon.spy();
            wrapper.vm.lineDrawn = true;
            wrapper.vm.currentLineGeometry = new LineString([[0, 0], [10, 10]]);
            wrapper.vm.layer = layer;
            wrapper.vm.finalizeBufferDistance();

            expect(wrapper.vm.createBufferFromLine.calledOnce).to.be.true;
            expect(wrapper.vm.createBufferFromLine.calledWith({
                geometry: wrapper.vm.currentLineGeometry,
                layer: wrapper.vm.layer,
                bufferDistance: wrapper.vm.bufferDistanceData,
                triggerEvent: true
            })).to.be.true;
        });
    });
});
