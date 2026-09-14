import {expect} from "chai";
import getWebglVariables from "../../../js/getWebglVariables.js";

describe("addons/simulationTool/js/getWebglVariables.js", () => {

    describe("getWebglVariables", () => {
        it("positive: maps array outputs to indexed webgl variables", () => {
            const result = getWebglVariables({
                stress: [10, 20],
                speed: [3]
            });

            expect(result).to.deep.equal({
                stress_0: 10,
                stress_1: 20,
                speed_0: 3
            });
        });
    });
});
