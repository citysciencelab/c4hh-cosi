import {expect} from "chai";
import aggregateData from "../../utils/aggregateData.js";

/**
 * Run only these tests via command:
 * npm run test:watch -- --grep="addons/vpiDashboard/test/ aggregateData"
 */
describe("addons/vpiDashboard/utils/ aggregateData", () => {
    const featureData = [
            {properties: {datum: "2023-01-01", besucher: 100, group: "A"}},
            {properties: {datum: "2023-01-01", besucher: 200, group: "B"}},
            {properties: {datum: "2023-01-02", besucher: 150, group: "A"}},
            {properties: {datum: "2023-02-01", besucher: 300, group: "A"}},
            {properties: {datum: "2024-01-01", besucher: 400, group: "A"}}
        ],
        dateExtractor = date => date.getFullYear(), // eslint-disable-line
        timeUnitExtractor = date => date.getMonth(), // eslint-disable-line
        aggregator = () => ({sum: 0, count: 0}); // eslint-disable-line

    it("aggregates data by year and month without grouping", () => {
        const result = aggregateData(featureData, dateExtractor, timeUnitExtractor, aggregator);

        expect(result).to.have.property("2023");

        expect(result["2023"]).to.have.property("0");
        expect(result["2023"][0].sum).to.equal(450);
        expect(result["2023"][0].count).to.equal(3);

        expect(result["2023"]).to.have.property("1");
        expect(result["2023"][1].sum).to.equal(300);
        expect(result["2023"][1].count).to.equal(1);

        expect(result).to.have.property("2024");

        expect(result["2024"]).to.have.property("0");
        expect(result["2024"][0].sum).to.equal(400);
        expect(result["2024"][0].count).to.equal(1);
    });

    it("aggregates data by year, month, and group", () => {
        const result = aggregateData(featureData, dateExtractor, timeUnitExtractor, aggregator, "group");

        expect(result).to.have.property("2023");

        expect(result["2023"]).to.have.property("0");
        expect(result["2023"]).to.have.property("1");

        expect(result["2023"][0]).to.have.property("A");
        expect(result["2023"][0].A.sum).to.equal(250);
        expect(result["2023"][0].A.count).to.equal(2);

        expect(result["2023"][0]).to.have.property("B");
        expect(result["2023"][0].B.sum).to.equal(200);
        expect(result["2023"][0].B.count).to.equal(1);

        expect(result["2023"][1]).to.have.property("A");
        expect(result["2023"][1].A.sum).to.equal(300);
        expect(result["2023"][1].A.count).to.equal(1);

        expect(result).to.have.property("2024");

        expect(result["2024"]).to.have.property("0");
        expect(result["2024"][0]).to.have.property("A");
        expect(result["2024"][0].A.sum).to.equal(400);
        expect(result["2024"][0].A.count).to.equal(1);
    });

});
