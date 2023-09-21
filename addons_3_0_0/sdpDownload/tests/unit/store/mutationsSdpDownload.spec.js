import {expect} from "chai";
import mutations from "../../../store/mutationsSdpDownload";


const {applyTranslationKey} = mutations;

describe("addons/sdpDownload/store/mutationsSdpDownload", function () {

    describe("testing setting of mutations with payload", function () {
        it("removes 'translate#' from name if present", function () {
            const state = {
                    name: "translate#additional:modules.sdpDownload.name"
                },
                payload = "translate#additional:modules.sdpDownload.name";

            applyTranslationKey(state, payload);
            expect(state.name).to.equal("additional:modules.sdpDownload.name");
        });
        it("does nothing, if name not starts with 'translate#'", function () {
            const name = "dies ist ein VueAddon",
                state = {
                    name: name
                },
                payload = name;

            applyTranslationKey(state, payload);
            expect(state.name).to.equal(name);
        });
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

    describe("testing setting of mutations if payload undefined", function () {
        it("applyTranslationKey does nothing with undefined payload", function () {
            const name = "name",
                state = {
                    name: name
                },
                payload = undefined;

            applyTranslationKey(state, payload);
            expect(state.name).to.equals(name);
        });
    });
});
