import {expect} from "chai";
import {getGeometryCenter} from "../../js/getGeometryCenter.js";
import LineString from "ol/geom/LineString.js";
import MultiPolygon from "ol/geom/MultiPolygon.js";
import Polygon from "ol/geom/Polygon.js";

describe("addons/heavyRain/shared/js/getGeometryCenter.js", () => {
    it("should return a point inside of a polygon", () => {
        const polygon = new Polygon([[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]);

        expect(getGeometryCenter(polygon)).to.deep.equal([2, 2]);
    });

    it("should return a point inside of a concave polygon, where the center of the extent lies outside", () => {
        const polygon = new Polygon([[[0, 0], [6, 0], [6, 6], [4, 6], [4, 2], [2, 2], [2, 6], [0, 6], [0, 0]]]),
            center = getGeometryCenter(polygon);

        expect(center).to.have.lengthOf(2);
        expect(polygon.intersectsCoordinate(center)).to.be.true;
    });

    it("should return a point inside of the first polygon of a multi polygon", () => {
        const multiPolygon = new MultiPolygon([[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]], [[[10, 10], [12, 10], [12, 12], [10, 12], [10, 10]]]]);

        expect(getGeometryCenter(multiPolygon)).to.deep.equal([2, 2]);
    });

    it("should return the center of the extent for other geometries", () => {
        expect(getGeometryCenter(new LineString([[0, 0], [4, 2]]))).to.deep.equal([2, 1]);
    });

    it("should return undefined if there is no geometry", () => {
        expect(getGeometryCenter(undefined)).to.be.undefined;
        expect(getGeometryCenter(null)).to.be.undefined;
    });
});
