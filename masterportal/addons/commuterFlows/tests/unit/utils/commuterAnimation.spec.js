import {expect} from "chai";
import {CommuterAnimation} from "../../../utils/commuterAnimation.js";

describe("addons/commuterFlows/utils/commuterAnimation.js", () => {
    const generalDummy = new CommuterAnimation("featureList", "speeds", "layerBubbles", "layerAnimation", {
        hideLayer: () => {
            return false;
        },
        clearLayer: () => {
            return false;
        }
    }, "createBubbleStyle");

    describe("getDistance", () => {
        it("should return zero if no or an invalid elapsedTime is given", () => {
            expect(generalDummy.getDistance(0)).to.equal(0);

            expect(generalDummy.getDistance()).to.equal(0);
            expect(generalDummy.getDistance(null)).to.equal(0);
            expect(generalDummy.getDistance("string")).to.equal(0);
            expect(generalDummy.getDistance(true)).to.equal(0);
            expect(generalDummy.getDistance({})).to.equal(0);
            expect(generalDummy.getDistance([])).to.equal(0);
        });
        it("should return zero if no or an invalid speedsTotal is given", () => {
            expect(generalDummy.getDistance(1, 0)).to.equal(0);

            expect(generalDummy.getDistance(1)).to.equal(0);
            expect(generalDummy.getDistance(1, null)).to.equal(0);
            expect(generalDummy.getDistance(1, "string")).to.equal(0);
            expect(generalDummy.getDistance(1, true)).to.equal(0);
            expect(generalDummy.getDistance(1, {})).to.equal(0);
            expect(generalDummy.getDistance(1, [])).to.equal(0);
        });
        it("should return zero if an empty or an invalid speeds array is given", () => {
            expect(generalDummy.getDistance(1, 1, [])).to.equal(0);

            expect(generalDummy.getDistance(1, 1)).to.equal(0);
            expect(generalDummy.getDistance(1, 1, null)).to.equal(0);
            expect(generalDummy.getDistance(1, 1, "string")).to.equal(0);
            expect(generalDummy.getDistance(1, 1, true)).to.equal(0);
            expect(generalDummy.getDistance(1, 1, {})).to.equal(0);
        });

        it("should calculate the forwards distance if elapsed time hits a range at an even speeds index", () => {
            const elapsedTime = 3,
                speedsTotal = 40,
                speeds = [10, 10, 10, 10],
                expected = "0.3";

            expect(generalDummy.getDistance(elapsedTime, speedsTotal, speeds).toFixed(1)).to.equal(expected);
            expect(generalDummy.getDistance(elapsedTime + 20, speedsTotal, speeds).toFixed(1)).to.equal(expected);
        });
        it("should calculate the backwards distance if elapsed time hits a range at an odd speeds index", () => {
            const elapsedTime = 13,
                speedsTotal = 40,
                speeds = [10, 10, 10, 10],
                expected = 0.7;

            expect(generalDummy.getDistance(elapsedTime, speedsTotal, speeds)).to.equal(expected);
            expect(generalDummy.getDistance(elapsedTime + 20, speedsTotal, speeds)).to.equal(expected);
        });
        it("should loop over speeds if elapsedTime is greater than speedsTotal", () => {
            const elapsedTime = 3,
                speedsTotal = 40,
                speeds = [10, 10, 10, 10],
                expected = "0.3";

            expect(generalDummy.getDistance(elapsedTime + 40, speedsTotal, speeds).toFixed(1)).to.equal(expected);
            expect(generalDummy.getDistance(elapsedTime + 60, speedsTotal, speeds).toFixed(1)).to.equal(expected);
            expect(generalDummy.getDistance(elapsedTime + 80, speedsTotal, speeds).toFixed(1)).to.equal(expected);
            expect(generalDummy.getDistance(elapsedTime + 100, speedsTotal, speeds).toFixed(1)).to.equal(expected);
            expect(generalDummy.getDistance(elapsedTime + 120, speedsTotal, speeds).toFixed(1)).to.equal(expected);
        });
        it("should jump over a speed of 0", () => {
            const speedsTotal = 20,
                speeds = [10, 0, 10, 0];

            expect(generalDummy.getDistance(9, speedsTotal, speeds)).to.equal(0.9);
            expect(generalDummy.getDistance(10, speedsTotal, speeds)).to.not.equal(1);
            expect(generalDummy.getDistance(10, speedsTotal, speeds)).to.equal(0);
            expect(generalDummy.getDistance(11, speedsTotal, speeds)).to.equal(0.1);
        });
    });

    describe("start and stop", () => {
        let calledHideLayer = false,
            calledShowLayer = false,
            calledUnPostRender = false,
            calledOnPostRender = false,
            calledRender = false;
        const olConnectors = {
                clearLayer: () => {
                    return false;
                },
                hideLayer: layer => {
                    calledHideLayer = layer;
                },
                showLayer: layer => {
                    calledShowLayer = layer;
                },
                unPostRender: (layer, event) => {
                    calledUnPostRender = [layer, event];
                },
                onPostRender: (layer, event) => {
                    calledOnPostRender = [layer, event];
                },
                render: () => {
                    calledRender = true;
                },
                resetStartDummy: (dummy) => {
                    calledHideLayer = false;
                    calledShowLayer = false;
                    calledUnPostRender = false;
                    calledOnPostRender = false;
                    calledRender = false;
                    CommuterAnimation.moveFeatureRef = null;
                    dummy.startTime = null;
                }
            },
            startDummy = new CommuterAnimation("featureList", "speeds", "layerBubbles", "layerAnimation", olConnectors, "createBubbleStyle");

        describe("start", () => {
            it("should hide the bubble layer", () => {
                olConnectors.resetStartDummy(startDummy);
                startDummy.start();
                expect(calledHideLayer).to.equal("layerBubbles");
            });
            it("should show the animation layer", () => {
                olConnectors.resetStartDummy(startDummy);
                startDummy.start();
                expect(calledShowLayer).to.equal("layerAnimation");
            });
            it("should not call un with moveFeatureRef for layerAnimation if moveFeatureRef is not a function", () => {
                olConnectors.resetStartDummy(startDummy);
                startDummy.start();
                expect(calledUnPostRender).to.be.false;
            });
            it("should call un with moveFeatureRef for layerAnimation if moveFeatureRef is a function", () => {
                olConnectors.resetStartDummy(startDummy);
                CommuterAnimation.moveFeatureRef = () => {
                    return "moveFeatureRef";
                };
                startDummy.start();
                expect(calledUnPostRender).to.be.an("array").with.lengthOf(2);
                expect(calledUnPostRender[0]).to.equal("layerAnimation");
                expect(calledUnPostRender[1]).to.be.a("function");
                expect(calledUnPostRender[1]()).to.equal("moveFeatureRef");
            });
            it("should set a new moveFeatureRef", () => {
                olConnectors.resetStartDummy(startDummy);
                startDummy.start();
                expect(CommuterAnimation.moveFeatureRef).to.be.a("function");
            });
            it("should set moveFeatureRef as on event for layerAnimation", () => {
                olConnectors.resetStartDummy(startDummy);
                startDummy.start();
                expect(calledOnPostRender).to.be.an("array").with.lengthOf(2);
                expect(calledOnPostRender[0]).to.equal("layerAnimation");
                expect(calledOnPostRender[1]).to.be.a("function");
                expect(calledOnPostRender[1]).to.equal(CommuterAnimation.moveFeatureRef);
            });
            it("should set startTime to a valid ms number", () => {
                olConnectors.resetStartDummy(startDummy);
                startDummy.start();
                expect(startDummy.startTime).to.be.a("number").and.to.be.above(0);
            });
            it("should call ol map render to start the animation", () => {
                olConnectors.resetStartDummy(startDummy);
                startDummy.start();
                expect(calledRender).to.be.true;
            });
        });
        describe("stop", () => {
            it("should set startTime as null", () => {
                olConnectors.resetStartDummy(startDummy);
                startDummy.start();
                startDummy.stop();
                expect(startDummy.startTime).to.be.null;
            });
            it("should not call un with moveFeatureRef for layerAnimation if moveFeatureRef is not a function", () => {
                olConnectors.resetStartDummy(startDummy);
                startDummy.stop();
                expect(calledUnPostRender).to.be.false;
            });
            it("should call un with moveFeatureRef for layerAnimation if moveFeatureRef is a function", () => {
                olConnectors.resetStartDummy(startDummy);
                CommuterAnimation.moveFeatureRef = () => {
                    return "moveFeatureRef";
                };
                startDummy.stop();
                expect(calledUnPostRender).to.be.an("array").with.lengthOf(2);
                expect(calledUnPostRender[0]).to.equal("layerAnimation");
                expect(calledUnPostRender[1]).to.be.a("function");
                expect(calledUnPostRender[1]()).to.equal("moveFeatureRef");
            });
            it("should set moveFeatureRef to null if moveFeatureRef is a function", () => {
                olConnectors.resetStartDummy(startDummy);
                CommuterAnimation.moveFeatureRef = () => {
                    return "moveFeatureRef";
                };
                startDummy.stop();
                expect(CommuterAnimation.moveFeatureRef).to.be.null;
            });
            it("should hide the animation layer", () => {
                olConnectors.resetStartDummy(startDummy);
                startDummy.stop();
                expect(calledHideLayer).to.equal("layerAnimation");
            });
            it("should show the bubbles layer", () => {
                olConnectors.resetStartDummy(startDummy);
                startDummy.stop();
                expect(calledShowLayer).to.equal("layerBubbles");
            });
        });
    });
});
