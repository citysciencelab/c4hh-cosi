import {expect} from "chai";
import getStyleFunctionFromDisplayOptions from "../../../js/getStyleFunctionFromDisplayOptions.js";

describe("addons/simulationTool/js/getStyleFunctionFromDisplayOptions.js", () => {

    describe("getStyleFunctionFromDisplayOptions", () => {
        it("positive: returns a style function that maps feature values to the configured style", () => {
            const displayOptions = {
                    type: "dynamic-binary",
                    properties: ["temperature", "windSpeed"],
                    classificationBreakOutputs: {
                        temperature: "temperatureBreaks",
                        windSpeed: "windBreaks"
                    },
                    colors: [
                        ["#010101", "#020202", "#030303"],
                        ["#111111", "#121212", "#131313"],
                        ["#212121", "#222222", "#232323"]
                    ],
                    strokeColor: "#ff0000",
                    strokeWidth: 3
                },
                jobResults = {
                    temperatureBreaks: {
                        value: [10, 20]
                    },
                    windBreaks: {
                        value: [5, 15]
                    }
                },
                styleFunction = getStyleFunctionFromDisplayOptions(displayOptions, jobResults),
                feature = {
                    get: (propertyName) => {
                        if (propertyName === "temperature") {
                            return 17;
                        }
                        if (propertyName === "windSpeed") {
                            return 16;
                        }
                        return undefined;
                    }
                };

            const style = styleFunction(feature);

            expect(style).to.exist;
            expect(style.getFill().getColor()).to.equal("#131313");
            expect(style.getStroke().getColor()).to.equal("#ff0000");
            expect(style.getStroke().getWidth()).to.equal(3);
        });

        it("positive: reuses cached style instances for equal classification indices", () => {
            const displayOptions = {
                    type: "dynamic-binary",
                    properties: ["x", "y"],
                    classificationBreakOutputs: {
                        x: "xBreaks",
                        y: "yBreaks"
                    },
                    colors: [
                        ["#aaaaaa", "#bbbbbb"],
                        ["#cccccc", "#dddddd"]
                    ],
                    strokeColor: "#000000",
                    strokeWidth: 1
                },
                jobResults = {
                    xBreaks: {
                        value: [100]
                    },
                    yBreaks: {
                        value: [50]
                    }
                },
                styleFunction = getStyleFunctionFromDisplayOptions(displayOptions, jobResults),
                firstFeature = {
                    get: (propertyName) => propertyName === "x" ? 120 : 10
                },
                secondFeature = {
                    get: (propertyName) => propertyName === "x" ? 130 : 30
                };

            const firstStyle = styleFunction(firstFeature),
                secondStyle = styleFunction(secondFeature);

            expect(firstStyle).to.equal(secondStyle);
        });

        it("negative: returns undefined for unsupported display option types", () => {
            const styleFunction = getStyleFunctionFromDisplayOptions({
                type: "static",
                properties: ["x", "y"],
                classificationBreakOutputs: {
                    x: "xBreaks",
                    y: "yBreaks"
                },
                colors: [["#000000"]],
                strokeColor: "#ffffff",
                strokeWidth: 1
            }, {});

            expect(styleFunction).to.be.undefined;
        });

        it("negative: returns undefined when classification breaks cannot be read from outputs", () => {
            const displayOptions = {
                    type: "dynamic-binary",
                    properties: ["x", "y"],
                    classificationBreakOutputs: {
                        x: "xBreaks",
                        y: "yBreaks"
                    },
                    colors: [["#000000"]],
                    strokeColor: "#ffffff",
                    strokeWidth: 1
                },
                styleFunction = getStyleFunctionFromDisplayOptions(displayOptions, {
                    xBreaks: {
                        value: [1, 2]
                    },
                    yBreaks: {
                        value: "not-an-array"
                    }
                });

            expect(styleFunction).to.be.undefined;
        });

        it("negative: returns undefined for features without numeric values", () => {
            const displayOptions = {
                    type: "dynamic-binary",
                    properties: ["x", "y"],
                    classificationBreakOutputs: {
                        x: "xBreaks",
                        y: "yBreaks"
                    },
                    colors: [["#000000", "#111111"], ["#222222", "#333333"]],
                    strokeColor: "#ffffff",
                    strokeWidth: 1
                },
                jobResults = {
                    xBreaks: {
                        value: [1]
                    },
                    yBreaks: {
                        value: [1]
                    }
                },
                styleFunction = getStyleFunctionFromDisplayOptions(displayOptions, jobResults),
                feature = {
                    get: () => "not-a-number"
                };

            expect(styleFunction(feature)).to.be.undefined;
        });
    });
});
