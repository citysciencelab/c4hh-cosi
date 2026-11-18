import {expect} from "chai";
import StatisticHandler from "@modules/statisticDashboard/js/handleStatistics.js";

describe("src/modules/statisticDashboard/utils/handleStatistics.js", () => {
    beforeAll(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });

    describe("getStatisticsByCategory", () => {
        it("should return all statistics of this given category. ", () => {
            const statisticsAttributes = {
                "statOne": {
                    "category": "CategoryOne",
                    "categoryGroup": "group"
                },
                "statTwo": {
                    "category": "Bruttoinlandsprodukt"
                }
            };

            expect(StatisticHandler.getStatisticsByCategory("CategoryOne", statisticsAttributes)).to.deep.equal({statOne: statisticsAttributes.statOne});
        });

        it("should return an empty object if there are no statistics in the given category ", () => {
            const statisticsAttributes = {
                "statOne": {
                    "category": "CategoryOne",
                    "categoryGroup": "group"
                },
                "statTwo": {
                    "category": "Bruttoinlandsprodukt"
                }
            };

            expect(StatisticHandler.getStatisticsByCategory("CategoryTwo", statisticsAttributes)).to.be.an("object").that.is.empty;
        });
    });

    describe("getUngroupedCategories", () => {
        it("should return all categories ungrouped", () => {
            const statisticsAttributes = {
                "statOne": {
                    "category": "CategoryOne"
                },
                "statTwo": {
                    "category": "CategoryTwo"
                },
                "statThree": {
                    "category": "CategoryTwo"
                }
            };

            expect(StatisticHandler.getUngroupedCategories(statisticsAttributes)).to.deep.equal([
                {name: "CategoryOne"},
                {name: "CategoryTwo"}
            ]);
        });
    });

    describe("getCategoriesFromStatisticAttributes", () => {
        it("should return the categories ungrouped", () => {
            const statisticsAttributes = {
                "statOne": {
                    "category": "CategoryOne",
                    "categoryGroup": "GroupOne"
                },
                "statTwo": {
                    "category": "CategoryTwo",
                    "categoryGroup": "GroupOne"
                },
                "statThree": {
                    "category": "CategoryThree",
                    "categoryGroup": "GroupTwo"
                },
                "statFour": {
                    "category": "CategoryAdditional"
                }
            };

            expect(StatisticHandler.getCategoriesFromStatisticAttributes(statisticsAttributes, false)).to.deep.equal([
                {name: "CategoryOne"},
                {name: "CategoryTwo"},
                {name: "CategoryThree"},
                {name: "CategoryAdditional"}
            ]);
        });

        it("should return an empty array if the given value is not an object", () => {
            expect(StatisticHandler.getCategoriesFromStatisticAttributes(undefined)).to.be.an("array").that.is.empty;
            expect(StatisticHandler.getCategoriesFromStatisticAttributes([])).to.be.an("array").that.is.empty;
            expect(StatisticHandler.getCategoriesFromStatisticAttributes(null)).to.be.an("array").that.is.empty;
            expect(StatisticHandler.getCategoriesFromStatisticAttributes("1234")).to.be.an("array").that.is.empty;
            expect(StatisticHandler.getCategoriesFromStatisticAttributes(1234)).to.be.an("array").that.is.empty;
            expect(StatisticHandler.getCategoriesFromStatisticAttributes(true)).to.be.an("array").that.is.empty;
            expect(StatisticHandler.getCategoriesFromStatisticAttributes(false)).to.be.an("array").that.is.empty;
        });
    });

    describe("getStatsKeysByName", () => {
        it("should return two keys of the given statistic attributes", () => {
            const statisticsAttributes = [{
                "statOne": {
                    "category": "CategoryOne",
                    "categoryGroup": "group",
                    "name": "Edgar"
                }
            },
            {
                "statTwo": {
                    "category": "Bruttoinlandsprodukt",
                    "name": "Allan"
                }
            }];

            expect(StatisticHandler.getStatsKeysByName(statisticsAttributes, ["Edgar", "Allan"])).to.deep.equal(["statOne", "statTwo"]);
        });

        it("should return one key of the given statistic attributes", () => {
            const statisticsAttributes = [{
                "statOne": {
                    "category": "CategoryOne",
                    "categoryGroup": "group",
                    "name": "Edgar"
                }
            },
            {
                "statTwo": {
                    "category": "Bruttoinlandsprodukt",
                    "name": "Poe"
                }
            }];

            expect(StatisticHandler.getStatsKeysByName(statisticsAttributes, ["Edgar", "Allan"])).to.deep.equal(["statOne"]);
        });

        it("should return an empty array if no keys are found", () => {
            const statisticsAttributes = [{
                "statOne": {
                    "category": "CategoryOne",
                    "categoryGroup": "group",
                    "name": "Edgar"
                }
            },
            {
                "statTwo": {
                    "category": "Bruttoinlandsprodukt",
                    "name": "Allan"
                }
            }];

            expect(StatisticHandler.getStatsKeysByName(statisticsAttributes, ["Poe"])).to.be.an("array").that.is.empty;
        });
    });
});
