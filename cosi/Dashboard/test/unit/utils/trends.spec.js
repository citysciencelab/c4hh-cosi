import {
    getTrend,
    getTrendStyle
} from "../../../utils/trends.js";
import {expect} from "chai/index";

describe("Dashboard/utils/trends", () => {
    const stats = {
            "kategorie": "Bevölkerung insgesamt",
            "group": "Bevölkerung",
            "stat_gebiet": "39008",
            "stadtteil": "Lokstedt",
            "jahr_2013": "2982",
            "jahr_2014": "3008",
            "jahr_2015": "3067",
            "jahr_2016": "3132",
            "jahr_2017": "3123",
            "jahr_2018": "3101",
            "jahr_2019": "3060",
            "jahr_2020": "3205"
        },
        timestamps = [
            2020,
            2019,
            2018,
            2017,
            2016,
            2015,
            2014,
            2013
        ],
        currentTimestamp = 2020,
        timestampPrefix = "jahr_";

    describe("getTrend", () => {
        it("should return trend value", () => {
            expect(getTrend(stats, timestamps, currentTimestamp, timestampPrefix)).to.be.equal(1.0649464422558221);
        });
    });

    describe("getTrendStyle", () => {
        it("should return {display: 'none'}", () => {
            expect(getTrendStyle()).to.be.deep.equal({display: "none"});
        });

        it("should return the corresponding value if no trend colors are configured", () => {
            expect(getTrendStyle(1.056)).to.be.deep.equal({color: "green", transform: "rotate(-60deg)"});
            expect(getTrendStyle(1.055)).to.be.deep.equal({color: "green", transform: "rotate(-50deg)"});
            expect(getTrendStyle(1.045)).to.be.deep.equal({color: "green", transform: "rotate(-40deg)"});
            expect(getTrendStyle(1.035)).to.be.deep.equal({color: "green", transform: "rotate(-30deg)"});
            expect(getTrendStyle(1.025)).to.be.deep.equal({color: "green", transform: "rotate(-20deg)"});
            expect(getTrendStyle(1.015)).to.be.deep.equal({color: "green", transform: "rotate(-10deg)"});
            expect(getTrendStyle(1.005)).to.be.deep.equal({color: "lightgrey"});
            expect(getTrendStyle(0.994)).to.be.deep.equal({color: "crimson", transform: "rotate(10deg)"});
            expect(getTrendStyle(0.984)).to.be.deep.equal({color: "crimson", transform: "rotate(20deg)"});
            expect(getTrendStyle(0.974)).to.be.deep.equal({color: "crimson", transform: "rotate(30deg)"});
            expect(getTrendStyle(0.964)).to.be.deep.equal({color: "crimson", transform: "rotate(40deg)"});
            expect(getTrendStyle(0.954)).to.be.deep.equal({color: "crimson", transform: "rotate(50deg)"});
            expect(getTrendStyle(0.944)).to.be.deep.equal({color: "crimson", transform: "rotate(60deg)"});
        });

        it("should return the corresponding value if the trend colors are in string format", () => {
            expect(getTrendStyle(1.056, "gray")).to.be.deep.equal({color: "gray", transform: "rotate(-60deg)"});
            expect(getTrendStyle(1.055, "gray")).to.be.deep.equal({color: "gray", transform: "rotate(-50deg)"});
            expect(getTrendStyle(1.045, "gray")).to.be.deep.equal({color: "gray", transform: "rotate(-40deg)"});
            expect(getTrendStyle(1.035, "gray")).to.be.deep.equal({color: "gray", transform: "rotate(-30deg)"});
            expect(getTrendStyle(1.025, "gray")).to.be.deep.equal({color: "gray", transform: "rotate(-20deg)"});
            expect(getTrendStyle(1.015, "gray")).to.be.deep.equal({color: "gray", transform: "rotate(-10deg)"});
            expect(getTrendStyle(1.005, "gray")).to.be.deep.equal({color: "gray"});
            expect(getTrendStyle(0.994, "gray")).to.be.deep.equal({color: "gray", transform: "rotate(10deg)"});
            expect(getTrendStyle(0.984, "gray")).to.be.deep.equal({color: "gray", transform: "rotate(20deg)"});
            expect(getTrendStyle(0.974, "gray")).to.be.deep.equal({color: "gray", transform: "rotate(30deg)"});
            expect(getTrendStyle(0.964, "gray")).to.be.deep.equal({color: "gray", transform: "rotate(40deg)"});
            expect(getTrendStyle(0.954, "gray")).to.be.deep.equal({color: "gray", transform: "rotate(50deg)"});
            expect(getTrendStyle(0.944, "gray")).to.be.deep.equal({color: "gray", transform: "rotate(60deg)"});
        });

        it("should return the corresponding value if the trend colors are array with 3 color elements", () => {
            expect(getTrendStyle(1.056, ["green", "gray", "crimson"])).to.be.deep.equal({color: "green", transform: "rotate(-60deg)"});
            expect(getTrendStyle(1.055, ["green", "gray", "crimson"])).to.be.deep.equal({color: "green", transform: "rotate(-50deg)"});
            expect(getTrendStyle(1.045, ["green", "gray", "crimson"])).to.be.deep.equal({color: "green", transform: "rotate(-40deg)"});
            expect(getTrendStyle(1.035, ["green", "gray", "crimson"])).to.be.deep.equal({color: "green", transform: "rotate(-30deg)"});
            expect(getTrendStyle(1.025, ["green", "gray", "crimson"])).to.be.deep.equal({color: "green", transform: "rotate(-20deg)"});
            expect(getTrendStyle(1.015, ["green", "gray", "crimson"])).to.be.deep.equal({color: "green", transform: "rotate(-10deg)"});
            expect(getTrendStyle(1.005, ["green", "gray", "crimson"])).to.be.deep.equal({color: "gray"});
            expect(getTrendStyle(0.994, ["green", "gray", "crimson"])).to.be.deep.equal({color: "crimson", transform: "rotate(10deg)"});
            expect(getTrendStyle(0.984, ["green", "gray", "crimson"])).to.be.deep.equal({color: "crimson", transform: "rotate(20deg)"});
            expect(getTrendStyle(0.974, ["green", "gray", "crimson"])).to.be.deep.equal({color: "crimson", transform: "rotate(30deg)"});
            expect(getTrendStyle(0.964, ["green", "gray", "crimson"])).to.be.deep.equal({color: "crimson", transform: "rotate(40deg)"});
            expect(getTrendStyle(0.954, ["green", "gray", "crimson"])).to.be.deep.equal({color: "crimson", transform: "rotate(50deg)"});
            expect(getTrendStyle(0.944, ["green", "gray", "crimson"])).to.be.deep.equal({color: "crimson", transform: "rotate(60deg)"});
        });
    });
});
