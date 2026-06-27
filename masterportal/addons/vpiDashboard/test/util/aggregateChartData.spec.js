import {expect} from "chai";
import aggregateChartData from "../../utils/aggregateChartData.js";

/**
 * Run only these tests via command:
 * npm run test:watch -- --grep="addons/vpiDashboard/test/ aggregateChartData"
 */
describe("addons/vpiDashboard/utils/ aggregateChartData", () => {
    it("aggregates and rounds visitor data correctly", () => {
        const featureData = [
                {properties: {datum: "2023-01-01", besucher: 183}},
                {properties: {datum: "2023-01-01", besucher: 217}},
                {properties: {datum: "2023-01-02", besucher: 150}},
                {properties: {datum: "2023-01-02", besucher: 50}},
                {properties: {datum: "2023-01-03", besucher: 99}},
                {properties: {datum: "2023-02-01", besucher: 297}},
                {properties: {datum: "2023-02-01", besucher: 123}},
                {properties: {datum: "2023-02-02", besucher: 42}},
                {properties: {datum: "2023-02-02", besucher: 321}},
                {properties: {datum: "2023-02-03", besucher: 15}}
            ],
            result = aggregateChartData(featureData);

        expect(result).to.have.property("01-2023");
        expect(result["01-2023"]).to.equal(700);

        expect(result).to.have.property("02-2023");
        expect(result["02-2023"]).to.equal(800);
    });
});
