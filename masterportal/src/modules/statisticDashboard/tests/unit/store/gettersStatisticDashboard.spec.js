import {expect} from "chai";
import getters from "@modules/statisticDashboard/store/gettersStatisticDashboard.js";

describe("src/modules/statisticDashboard/store/gettersStatisticDashboard.js", () => {
    describe("selectedLevel", () => {
        it("should return the level matching selectedLevelName", () => {
            const data = [{levelName: "A"}, {levelName: "B"}];

            expect(getters.selectedLevel({data, selectedLevelName: "B"})).to.equal(data[1]);
        });

        it("should return undefined if no level matches", () => {
            expect(getters.selectedLevel({data: [{levelName: "A"}], selectedLevelName: "X"})).to.be.undefined;
        });
    });

    describe("categories", () => {
        it("should return unique categories from the selected level", () => {
            const selectedLevel = {
                mappingFilter: {
                    statisticsAttributes: {
                        populationTotal: {category: "Population"},
                        populationFemale: {category: "Population"},
                        employmentTotal: {category: "Employment"}
                    }
                }
            };

            expect(getters.categories(null, {selectedLevel})).to.deep.equal(["Population", "Employment"]);
        });

        it("should return an empty array if no level is selected", () => {
            expect(getters.categories(null, {selectedLevel: undefined})).to.deep.equal([]);
        });
    });

    describe("selectedStatistics", () => {
        it("should return selected statistics with their keys and selection order", () => {
            const selectedLevel = {
                    mappingFilter: {
                        statisticsAttributes: {
                            populationTotal: {name: "Population", category: "People"},
                            populationFemale: {name: "Female population", category: "People"},
                            employmentTotal: {name: "Employment", category: "Work"}
                        }
                    }
                },
                selectedStatisticsKeys = ["employmentTotal", "populationTotal"];

            expect(getters.selectedStatistics(
                {selectedStatisticsKeys},
                {selectedLevel}
            )).to.deep.equal({
                populationTotal: {
                    name: "Population",
                    category: "People",
                    key: "populationTotal",
                    selectedOrder: 1
                },
                employmentTotal: {
                    name: "Employment",
                    category: "Work",
                    key: "employmentTotal",
                    selectedOrder: 0
                }
            });
        });

        it("should return an empty object if no level is selected", () => {
            expect(getters.selectedStatistics(
                {selectedStatisticsKeys: ["populationTotal"]},
                {selectedLevel: undefined}
            )).to.deep.equal({});
        });
    });

    describe("selectedDatesValues", () => {
        it("should return an empty array if no date are selected", () => {
            const values = getters.selectedDatesValues(null, {selectedDates: []});

            expect(values).to.be.empty;
        });

        it("should return the values of the selected dates", () => {
            const selectedDates = [{value: "2020"}, {value: ["2021", "2022"]}];

            expect(getters.selectedDatesValues(null, {selectedDates})).to.deep.equals(["2020", "2021", "2022"]);
        });

        it("should ignore non-object date entries", () => {
            const selectedDates = [undefined, "2020", {value: ["2021", "2022"]}];

            expect(getters.selectedDatesValues(null, {selectedDates})).to.deep.equals(["2021", "2022"]);
        });
    });

    describe("selectedRegionsValues", () => {
        it("should remove empty array", () => {
            expect(getters.selectedRegionsValues(null, {selectedRegions: 0})).to.deep.equals([]);
            expect(getters.selectedRegionsValues(null, {selectedRegions: null})).to.deep.equals([]);
            expect(getters.selectedRegionsValues(null, {selectedRegions: false})).to.deep.equals([]);
            expect(getters.selectedRegionsValues(null, {selectedRegions: ""})).to.deep.equals([]);
            expect(getters.selectedRegionsValues(null, {selectedRegions: []})).to.deep.equals([]);
            expect(getters.selectedRegionsValues(null, {selectedRegions: {}})).to.deep.equals([]);
        });

        it("should get values of selected regions", () => {
            const selectedRegions = [{
                value: "Schwerin",
                title: "Schwerin"
            },
            {
                value: "Harburg",
                title: "Harburg"
            }];

            expect(getters.selectedRegionsValues(null, {selectedRegions})).to.deep.equals(["Schwerin", "Harburg"]);
        });

        it("should get values of selected regions", () => {
            const selectedRegions = [{
                value: "Schwerin",
                title: "Schwerin"
            },
            {
                value: "Harburg",
                title: "Harburg"
            },
            {
                value: ["Harburg", "Lübeck", "Schwerin"],
                title: "Alle Gebiete"
            }];

            expect(getters.selectedRegionsValues(null, {selectedRegions})).to.deep.equals(["Harburg", "Lübeck", "Schwerin"]);
        });

        it("should get sorted region values from flattened regions when all areas are selected", () => {
            const selectedRegions = [
                    {value: "Z", title: "Zehlendorf"},
                    {value: "A", title: "Altona"}
                ],
                state = {
                    flattenedRegions: [{
                        values: [
                            {value: "Z", title: "Zehlendorf"},
                            {value: "A", title: "Altona"}
                        ]
                    }]
                };

            expect(getters.selectedRegionsValues(state, {selectedRegions})).to.deep.equals(["A", "Z"]);
        });
    });

    describe("specifics", () => {
        const statisticsAttributes = {
                popTotal: {name: "Population", category: "Pop", specifics: {gender: ["popM", "popF"], age: ["popYoung"]}},
                popM: {name: "Male", category: "Pop"},
                popF: {name: "Female", category: "Pop"},
                popYoung: {name: "Young", category: "Pop"},
                jobsTotal: {name: "Jobs", category: "Work"}
            },
            selectedLevel = {levelName: "Counties", mappingFilter: {statisticsAttributes}};

        describe("hasSpecifics", () => {
            it("should return true if a statistic of the selected level has specifics", () => {
                expect(getters.hasSpecifics(null, {selectedLevel})).to.be.true;
            });

            it("should return false if no statistic has specifics or no level is selected", () => {
                expect(getters.hasSpecifics(null, {selectedLevel: {mappingFilter: {statisticsAttributes: {jobsTotal: {name: "Jobs", specifics: {}}}}}})).to.be.false;
                expect(getters.hasSpecifics(null, {selectedLevel: undefined})).to.be.false;
            });
        });

        describe("specificStatisticKeys", () => {
            it("should return the keys referenced as specifics", () => {
                expect(getters.specificStatisticKeys(null, {selectedLevel})).to.deep.equal(["popM", "popF", "popYoung"]);
            });

            it("should return an empty array if no level is selected", () => {
                expect(getters.specificStatisticKeys(null, {selectedLevel: undefined})).to.deep.equal([]);
            });
        });

        describe("aggregatedStatistics", () => {
            it("should return the selected statistics without specific statistics", () => {
                const selectedStatistics = {
                    popTotal: {key: "popTotal", selectedOrder: 0},
                    popM: {key: "popM", selectedOrder: 1},
                    jobsTotal: {key: "jobsTotal", selectedOrder: 2}
                };

                expect(getters.aggregatedStatistics(null, {selectedStatistics, specificStatisticKeys: ["popM"]})).to.deep.equal({
                    popTotal: {key: "popTotal", selectedOrder: 0},
                    jobsTotal: {key: "jobsTotal", selectedOrder: 2}
                });
            });

            it("should return an empty object if no statistics are selected", () => {
                expect(getters.aggregatedStatistics(null, {selectedStatistics: {}, specificStatisticKeys: ["popM"]})).to.deep.equal({});
            });
        });
    });
});
