import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {shallowMount} from "@vue/test-utils";
import VectorSource from "ol/source/Vector.js";
import RoutingElevationProfileData from "@modules/routing/components/RoutingElevationProfile.vue";


describe("src/modules/routing/components/RoutingElevationProfileData.vue", () => {
    const routingDirections = {
            duration: 10,
            distance: 10,
            segments: [],
            elevationProfile: {
                data: [[0, 150], [10, 185], [17, 204]],
                ascent: 100,
                descent: 250
            }
        },

        tsrDirections = {
            duration: 15,
            distance: 20,
            segments: [],
            elevationProfile: {
                data: [[0, 200], [85, 350], [120, 305]],
                ascent: 75,
                descent: 50
            }
        },

        directionsElevationSource = new VectorSource(),
        tsrElevationSource = new VectorSource();

    let store,
        activeRoutingToolOption,
        wrapper;

    beforeEach(() => {
        activeRoutingToolOption = "DIRECTIONS";
        sinon.stub(RoutingElevationProfileData.methods, "drawChart").callsFake(function () {
            const isTsr = this.activeRoutingToolOption === "TSR";

            return {
                data: {
                    labels: this.distances,
                    datasets: [
                        {
                            data: this.elevations,
                            borderWidth: 2,
                            borderColor: isTsr ? "#32a9e8" : "#fe2c00",
                            backgroundColor: isTsr ? "#8cc7e6" : "#fccac0",
                            pointStyle: false,
                            fill: true,
                            cubicInterpolationMode: "monotone"
                        }
                    ]
                },
                destroy: sinon.stub(),
                update: sinon.stub(),
                render: sinon.stub(),
                config: {
                    type: "line"
                }
            };
        });
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        Routing: {
                            namespaced: true,
                            modules: {
                                Directions: {
                                    namespaced: true,
                                    getters: {
                                        routingDirections: () => routingDirections,
                                        directionsElevationSource: () => directionsElevationSource
                                    }
                                },
                                TSR: {
                                    namespaced: true,
                                    getters: {
                                        tsrDirections: () => tsrDirections,
                                        tsrElevationSource: () => tsrElevationSource
                                    }
                                }
                            },
                            getters: {
                                activeRoutingToolOption: () => activeRoutingToolOption,
                                directionsSettings: () => {
                                    return {
                                        styleElevationProfile: {
                                            profileColor: "#fe2c00",
                                            profileFillColor: "#fccac0",
                                            elevationPointLineColor: [0, 0, 0, 1.0],
                                            elevationPointFillColor: [125, 125, 125, 1.0]
                                        }
                                    };
                                },
                                tsrSettings: () => {
                                    return {
                                        styleElevationProfile: {
                                            profileColor: "#32a9e8",
                                            profileFillColor: "#8cc7e6",
                                            elevationPointLineColor: [0, 0, 0, 1.0],
                                            elevationPointFillColor: [125, 125, 125, 1.0]
                                        }
                                    };
                                }
                            }
                        }
                    }
                }
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should render the component", () => {
        wrapper = shallowMount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });
        expect(wrapper.findComponent(RoutingElevationProfileData).exists()).to.be.true;
    });

    it("computed directions should return routing directions", () => {
        wrapper = shallowMount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });
        expect(wrapper.vm.directions).equals(routingDirections);
    });

    it("computed directions should return tsr directions", () => {
        activeRoutingToolOption = "TSR";
        wrapper = shallowMount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });
        expect(wrapper.vm.directions).equals(tsrDirections);
    });

    it("computed layerSource should return directions layer source", () => {
        wrapper = shallowMount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });
        expect(wrapper.vm.layerSource).equals(directionsElevationSource);
    });

    it("computed layerSource should return tsr layer source", () => {
        activeRoutingToolOption = "TSR";
        wrapper = shallowMount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });
        expect(wrapper.vm.layerSource).equals(tsrElevationSource);
    });

    it("should extract directions data correctly", () => {
        wrapper = shallowMount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });

        expect(wrapper.vm.distances).deep.to.equal([0, 10, 17]);
        expect(wrapper.vm.elevations).deep.to.equal([150, 185, 204]);
        expect(wrapper.vm.ascent).equals("100");
        expect(wrapper.vm.descent).equals("250");
    });

    it("should extract tsr data correctly", () => {
        activeRoutingToolOption = "TSR";
        wrapper = shallowMount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });

        expect(wrapper.vm.distances).deep.to.equal([0, 85, 120]);
        expect(wrapper.vm.elevations).deep.to.equal([200, 350, 305]);
        expect(wrapper.vm.ascent).equals("75");
        expect(wrapper.vm.descent).equals("50");
    });

    it("should call draw chart (DIRECTIONS)", () => {
        wrapper = shallowMount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });

        expect(RoutingElevationProfileData.methods.drawChart.calledOnce).to.be.true;
        expect(wrapper.vm.chart.data.labels).to.deep.equal([0, 10, 17]);
        expect(wrapper.vm.chart.data.datasets).to.deep.equal([
            {
                data: [150, 185, 204],
                borderWidth: 2,
                borderColor: "#fe2c00",
                backgroundColor: "#fccac0",
                pointStyle: false,
                fill: true,
                cubicInterpolationMode: "monotone"
            }
        ]);
    });

    it("should call draw chart (TSR)", () => {
        activeRoutingToolOption = "TSR";

        wrapper = shallowMount(RoutingElevationProfileData, {
            global: {
                plugins: [store]
            },
            attachTo: document.body
        });

        expect(RoutingElevationProfileData.methods.drawChart.calledOnce).to.be.true;
        expect(wrapper.vm.chart.data.labels).to.deep.equal([0, 85, 120]);
        expect(wrapper.vm.chart.data.datasets).to.deep.equal([
            {
                data: [200, 350, 305],
                borderWidth: 2,
                borderColor: "#32a9e8",
                backgroundColor: "#8cc7e6",
                pointStyle: false,
                fill: true,
                cubicInterpolationMode: "monotone"
            }
        ]);
    });
});


// ---------------------------------------------------------------------------
// Isolated unit tests for drawChart and helper methods.
// drawChart accepts an optional ChartConstructor argument so a sinon spy can be
// injected directly, with no module-level mocking.
// ---------------------------------------------------------------------------
describe("RoutingElevationProfile.methods (isolated)", () => {
    const {drawChart, labelToolTip, titleToolTip, onHover, drawVerticalLine} =
        RoutingElevationProfileData.methods;

    /**
     * Builds a minimal component-instance context for direct method calls.
     * @param {string} activeRoutingToolOption
     * @returns {Object} minimal context object for method calls
     */
    function makeContext (activeRoutingToolOption = "DIRECTIONS") {
        return {
            distances: [0, 10, 17],
            elevations: [150, 185, 204],
            activeRoutingToolOption,
            directionsSettings: {
                styleElevationProfile: {
                    profileColor: "#fe2c00",
                    profileFillColor: "#fccac0",
                    elevationPointLineColor: [0, 0, 0, 1.0]
                }
            },
            tsrSettings: {
                styleElevationProfile: {
                    profileColor: "#32a9e8",
                    profileFillColor: "#8cc7e6",
                    elevationPointLineColor: [0, 0, 255, 1.0]
                }
            },
            $t: key => key,
            labelToolTip,
            titleToolTip,
            onHover,
            drawVerticalLine
        };
    }

    let canvas, ChartSpy;

    beforeEach(() => {
        canvas = document.createElement("canvas");
        // Injected spy avoids module-level mocking.
        ChartSpy = sinon.spy();
    });

    describe("drawChart", () => {
        it("calls the Chart constructor once with the canvas element", () => {
            drawChart.call(makeContext(), canvas, ChartSpy);
            expect(ChartSpy.calledOnce).to.be.true;
            expect(ChartSpy.firstCall.args[0]).to.equal(canvas);
        });

        it("creates a line chart", () => {
            drawChart.call(makeContext(), canvas, ChartSpy);
            expect(ChartSpy.firstCall.args[1].type).to.equal("line");
        });

        it("passes distances as labels and elevations as dataset data", () => {
            drawChart.call(makeContext(), canvas, ChartSpy);
            const {data} = ChartSpy.firstCall.args[1];

            expect(data.labels).to.deep.equal([0, 10, 17]);
            expect(data.datasets[0].data).to.deep.equal([150, 185, 204]);
        });

        it("applies DIRECTIONS profileColor and profileFillColor", () => {
            drawChart.call(makeContext("DIRECTIONS"), canvas, ChartSpy);
            const ds = ChartSpy.firstCall.args[1].data.datasets[0];

            expect(ds.borderColor).to.equal("#fe2c00");
            expect(ds.backgroundColor).to.equal("#fccac0");
        });

        it("applies TSR profileColor and profileFillColor", () => {
            drawChart.call(makeContext("TSR"), canvas, ChartSpy);
            const ds = ChartSpy.firstCall.args[1].data.datasets[0];

            expect(ds.borderColor).to.equal("#32a9e8");
            expect(ds.backgroundColor).to.equal("#8cc7e6");
        });

        it("leaves colors empty when activeRoutingToolOption is neither DIRECTIONS nor TSR", () => {
            drawChart.call(makeContext("OTHER"), canvas, ChartSpy);
            const ds = ChartSpy.firstCall.args[1].data.datasets[0];

            expect(ds.borderColor).to.equal("");
            expect(ds.backgroundColor).to.equal("");
        });

        it("wires labelToolTip and titleToolTip as tooltip callbacks", () => {
            drawChart.call(makeContext(), canvas, ChartSpy);
            const {callbacks} = ChartSpy.firstCall.args[1].options.plugins.tooltip;

            expect(callbacks.label).to.equal(labelToolTip);
            expect(callbacks.title).to.equal(titleToolTip);
        });

        it("registers onHover as the chart hover handler", () => {
            drawChart.call(makeContext(), canvas, ChartSpy);
            expect(ChartSpy.firstCall.args[1].options.onHover).to.equal(onHover);
        });

        it("registers drawVerticalLine as an afterDraw plugin", () => {
            drawChart.call(makeContext(), canvas, ChartSpy);
            expect(ChartSpy.firstCall.args[1].plugins[0].afterDraw).to.equal(drawVerticalLine);
        });

        it("sets responsive:true and maintainAspectRatio:false", () => {
            drawChart.call(makeContext(), canvas, ChartSpy);
            const {options} = ChartSpy.firstCall.args[1];

            expect(options.responsive).to.equal(true);
            expect(options.maintainAspectRatio).to.equal(false);
        });

        it("configures tooltip interaction mode as index without intersection", () => {
            drawChart.call(makeContext(), canvas, ChartSpy);
            const {interaction} = ChartSpy.firstCall.args[1].options;

            expect(interaction.mode).to.equal("index");
            expect(interaction.intersect).to.equal(false);
        });

        it("hides the x axis and shows the y axis title", () => {
            drawChart.call(makeContext(), canvas, ChartSpy);
            const {scales} = ChartSpy.firstCall.args[1].options;

            expect(scales.x.display).to.equal(false);
            expect(scales.y.title.display).to.equal(true);
        });
    });

    describe("labelToolTip", () => {
        it("formats the parsed y-value as a meters string", () => {
            expect(labelToolTip.call({}, {parsed: {y: 150}})).to.equal("150 m");
        });
    });

    describe("titleToolTip", () => {
        it("uses the meters translation key when distance is below 1000", () => {
            const ctx = {$t: (key, args) => `${args.distance}m`};

            expect(titleToolTip.call(ctx, [{label: "500"}])).to.equal("500.00m");
        });

        it("uses the kilometers translation key when distance is 1000 or above", () => {
            const ctx = {$t: (key, args) => `${args.distance}km`};

            expect(titleToolTip.call(ctx, [{label: "1500"}])).to.equal("1.50km");
        });
    });
});
