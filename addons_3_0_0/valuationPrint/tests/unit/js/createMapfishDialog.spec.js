import {expect} from "chai";
import sinon from "sinon";
import {createMapfishDialog, createLegendObject} from "../../../js/createMapfishDialog";
import {rawLayerList} from "@masterportal/masterportalapi";

describe("addons_3_0_0/valuationPrint/js/createMapfishDialog.js", () => {

    describe("createMapfishDialog", () => {

        it("adds legend object to mapfish dialog if configured", () => {
            const mapfishDialog = createMapfishDialog(undefined, undefined, [], "", "", "", true);

            expect(Object.hasOwn(mapfishDialog.attributes, "legend")).to.be.true;
        });

        it("does not add legend object to mapfish dialog if not configured", () => {
            const mapfishDialog = createMapfishDialog(undefined, undefined, [], "", "", "");

            expect(Object.hasOwn(mapfishDialog.attributes, "legend")).to.be.false;
        });
    });

    describe("createLegendObject", () => {

        it("returns empty layer array if parameters are missing", () => {
            const legendObject = createLegendObject();

            expect(legendObject.layers).to.be.an("array").that.is.empty;
        });

        it("returns empty layer array if empty set is passed", () => {
            const legendObject = createLegendObject(new Set());

            expect(legendObject.layers).to.be.an("array").that.is.empty;
        });

        it("returns empty layer array if layers do not exist", () => {
            sinon.stub(rawLayerList, "getLayerWhere").returns(undefined);

            const legendObject = createLegendObject(new Set(["id_1", "id_2", "id_3"]));

            expect(legendObject.layers).to.be.an("array").that.is.empty;
        });

        it("returns empty layer array if layer is not WMS", () => {
            sinon.stub(rawLayerList, "getLayerWhere").returns({typ: "WFS"});

            const legendObject = createLegendObject(new Set(["id_1"]));

            expect(legendObject.layers).to.be.an("array").that.is.empty;
        });

        it("returns empty layer array if layer has pdf legend", () => {
            sinon.stub(rawLayerList, "getLayerWhere").returns({typ: "WMS", legendURL: "Legende.pdf"});

            const legendObject = createLegendObject(new Set(["id_1"]));

            expect(legendObject.layers).to.be.an("array").that.is.empty;
        });

        it("returns layer array containing as many elements as valid layer ids are passed", () => {
            sinon.stub(rawLayerList, "getLayerWhere")
                .onFirstCall().returns(undefined)
                .onSecondCall().returns({typ: "WMS"})
                .onThirdCall().returns({typ: "WMS"});

            const legendObject = createLegendObject(new Set(["id_1", "id_2", "id_3"]));

            expect(legendObject.layers).to.have.lengthOf(2);
        });
    });
});
