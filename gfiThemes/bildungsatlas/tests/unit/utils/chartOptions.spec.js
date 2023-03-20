import {expect} from "chai";
import {isChartOptions, getChartOptions, getChartOptionsForPercentage} from "../../../utils/chartOptions.js";

describe("addons/gfiThemes/bildungsatlas/utils/chartOptions.js", () => {
    describe("isChartOptions", () => {
        it("should return false if anything but a string is given as propertyName", () => {
            expect(isChartOptions(undefined)).to.be.false;
            expect(isChartOptions(null)).to.be.false;
            expect(isChartOptions(1234)).to.be.false;
            expect(isChartOptions(true)).to.be.false;
            expect(isChartOptions(false)).to.be.false;
            expect(isChartOptions([])).to.be.false;
            expect(isChartOptions({})).to.be.false;
        });
        it("should return false if anything but chartOptions are given", () => {
            expect(isChartOptions("propertyName", undefined)).to.be.false;
            expect(isChartOptions("propertyName", null)).to.be.false;
            expect(isChartOptions("propertyName", 1234)).to.be.false;
            expect(isChartOptions("propertyName", true)).to.be.false;
            expect(isChartOptions("propertyName", false)).to.be.false;
            expect(isChartOptions("propertyName", [])).to.be.false;
            expect(isChartOptions("propertyName", {})).to.be.false;
        });
        it("should return false if the given chartOptions is an object but does not contain propertyName", () => {
            const chartOptions = {
                notPropertyName: {}
            };

            expect(isChartOptions("propertyName", chartOptions)).to.be.false;
        });
        it("should return true if chartOptions as expected are given", () => {
            const chartOptions = {
                propertyName: {}
            };

            expect(isChartOptions("propertyName", chartOptions)).to.be.true;
        });
    });

    describe("getChartOptions", () => {
        it("should return ChartJS options specified with this test", () => {
            const expected = {
                    scales: {
                        yAxes: [{
                            ticks: {
                                optionA: 1,
                                optionB: 2
                            }
                        }]
                    }
                },
                chartOptions = {
                    propertyName: {
                        optionA: 1,
                        optionB: 2
                    }
                };

            expect(getChartOptions("propertyName", chartOptions)).to.deep.equal(expected);
        });
    });

    describe("getChartOptionsForPercentage", () => {
        it("should use default values for ChartJS options", () => {
            const expected = {
                scales: {
                    yAxes: [{
                        ticks: {
                            suggestedMin: 0,
                            suggestedMax: 100,
                            stepSize: 20
                        }
                    }]
                }
            };

            expect(getChartOptionsForPercentage()).to.deep.equal(expected);
        });
        it("should return ChartJS options with specific parameters", () => {
            const expected = {
                    scales: {
                        yAxes: [{
                            ticks: {
                                suggestedMin: 1,
                                suggestedMax: 2,
                                stepSize: 3
                            }
                        }]
                    }
                },
                chartOptions = {
                    propertyName: {
                        suggestedMin: 1,
                        suggestedMax: 2,
                        stepSize: 3
                    }
                };

            expect(getChartOptionsForPercentage("propertyName", chartOptions)).to.deep.equal(expected);
        });
    });
});
