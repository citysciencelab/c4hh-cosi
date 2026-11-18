import {expect} from "chai";
import mutations from "@modules/statisticDashboard/store/mutationsStatisticDashboard.js";

describe("src/modules/statisticDashboard/store/mutationsStatisticDashboard.js", () => {
    describe("updateSelectedCategories", () => {
        it("should update selected categories and retain statistics in those categories", () => {
            const state = {
                data: [{
                    levelName: "Counties",
                    mappingFilter: {
                        statisticsAttributes: {
                            populationTotal: {category: "Population"},
                            employmentTotal: {category: "Employment"}
                        }
                    }
                }],
                selectedLevelName: "Counties",
                selectedCategories: ["Population", "Employment"],
                selectedStatisticsKeys: ["populationTotal", "employmentTotal"],
                selectedSpecificsTags: {}
            };

            mutations.updateSelectedCategories(state, ["Population"]);

            expect(state.selectedCategories).to.deep.equal(["Population"]);
            expect(state.selectedStatisticsKeys).to.deep.equal(["populationTotal"]);
        });

        it("should leave state unchanged when no level is selected", () => {
            const state = {
                data: [],
                selectedLevelName: "Missing level",
                selectedCategories: ["Population"],
                selectedStatisticsKeys: ["populationTotal"]
            };

            mutations.updateSelectedCategories(state, ["Employment"]);

            expect(state.selectedCategories).to.deep.equal(["Population"]);
            expect(state.selectedStatisticsKeys).to.deep.equal(["populationTotal"]);
        });

        it("should keep specific statistics of kept aggregated statistics if showAggregatedView is enabled", () => {
            const state = {
                data: [{
                    levelName: "Counties",
                    mappingFilter: {
                        statisticsAttributes: {
                            popTotal: {category: "Population", specifics: {gender: ["jobsF"]}},
                            jobsTotal: {category: "Employment", specifics: {gender: ["jobsF"]}},
                            jobsF: {category: "Employment"}
                        }
                    }
                }],
                showAggregatedView: true,
                selectedLevelName: "Counties",
                selectedCategories: ["Population", "Employment"],
                selectedStatisticsKeys: ["popTotal", "jobsTotal", "jobsF"],
                selectedSpecificsTags: {popTotal: ["gender"], jobsTotal: ["gender"]}
            };

            mutations.updateSelectedCategories(state, ["Population"]);

            expect(state.selectedStatisticsKeys).to.deep.equal(["popTotal", "jobsF"]);
            expect(state.selectedSpecificsTags).to.deep.equal({popTotal: ["gender"]});
        });

        it("should remove specific statistics and tags of removed aggregated statistics if showAggregatedView is enabled", () => {
            const state = {
                data: [{
                    levelName: "Counties",
                    mappingFilter: {
                        statisticsAttributes: {
                            popTotal: {category: "Population"},
                            jobsTotal: {category: "Employment", specifics: {gender: ["jobsF"]}},
                            jobsF: {category: "Employment"}
                        }
                    }
                }],
                showAggregatedView: true,
                selectedLevelName: "Counties",
                selectedCategories: ["Population", "Employment"],
                selectedStatisticsKeys: ["popTotal", "jobsTotal", "jobsF"],
                selectedSpecificsTags: {jobsTotal: ["gender"]}
            };

            mutations.updateSelectedCategories(state, ["Population"]);

            expect(state.selectedStatisticsKeys).to.deep.equal(["popTotal"]);
            expect(state.selectedSpecificsTags).to.deep.equal({});
        });
    });

    describe("specifics", () => {
        let state;

        beforeEach(() => {
            state = {
                data: [{
                    levelName: "Counties",
                    mappingFilter: {
                        statisticsAttributes: {
                            popTotal: {name: "Population", category: "Pop", specifics: {gender: ["popM", "popF"], age: ["popYoung", "popF"]}},
                            popM: {name: "Male", category: "Pop"},
                            popF: {name: "Female", category: "Pop"},
                            popYoung: {name: "Young", category: "Pop"},
                            jobsTotal: {name: "Jobs", category: "Work"}
                        }
                    }
                }],
                showAggregatedView: true,
                selectedLevelName: "Counties",
                selectedStatisticsKeys: ["popTotal"],
                selectedSpecificsTags: {}
            };
        });

        describe("setSelectedAggregatedStatisticsKeys", () => {
            it("should set the aggregated statistics, keep covered specific statistics and append new keys", () => {
                state.selectedStatisticsKeys = ["popTotal", "popM"];
                state.selectedSpecificsTags = {popTotal: ["gender"]};

                mutations.setSelectedAggregatedStatisticsKeys(state, ["jobsTotal", "popTotal"]);

                expect(state.selectedStatisticsKeys).to.deep.equal(["popTotal", "popM", "jobsTotal"]);
                expect(state.selectedSpecificsTags).to.deep.equal({popTotal: ["gender"]});
            });

            it("should remove specific statistics and tags of deselected aggregated statistics", () => {
                state.selectedStatisticsKeys = ["popTotal", "popM"];
                state.selectedSpecificsTags = {popTotal: ["gender"]};

                mutations.setSelectedAggregatedStatisticsKeys(state, ["jobsTotal"]);

                expect(state.selectedStatisticsKeys).to.deep.equal(["jobsTotal"]);
                expect(state.selectedSpecificsTags).to.deep.equal({});
            });
        });

        describe("toggleSpecificsTag", () => {
            it("should activate the tag and add all its specific statistics", () => {
                mutations.toggleSpecificsTag(state, {statisticKey: "popTotal", tag: "gender"});

                expect(state.selectedSpecificsTags).to.deep.equal({popTotal: ["gender"]});
                expect(state.selectedStatisticsKeys).to.deep.equal(["popTotal", "popM", "popF"]);
            });

            it("should deactivate the tag and keep specifics covered by another active tag", () => {
                mutations.toggleSpecificsTag(state, {statisticKey: "popTotal", tag: "gender"});
                mutations.toggleSpecificsTag(state, {statisticKey: "popTotal", tag: "age"});
                mutations.toggleSpecificsTag(state, {statisticKey: "popTotal", tag: "gender"});

                expect(state.selectedSpecificsTags).to.deep.equal({popTotal: ["age"]});
                expect(state.selectedStatisticsKeys).to.deep.equal(["popTotal", "popF", "popYoung"]);
            });

            it("should remove the entry when the last tag is deactivated", () => {
                mutations.toggleSpecificsTag(state, {statisticKey: "popTotal", tag: "gender"});
                mutations.toggleSpecificsTag(state, {statisticKey: "popTotal", tag: "gender"});

                expect(state.selectedSpecificsTags).to.deep.equal({});
                expect(state.selectedStatisticsKeys).to.deep.equal(["popTotal"]);
            });
        });

        describe("removeSpecificStatistic", () => {
            it("should remove the specific statistic and keep the tag active", () => {
                mutations.toggleSpecificsTag(state, {statisticKey: "popTotal", tag: "gender"});
                mutations.removeSpecificStatistic(state, "popM");

                expect(state.selectedStatisticsKeys).to.deep.equal(["popTotal", "popF"]);
                expect(state.selectedSpecificsTags).to.deep.equal({popTotal: ["gender"]});
            });

            it("should not change the state for a key that is not selected", () => {
                mutations.removeSpecificStatistic(state, "popYoung");

                expect(state.selectedStatisticsKeys).to.deep.equal(["popTotal"]);
            });
        });
    });
});
