import {expect} from "chai";
import sinon from "sinon";
import warnMissingSpecifics from "@modules/statisticDashboard/js/warnMissingSpecifics.js";

describe("src/modules/statisticDashboard/js/warnMissingSpecifics.js", () => {
    let level;

    beforeEach(() => {
        level = {
            levelName: "Counties",
            mappingFilter: {
                statisticsAttributes: {
                    popTotal: {name: "Population", specifics: {gender: ["popM"], age: ["popYoung"]}},
                    popM: {name: "Male"},
                    popYoung: {name: "Young"},
                    jobsTotal: {name: "Jobs", specifics: {gender: ["jobsF"]}},
                    jobsF: {name: "Female jobs"}
                }
            }
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should warn once per missing key", () => {
        const warn = sinon.stub(console, "warn");

        level.mappingFilter.statisticsAttributes.popTotal.specifics.age.push("popOld");
        level.mappingFilter.statisticsAttributes.jobsTotal.specifics.gender.push("jobsM");
        warnMissingSpecifics([level]);

        expect(warn.callCount).to.equal(2);
        expect(warn.firstCall.args[0]).to.equal("Statistic dashboard: specific statistic \"popOld\" (tag \"age\" of \"popTotal\", level \"Counties\") is not defined in statisticsAttributes and will be ignored.");
        expect(warn.secondCall.args[0]).to.contain("\"jobsM\"");
    });

    it("should not warn if all referenced keys are defined", () => {
        const warn = sinon.stub(console, "warn");

        warnMissingSpecifics([level, {levelName: "Empty", mappingFilter: {statisticsAttributes: {}}}]);

        expect(warn.called).to.be.false;
    });
});
