import {expect} from "chai";
import Polygon from "ol/geom/Polygon";
import sinon from "sinon";
import {bufferGeometry} from "../../../utils/bufferGeometry.js";

describe("addons/valuationPrint/utils/bufferGeometrie.js", () => {
    const polygon = new Polygon([[
        [9.98119979890, 53.56442623621],
        [9.98122568840, 53.56442208667],
        [9.98122554601, 53.56441006061],
        [9.98122340666, 53.56423282482],
        [9.98115025920, 53.56423314619],
        [9.98094236695, 53.56423407822],
        [9.98094294449, 53.56428187678],
        [9.98094468602, 53.56442369932],
        [9.98094482989, 53.56443448490],
        [9.98094522039, 53.56446702174],
        [9.98119979890, 53.56442623621]]]);

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    it("should return a different geometry", () => {
        const bufferedPolygon = bufferGeometry(polygon, 200, "EPSG:4326");

        expect(bufferedPolygon.getCoordinates()).to.not.equal(polygon.getCoordinates());
    });

    it("should return a bigger geometry", () => {
        const bufferedPolygon = bufferGeometry(polygon, 500, "EPSG:4326");

        expect(bufferedPolygon.getArea() > polygon.getArea()).to.be.true;
    });

    it("should return the passed geometry if radius is 0", () => {
        const bufferedPolygon = bufferGeometry(polygon, 0, "EPSG:4326");

        expect(bufferedPolygon.getExtent()).to.equal(polygon.getExtent());
    });

    it("should throw an error if a wrong geometry type is passed", () => {
        bufferGeometry({});
        bufferGeometry(null);
        bufferGeometry(undefined);
        bufferGeometry(123);
        bufferGeometry("123");
        bufferGeometry(true);

        expect(console.error.callCount).to.be.equal(6);
    });

    it("should throw an error if a wrong radius type is passed", () => {
        bufferGeometry(polygon, {});
        bufferGeometry(polygon, null);
        bufferGeometry(polygon, undefined);
        bufferGeometry(polygon, "123");
        bufferGeometry(polygon, true);

        expect(console.error.callCount).to.be.equal(5);
    });
});
