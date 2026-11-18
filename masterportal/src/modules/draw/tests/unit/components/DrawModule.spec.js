import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import DrawModuleComponent from "@modules/draw/components/DrawModule.vue";
import {mapConfigStyleSettingsToLayout} from "@modules/draw/js/drawConfigSettings.js";


describe("src/modules/draw/components/DrawModule.vue", () => {
    let applyDrawTypeStyleStub,
        setCircleOptionsStub,
        setCurrentLayoutStub,
        setCurrentLayoutOuterCircleStub,
        setSelectedDrawTypeStub,
        setSelectedDrawTypeMainStub,
        setSelectedInteractionStub,
        setSelectedSymbolStub,
        selectedSymbol,
        selectedDrawType,
        selectedDrawTypeMain,
        enableAttributesSelector,
        preSelectedDownloadFormat,
        semicolonCSVDelimiter,
        store,
        wrapper;

    beforeAll(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            addLayer: sinon.spy(),
            getLayers: () => {
                return {
                    getArray: () => []
                };
            }
        };

        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        selectedDrawType = "";
        selectedDrawTypeMain = "";
        enableAttributesSelector = true;
        preSelectedDownloadFormat = "KML";
        semicolonCSVDelimiter = false;
        applyDrawTypeStyleStub = sinon.stub();
        setCircleOptionsStub = sinon.stub();
        setCurrentLayoutStub = sinon.stub();
        setCurrentLayoutOuterCircleStub = sinon.stub();
        setSelectedDrawTypeStub = sinon.stub();
        setSelectedDrawTypeMainStub = sinon.stub();
        setSelectedInteractionStub = sinon.stub();
        setSelectedSymbolStub = sinon.stub();
        selectedSymbol = null;

        store = createStore({
            actions: {
                addLayerToLayerConfig: sinon.stub()
            },
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        Draw: {
                            namespaced: true,
                            actions: {
                                initializeDrawLayer: sinon.stub().resolves(null)
                            },
                            getters: {
                                buttonsDisabled: () => false,
                                circleOptions: () => {
                                    return {
                                        innerRadius: 100,
                                        interactive: true,
                                        outerRadius: 500
                                    };
                                },
                                currentLayout: () => {
                                    return {
                                        fillColor: [55, 126, 184],
                                        fillTransparency: 0,
                                        strokeColor: [0, 0, 0],
                                        strokeWidth: 1,
                                        squareMethod: "interactive",
                                        squareArea: 0,
                                        squareUnit: "m"
                                    };
                                },
                                currentLayoutOuterCircle: () => {
                                    return {
                                        fillColor: [0, 0, 0],
                                        fillTransparency: 100,
                                        strokeColor: [200, 0, 0],
                                        strokeWidth: 1
                                    };
                                },
                                drawEdits: () => ["deleteAll", "delete", "modify", "editAttributes", "undo", "redo"],
                                enableAttributesSelector: () => enableAttributesSelector,
                                drawIcons: () => {
                                    return {
                                        box: "bi-square",
                                        circle: "bi-circle",
                                        doubleCircle: "bi-record-circle",
                                        geometries: "bi-hexagon-fill",
                                        line: "bi-slash-lg",
                                        pen: "bi-pencil-fill",
                                        point: "bi-circle-fill",
                                        polygon: "bi-octagon",
                                        symbols: "bi-circle-square"
                                    };
                                },
                                drawSymbolSettings: () => null,
                                drawLineSettings: () => null,
                                drawCurveSettings: () => null,
                                drawAreaSettings: () => null,
                                drawCircleSettings: () => null,
                                drawDoubleCircleSettings: () => null,
                                drawSquareSettings: () => null,
                                writeTextSettings: () => null,
                                preSelectedDownloadFormat: () => preSelectedDownloadFormat,
                                semicolonCSVDelimiter: () => semicolonCSVDelimiter,
                                drawTypesGeometrie: () => ["line", "box", "polygon", "circle", "doubleCircle"],
                                drawTypesMain: () => ["pen", "geometries", "symbols"],
                                drawTypesSymbols: () => ["point"],
                                iconList: () => [],
                                selectedDrawType: () => selectedDrawType,
                                selectedDrawTypeMain: () => selectedDrawTypeMain,
                                selectedInteraction: () => "draw",
                                selectedSymbol: () => selectedSymbol,
                                strokeRange: () => [1, 16],
                                units: sinon.stub().returns(["m", "km"])
                            },
                            mutations: {
                                addDrawTypeSymbol: sinon.stub(),
                                applyDrawTypeStyle: applyDrawTypeStyleStub,
                                incrementIdCounter: sinon.stub(),
                                setCircleOptions: setCircleOptionsStub,
                                setCurrentLayout: setCurrentLayoutStub,
                                setCurrentLayoutOuterCircle: setCurrentLayoutOuterCircleStub,
                                setLineLength: sinon.stub(),
                                setSelectedDrawType: setSelectedDrawTypeStub,
                                setSelectedDrawTypeMain: setSelectedDrawTypeMainStub,
                                setSelectedInteraction: setSelectedInteractionStub,
                                setSelectedSymbol: setSelectedSymbolStub
                            }
                        }
                    }
                }
            }
        });

        sinon.stub(document, "getElementById").callsFake(() => {
            return {
                getBoundingClientRect: () => ({
                    left: 100,
                    right: 200
                })
            };
        });
    });


    describe("DrawModule", () => {
        it("renders the draw module component", () => {
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("#modules-draw-module").exists()).to.be.true;
        });
    });

    describe("DrawEdit", () => {
        it("renders the shared module drawEdit", async () => {
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            await wrapper.vm.$nextTick();

            expect(wrapper.find("#draw-edit >draw-edit-stub").exists()).to.be.true;
            expect(wrapper.findAll("draw-edit-stub").length).to.equals(1);
        });
    });

    describe("DrawTypes and DrawLayout", () => {
        it("renders the shared module drawTypes", () => {
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("#draw-types > div > draw-types-stub").exists()).to.be.true;
        });

        it("renders the shared module drawTypes for selectedDrawTypeMain - geometries", () => {
            selectedDrawTypeMain = "geometries";

            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("layout-frame-stub").exists()).to.be.true;

            expect(wrapper.findAll("draw-types-stub").length).to.equals(2);
        });

        it("renders the shared module drawTypes for selectedDrawTypeMain - symbols", () => {
            selectedDrawTypeMain = "symbols";

            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAll("draw-types-stub").length).to.equals(2);
        });

        it("renders the shared module drawTypes and draw layouts for selectedDrawTypeMain - symbols and selectedDrawType - circle", () => {
            selectedDrawTypeMain = "geometries";
            selectedDrawType = "circle";

            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAll("draw-types-stub").length).to.equals(2);
            expect(wrapper.findAll("layout-frame-stub").length).to.equals(2);
        });

        it("renders the shared module drawTypes and draw layouts for selectedDrawTypeMain - symbols and selectedDrawType - doubleCircle", () => {
            selectedDrawTypeMain = "geometries";
            selectedDrawType = "doubleCircle";

            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAll("draw-types-stub").length).to.equals(2);
            expect(wrapper.findAll("layout-frame-stub").length).to.equals(2);
        });
    });

    describe("config settings mapping", () => {
        it("positive: maps drawLineSettings to current layout", () => {
            const result = mapConfigStyleSettingsToLayout({
                strokeWidth: 3,
                colorContour: [10, 20, 30, 1],
                opacityContour: 0.25,
                squareMethod: "defined"
            });

            expect(result).to.deep.equal({
                strokeWidth: 3,
                strokeColor: [10, 20, 30],
                fillTransparency: 75,
                squareMethod: "defined"
            });
        });

        it("negative: returns empty layout for invalid config settings", () => {
            const result = mapConfigStyleSettingsToLayout(undefined);

            expect(result).to.deep.equal({});
        });
    });

    describe("isEditAttributesControlEnabled", () => {
        it("positive: passes false to DrawEdit when enableAttributesSelector is false", () => {
            enableAttributesSelector = false;
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.isEditAttributesControlEnabled).to.be.false;
            expect(wrapper.findComponent({name: "DrawEdit"}).props("showEditAttributesControl")).to.be.false;
        });

        it("negative: passes true to DrawEdit when enableAttributesSelector is true", () => {
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.isEditAttributesControlEnabled).to.be.true;
            expect(wrapper.findComponent({name: "DrawEdit"}).props("showEditAttributesControl")).to.be.true;
        });
    });

    describe("download config forwarding", () => {
        it("positive: forwards preselected format to DrawEdit", () => {
            preSelectedDownloadFormat = "CSV";
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findComponent({name: "DrawEdit"}).props("preSelectedDownloadFormat")).to.equal("CSV");
        });

        it("negative: forwards null when no download preselection is configured", () => {
            preSelectedDownloadFormat = null;
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findComponent({name: "DrawEdit"}).props("preSelectedDownloadFormat")).to.equal(null);
        });

        it("positive: forwards semicolonCSVDelimiter to DrawEdit", () => {
            semicolonCSVDelimiter = true;
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findComponent({name: "DrawEdit"}).props("semicolonCsvDelimiter")).to.equal(true);
        });

        it("negative: forwards false semicolonCSVDelimiter by default", () => {
            semicolonCSVDelimiter = false;
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findComponent({name: "DrawEdit"}).props("semicolonCsvDelimiter")).to.equal(false);
        });
    });

    describe("applyDrawTypeState", () => {
        beforeEach(() => {
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });
        });

        it("positive: commits the changed style of the draw type with one dedicated mutation", () => {
            wrapper.vm.applyDrawTypeState("line");

            expect(applyDrawTypeStyleStub.calledOnce).to.be.true;
            expect(applyDrawTypeStyleStub.firstCall.args[1]).to.have.property("currentLayout");
            expect(applyDrawTypeStyleStub.firstCall.args[1]).to.not.have.property("circleOptions");
            expect(setCurrentLayoutStub.notCalled).to.be.true;
        });

        it("positive: includes the circle options for circle draw types", () => {
            wrapper.vm.applyDrawTypeState("circle");

            expect(applyDrawTypeStyleStub.calledOnce).to.be.true;
            expect(applyDrawTypeStyleStub.firstCall.args[1]).to.have.property("circleOptions");
            expect(setCircleOptionsStub.notCalled).to.be.true;
        });

        it("negative: does not commit if the restored snapshot equals the current layout", () => {
            wrapper.vm.layoutSnapshots.set("line", {...wrapper.vm.currentLayout});

            wrapper.vm.applyDrawTypeState("line");

            expect(applyDrawTypeStyleStub.notCalled).to.be.true;
        });

        it("negative: does not commit without a draw type", () => {
            wrapper.vm.applyDrawTypeState("");

            expect(applyDrawTypeStyleStub.notCalled).to.be.true;
        });
    });

    describe("guarded mutations", () => {
        beforeEach(() => {
            wrapper = shallowMount(DrawModuleComponent, {
                global: {
                    plugins: [store]
                }
            });
        });

        describe("setCurrentLayout", () => {
            it("positive: commits only the changed entries", () => {
                wrapper.vm.setCurrentLayout({strokeWidth: 5, fillColor: [55, 126, 184]});

                expect(setCurrentLayoutStub.calledOnce).to.be.true;
                expect(setCurrentLayoutStub.firstCall.args[1]).to.deep.equal({strokeWidth: 5});
            });

            it("negative: does not commit if all entries are unchanged", () => {
                wrapper.vm.setCurrentLayout({strokeWidth: 1, strokeColor: [0, 0, 0]});

                expect(setCurrentLayoutStub.notCalled).to.be.true;
            });
        });

        describe("setCurrentLayoutOuterCircle", () => {
            it("positive: commits only the changed entries", () => {
                wrapper.vm.setCurrentLayoutOuterCircle({fillTransparency: 50, strokeWidth: 1});

                expect(setCurrentLayoutOuterCircleStub.calledOnce).to.be.true;
                expect(setCurrentLayoutOuterCircleStub.firstCall.args[1]).to.deep.equal({fillTransparency: 50});
            });

            it("negative: does not commit if all entries are unchanged", () => {
                wrapper.vm.setCurrentLayoutOuterCircle({fillColor: [0, 0, 0], strokeWidth: 1});

                expect(setCurrentLayoutOuterCircleStub.notCalled).to.be.true;
            });
        });

        describe("setCircleOptions", () => {
            it("positive: commits only the changed entries", () => {
                wrapper.vm.setCircleOptions({innerRadius: 100, outerRadius: 800});

                expect(setCircleOptionsStub.calledOnce).to.be.true;
                expect(setCircleOptionsStub.firstCall.args[1]).to.deep.equal({outerRadius: 800});
            });

            it("negative: does not commit if all entries are unchanged", () => {
                wrapper.vm.setCircleOptions({innerRadius: 100, interactive: true});

                expect(setCircleOptionsStub.notCalled).to.be.true;
            });
        });

        describe("setSelectedDrawType", () => {
            it("positive: commits a different draw type", () => {
                wrapper.vm.setSelectedDrawType("line");

                expect(setSelectedDrawTypeStub.calledOnce).to.be.true;
                expect(setSelectedDrawTypeStub.firstCall.args[1]).to.equal("line");
            });

            it("negative: does not commit the current draw type", () => {
                wrapper.vm.setSelectedDrawType("");

                expect(setSelectedDrawTypeStub.notCalled).to.be.true;
            });
        });

        describe("setSelectedDrawTypeMain", () => {
            it("positive: commits a different main draw type", () => {
                wrapper.vm.setSelectedDrawTypeMain("pen");

                expect(setSelectedDrawTypeMainStub.calledOnce).to.be.true;
                expect(setSelectedDrawTypeMainStub.firstCall.args[1]).to.equal("pen");
            });

            it("negative: does not commit the current main draw type", () => {
                wrapper.vm.setSelectedDrawTypeMain("");

                expect(setSelectedDrawTypeMainStub.notCalled).to.be.true;
            });
        });

        describe("setSelectedInteraction", () => {
            it("positive: commits a different interaction", () => {
                wrapper.vm.setSelectedInteraction("modify");

                expect(setSelectedInteractionStub.calledOnce).to.be.true;
                expect(setSelectedInteractionStub.firstCall.args[1]).to.equal("modify");
            });

            it("negative: does not commit the current interaction", () => {
                wrapper.vm.setSelectedInteraction("draw");

                expect(setSelectedInteractionStub.notCalled).to.be.true;
            });
        });

        describe("setSelectedSymbol", () => {
            it("positive: commits a symbol if none is selected", () => {
                const symbol = {id: "iconPoint"};

                wrapper.vm.setSelectedSymbol(symbol);

                expect(setSelectedSymbolStub.calledOnce).to.be.true;
                expect(setSelectedSymbolStub.firstCall.args[1]).to.equal(symbol);
            });

            it("negative: does not commit null if no symbol is selected", () => {
                wrapper.vm.setSelectedSymbol(null);

                expect(setSelectedSymbolStub.notCalled).to.be.true;
            });
        });
    });
});
