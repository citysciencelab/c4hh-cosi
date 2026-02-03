import {expect} from "chai";
import mutations from "../../../store/mutationsSdpDownload.js";


describe("addons/sdpDownload/store/mutationsSdpDownload", function () {

    describe("testing setting of mutations with payload", function () {
        it("setSelectedFormat changes value", () => {
            // mock state
            const state = {selectedFormat: "NAS"},
                payload = "Scharhoern";
            // apply mutation

            mutations.setSelectedFormat(state, payload);
            // assert result
            expect(state.selectedFormat).to.equal("Scharhoern");
        });
        it("graphicalSelectModel changes value", () => {
            const state = {graphicalSelectModel: {}},
                payload = {x: 1};

            mutations.setGraphicalSelectModel(state, payload);
            expect(state.graphicalSelectModel).to.deep.equal({x: 1});
        });
        it("setSelectedAreaGeoJson changes value", () => {
            const state = {graphicalSelectModel: {attributes: {selectedAreaGeoJson: [12, 4]}}},
                payload = [13, 4];

            mutations.setSelectedAreaGeoJson(state, payload);

            expect(state.graphicalSelectModel.attributes.selectedAreaGeoJson).to.deep.equal([13, 4]);
        });
        it("wfsRaster changes value", () => {
            const state = {wfsRaster: {}},
                payload = {cord: [10, 20]};

            mutations.setWfsRaster(state, payload);
            expect(state.wfsRaster).to.deep.equal({cord: [10, 20]});
        });
        it("rasterNames changes value", () => {
            const state = {rasterNames: []},
                payload = ["650330", "650331"];

            mutations.setRasterNames(state, payload);

            expect(state.rasterNames).to.deep.equal(["650330", "650331"]);
        });
    });

});
