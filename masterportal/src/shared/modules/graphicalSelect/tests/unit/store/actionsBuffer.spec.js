import {expect} from "chai";
import sinon from "sinon";
import {actionsBuffer} from "@shared/modules/graphicalSelect/store/actionsBuffer.js";
import LineString from "ol/geom/LineString.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

describe("src/shared/modules/graphicalSelect/store/actionsBuffer.js", () => {
    let commit, layer;

    beforeEach(() => {
        commit = sinon.spy();
        layer = new VectorLayer({
            id: "geometry_selection_layer",
            source: new VectorSource()
        });
    });


    describe("createBufferFromLine", () => {
        it("should create a buffer polygon from a line geometry", () => {
            const geometry = new LineString([[0, 0], [100, 0]]),
                bufferDistance = 50;

            let features = null;

            actionsBuffer.createBufferFromLine(
                {commit},
                {geometry, layer, bufferDistance, triggerEvent: true}
            );
            features = layer.getSource().getFeatures();

            expect(features.length).to.equal(2); // Line + Buffer polygon
            expect(features[0].getGeometry().getType()).to.equal("LineString");
            expect(features[1].getGeometry().getType()).to.equal("Polygon");
        });

        it("should commit setSelectedAreaGeoJson with the polygon feature", () => {
            const geometry = new LineString([[0, 0], [100, 0]]),
                bufferDistance = 50;

            actionsBuffer.createBufferFromLine(
                {commit},
                {geometry, layer, bufferDistance, triggerEvent: true}
            );

            expect(commit.calledTwice).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setSelectedAreaGeoJson");
            expect(commit.secondCall.args[1]).to.have.property("type", "Polygon");
        });

        it("should commit setDrawEndData when triggerEvent is true", () => {
            const geometry = new LineString([[0, 0], [100, 0]]),
                bufferDistance = 50;

            actionsBuffer.createBufferFromLine(
                {commit},
                {geometry, layer, bufferDistance, triggerEvent: true}
            );

            expect(commit.calledTwice).to.be.true;
            expect(commit.secondCall.args[0]).to.equal("setDrawEndData");
            expect(commit.secondCall.args[1]).to.have.property("type", "Polygon");
            expect(commit.secondCall.args[1]).to.have.property("coordinates").that.is.an("array");
        });

        it("should not commit setDrawEndData when triggerEvent is false", () => {
            const geometry = new LineString([[0, 0], [100, 0]]),
                bufferDistance = 50;

            actionsBuffer.createBufferFromLine(
                {commit},
                {geometry, layer, bufferDistance, triggerEvent: false}
            );

            expect(commit.called).to.be.false;
        });
    });
});
