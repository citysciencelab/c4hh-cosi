import {expect} from "chai";
import getOutputObjectForVariables from "../../../js/getOutputObjectForVariables.js";

describe("addons/simulationTool/js/getOutputObjectForVariables.js", () => {

    describe("getOutputObjectForVariables", () => {
        it("positive: groups spread output variables by output key", () => {
            const jobs = {
                    jobA: {
                        jobStatus: {
                            processID: "process-1"
                        },
                        jobResults: {
                            stress: {
                                value: 42
                            },
                            speed: 7
                        }
                    }
                },
                processes = [
                    {
                        id: "process-1",
                        displaySettings: {
                            chartOutput: {
                                spreadOutputVariables: ["stress", "speed"]
                            }
                        }
                    }
                ];

            const result = getOutputObjectForVariables(jobs, processes);

            expect(result).to.deep.equal({
                chartOutput: {
                    stress: 42,
                    speed: 7
                }
            });
        });
    });
});
