import {expect} from "chai";
import stateSdpDownload from "../../../store/stateSdpDownload.js";


describe("addons/sdpDownload/store/gettersSdpDownload", function () {
    it("returns the active from state", function () {
        expect(stateSdpDownload.active).to.be.false;
    });
    it("returns the type from state", function () {
        expect(stateSdpDownload.type).to.be.equal("SdpAddon");
    });

    describe("testing default values", function () {
        it("returns the name default value from state", function () {
            expect(stateSdpDownload.name).to.be.equal("additional:modules.sdpDownload.name");
        });
        it("returns the icon default value from state", function () {
            expect(stateSdpDownload.icon).to.be.equal("bi-download");
        });
        it("returns the hasMouseMapInteractions default value from state", function () {
            expect(stateSdpDownload.hasMouseMapInteractions).to.be.true;
        });
        it("returns the transactionProcessing default value from state", function () {
            expect(stateSdpDownload.transactionProcessing).to.be.false;
        });
        it("returns the wmsRasterLayerId default value from state", function () {
            expect(stateSdpDownload.wmsRasterLayerId).to.be.equal("4707");
        });
        it("returns the formats default value from state", function () {
            expect(stateSdpDownload.formats).to.be.eql([
                {id: "NAS", label: "additional:modules.sdpDownload.nasLabel", isSelected: true, desc: "additional:modules.sdpDownload.nasDescription", fileId: "nas"},
                {id: "DWG_310", label: "additional:modules.sdpDownload.dwg310Label", isSelected: false, desc: "additional:modules.sdpDownload.dwg310Description", fileId: "dwg310"},
                {id: "DWG_320", label: "additional:modules.sdpDownload.dwg320Label", isSelected: false, desc: "additional:modules.sdpDownload.dwg320Description", fileId: "dwg320"},
                {id: "JPG", label: "additional:modules.sdpDownload.jpgLabel", isSelected: false, desc: "additional:modules.sdpDownload.jpgDescription", fileId: "jpg"}]);
        });
        it("returns the selectedFormat default value from state", function () {
            expect(stateSdpDownload.selectedFormat).to.be.equal("NAS");
        });
        it("returns the compressDataId default value from state", function () {
            expect(stateSdpDownload.compressDataId).to.be.equal("compressData_nodejs");
        });
        it("returns the wfsRasterParams default value from state", function () {
            expect(stateSdpDownload.wfsRasterParams).to.be.eql({
                url: "https://geodienste.hamburg.de/HH_WFS_Uebersicht_Kachelbezeichnungen",
                request: "GetFeature",
                service: "WFS",
                version: "1.1.0",
                typename: "app:lgv_kachel_dk5_1km_utm"
            });
        });
        it("returns the wfsRaster default value from state", function () {
            expect(stateSdpDownload.wfsRaster).to.be.eql({});
        });
        it("returns the graphicalSelectModel default value from state", function () {
            expect(stateSdpDownload.graphicalSelectModel).to.be.eql({});
        });
        it("returns the selectedRasterLimit default value from state", function () {
            expect(stateSdpDownload.selectedRasterLimit).to.be.equal(9);
        });
        it("returns the rasterNames default value from state", function () {
            expect(stateSdpDownload.rasterNames).to.be.eql([]);
        });
    });
});
