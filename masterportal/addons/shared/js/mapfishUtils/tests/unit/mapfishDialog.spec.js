import createVectorLayer from "../../createVectorLayer.js";
import {expect} from "chai";
import MapfishDialog from "../../mapfishDialog.js";
import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
import sinon from "sinon";

describe("addons/shared/js/mapfishUtils/mapfishDialog.js", () => {

    it("should create an instance with expected propertys", () => {
        const mapfishDialogInstance = new MapfishDialog({}, {}, "defaultValue", "EPSG:1234", "layoutName", "outputFilename", false);

        expect(mapfishDialogInstance.knowledgeBase).to.deep.equal({});
        expect(mapfishDialogInstance.transformer).to.deep.equal({});
        expect(mapfishDialogInstance.defaultValue).to.be.equal("defaultValue");
        expect(mapfishDialogInstance.mapProjection).to.be.equal("EPSG:1234");
        expect(mapfishDialogInstance.layoutName).to.be.equal("layoutName");
        expect(mapfishDialogInstance.outputFilename).to.be.equal("outputFilename");
        expect(mapfishDialogInstance.sendLegends).to.be.false;
    });

    describe("create", () => {
        it("should return a mapfishdialog with no informations if empty transformer is given", async () => {
            const mapfishDialogInstance = new MapfishDialog({}, {}, "defaultValue", "EPSG:1234", "layoutName", "outputFilename", false),
                expected = {
                    layout: "layoutName",
                    attributes: {},
                    outputFilename: "outputFilename"
                };

            expect(await mapfishDialogInstance.create()).to.deep.equal(expected);
        });
        it("should return a mapfishdialog with only send legends property", async () => {
            const mapfishDialogInstance = new MapfishDialog({}, {}, "defaultValue", "EPSG:1234", "layoutName", "outputFilename", true),
                expected = {
                    layout: "layoutName",
                    attributes: {
                        legend: {layers: []}
                    },
                    outputFilename: "outputFilename"
                };

            expect(await mapfishDialogInstance.create()).to.deep.equal(expected);
        });
    });

    describe("createLegendObject", () => {
        it("returns empty layer array if parameters are missing", () => {
            const mapfishDialogInstance = new MapfishDialog({}, {}, "defaultValue", "EPSG:1234", "layoutName", "outputFilename", true),
                legendObject = mapfishDialogInstance.createLegendObject();

            expect(legendObject.layers).to.be.an("array").that.is.empty;
        });

        it("returns empty layer array if empty set is passed", () => {
            const mapfishDialogInstance = new MapfishDialog({}, {}, "defaultValue", "EPSG:1234", "layoutName", "outputFilename", true),
                legendObject = mapfishDialogInstance.createLegendObject(new Set());

            expect(legendObject.layers).to.be.an("array").that.is.empty;
        });

        it("returns empty layer array if layers do not exist", () => {
            sinon.stub(rawLayerList, "getLayerWhere").returns(undefined);
            const mapfishDialogInstance = new MapfishDialog({}, {}, "defaultValue", "EPSG:1234", "layoutName", "outputFilename", true),
                legendObject = mapfishDialogInstance.createLegendObject(new Set(["id_1", "id_2", "id_3"]));

            expect(legendObject.layers).to.be.an("array").that.is.empty;
        });

        it("returns empty layer array if layer is not WMS", () => {
            sinon.stub(rawLayerList, "getLayerWhere").returns({typ: "WFS"});
            const mapfishDialogInstance = new MapfishDialog({}, {}, "defaultValue", "EPSG:1234", "layoutName", "outputFilename", true),
                legendObject = mapfishDialogInstance.createLegendObject(new Set(["id_1"]));

            expect(legendObject.layers).to.be.an("array").that.is.empty;
        });

        it("returns empty layer array if layer has pdf legend", () => {
            sinon.stub(rawLayerList, "getLayerWhere").returns({typ: "WMS", legendURL: "Legende.pdf"});
            const mapfishDialogInstance = new MapfishDialog({}, {}, "defaultValue", "EPSG:1234", "layoutName", "outputFilename", true),
                legendObject = mapfishDialogInstance.createLegendObject(new Set(["id_1"]));

            expect(legendObject.layers).to.be.an("array").that.is.empty;
        });

        it("returns layer array containing as many elements as valid layer ids are passed", () => {
            sinon.stub(rawLayerList, "getLayerWhere")
                .onFirstCall().returns(undefined)
                .onSecondCall().returns({typ: "WMS"})
                .onThirdCall().returns({typ: "WMS"});
            const mapfishDialogInstance = new MapfishDialog({}, {}, "defaultValue", "EPSG:1234", "layoutName", "outputFilename", true),
                legendObject = mapfishDialogInstance.createLegendObject(new Set(["id_1", "id_2", "id_3"]));

            expect(legendObject.layers).to.have.lengthOf(2);
        });
    });

    describe("getLayersArray", () => {
        it("should return an empty array if no layers array is given", async () => {
            const mapfishDialogInstance = new MapfishDialog({}, {}, "defaultValue", "EPSG:1234", "layoutName", "outputFilename", false);

            expect(await mapfishDialogInstance.getLayersArray()).to.be.an("array").that.is.empty;
        });

        it("should returns with expected array if layers array has no feature", async () => {
            sinon.stub(MapfishDialog.prototype, "getPrintedLayers").returns([]);
            const buildLayersStub = sinon.stub(MapfishDialog.prototype, "buildLayers").resolves([{"id": 0}]),
                mapfishDialogInstance = new MapfishDialog({}, {}, "defaultValue", "EPSG:1234", "layoutName", "outputFilename", false);

            sinon.stub(createVectorLayer, "getFeatureLayer").resolves([{"id": 0}]);

            expect(await mapfishDialogInstance.getLayersArray(undefined, ["0"])).to.deep.equal([{"id": 0}]);
            expect(buildLayersStub.getCall(0).args[0][0]).to.deep.equal({layer: [{"id": 0}], opacity: 1, dpi: undefined});
        });

        it("should returns with expected array if layers array has a feature", async () => {
            sinon.stub(MapfishDialog.prototype, "getPrintedLayers").callsFake(layerIds => {
                const result = [];

                layerIds.forEach(layerId => {
                    result.push({id: layerId});
                });
                return result;
            });
            const buildLayersStub = sinon.stub(MapfishDialog.prototype, "buildLayers").resolves([{"id": 0}, {"id": 1}]),
                mapfishDialogInstance = new MapfishDialog({}, {}, "defaultValue", "EPSG:1234", "layoutName", "outputFilename", false);

            sinon.stub(createVectorLayer, "getFeatureLayer").resolves([{"id": 1}]);

            await mapfishDialogInstance.getLayersArray(undefined, ["0", "feature", "2"]);
            expect(buildLayersStub.getCall(0).args[0]).to.deep.equal([
                {id: "0"},
                {layer: [{"id": 1}], opacity: 1, dpi: undefined},
                {id: "2"}
            ]);
        });
    });

    describe("getBoundingBox", () => {
        const mapfishDialogInstance = new MapfishDialog({}, {}, "defaultValue", "EPSG:1234", "layoutName", "outputFilename", true),
            extent = [
                562765.8760436381,
                5940982.299269523,
                562877.0009836305,
                5941178.090830462
            ];

        it("should return the bounding box with proportion 0.33", () => {
            const bbox = [
                562610.73408196,
                5940869.490618318,
                563032.1429453085,
                5941290.899481666
            ];

            expect(mapfishDialogInstance.getBoundingBox(extent, undefined)).to.deep.equal(bbox);
            expect(mapfishDialogInstance.getBoundingBox(extent, null)).to.deep.equal(bbox);
            expect(mapfishDialogInstance.getBoundingBox(extent, [])).to.deep.equal(bbox);
            expect(mapfishDialogInstance.getBoundingBox(extent, false)).to.deep.equal(bbox);
            expect(mapfishDialogInstance.getBoundingBox(extent, {})).to.deep.equal(bbox);
            expect(mapfishDialogInstance.getBoundingBox(extent, "0.33")).to.deep.equal(bbox);
            expect(mapfishDialogInstance.getBoundingBox(extent, 0.33)).to.deep.equal(bbox);
            expect(mapfishDialogInstance.getBoundingBox(extent, 0)).to.deep.equal(bbox);
            expect(mapfishDialogInstance.getBoundingBox(extent, -1)).to.deep.equal(bbox);
            expect(mapfishDialogInstance.getBoundingBox(extent, 12)).to.deep.equal(bbox);
        });

        it("should return the bounding box with the configured proportion", () => {
            expect(mapfishDialogInstance.getBoundingBox(extent, 0.2)).to.deep.equal([
                562501.2928531796,
                5940760.049389537,
                563141.5841740889,
                5941400.340710447
            ]);
            expect(mapfishDialogInstance.getBoundingBox(extent, 0.5)).to.deep.equal([
                562667.9802631685,
                5940926.736799526,
                562974.8967641003,
                5941233.653300459
            ]);
            expect(mapfishDialogInstance.getBoundingBox(extent, 0.8)).to.deep.equal([
                562709.6521156656,
                5940968.408652023,
                562933.2249116031,
                5941191.981447961
            ]);
        });
    });
});
