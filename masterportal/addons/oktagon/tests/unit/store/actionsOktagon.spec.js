import {expect} from "chai";
import sinon from "sinon";
import actions from "../../../store/actionsOktagon.js";

const {
    addCoordinatesToSubmitObject,
    alertWrongInputParameters,
    createAddress,
    handleResponse,
    initURLParameter,
    parseXML,
    zoomToAddress
} = actions;

describe("addons/oktagon/store/actionsOktagon", () => {

    beforeEach(() => {
        sinon.stub(i18next, "t").callsFake(key => key);
    });


    it("addCoordinatesToSubmitObject adds the coordinate parameters to the submit object", async () => {
        const commit = sinon.spy(),
            coords = [563661.6283001676, 5936589.223139428],
            getters = {submitObject: {}};

        await addCoordinatesToSubmitObject({commit, getters}, coords);

        expect(commit.calledOnceWithExactly("setSubmitObject", {
            KoordinateX: "563661,6283001676",
            KoordinateY: "5936589,223139428"
        })).to.be.true;
    });

    it("alertWrongInputParameters triggers an alert for wrong input Parameters", async () => {
        const dispatch = sinon.spy(),
            result = await alertWrongInputParameters({dispatch}, key => key),
            [type, payload] = dispatch.firstCall.args;

        expect(result).to.be.undefined;
        expect(type).to.equal("Alerting/addSingleAlert");
        expect(payload).to.include("additional:modules.oktagon.wrongAddressParameter");
        expect(payload).to.include("additional:modules.oktagon.wrongAddressParameterMessage");
    });

    describe("createAddress assembles the address from the URL parameters", () => {
        const getters = {
            getParameterValue: ({property}) => {
                if (property === "STRASSE") {
                    return "OSTERSTRAßE";
                }
                if (property === "HAUSNUMMER") {
                    return "12";
                }
                return "a";
            }
        };

        it("with parameter street", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            await createAddress({commit, dispatch, getters}, {});

            expect(commit.calledWith("setAddress", "OSTERSTRASSE")).to.be.true;
            expect(dispatch.calledWith("startSearch", {
                searchInput: "OSTERSTRAßE",
                searchParams: {searchStreets: true}
            })).to.be.true;
        });

        it("with parameter straße and hausnummer", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            await createAddress({commit, dispatch, getters}, {HAUSNUMMER: "12"});

            expect(commit.calledWith("setAddress", "OSTERSTRASSE 12")).to.be.true;
            expect(dispatch.calledWith("startSearch", {
                searchInput: "OSTERSTRAßE 12",
                searchParams: {searchStreets: true, searchAddress: true}
            })).to.be.true;
        });

        it("with parameter straße, hausnummer and zusatz", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            await createAddress({commit, dispatch, getters}, {HAUSNUMMER: "12", ZUSATZ: "a"});

            expect(commit.calledWith("setAddress", "OSTERSTRASSE 12A")).to.be.true;
            expect(dispatch.calledWith("startSearch", {
                searchInput: "OSTERSTRAßE 12a",
                searchParams: {searchStreets: true, searchAddress: true}
            })).to.be.true;
        });
    });

    it("handleResponse handles the wms response", async () => {
        const dispatch = sinon.spy(),
            response = [{
                name: "Osterstraße 12",
                geometry: {type: "Point", coordinates: ["563677.371", "5936552.043"]}
            }];

        await handleResponse({dispatch, getters: {address: "OSTERSTRASSE 12"}}, response);

        expect(dispatch.calledWith("zoomToAddress", ["563677.371", "5936552.043"])).to.be.true;
    });

    describe("initURLParameter reads the parameters and zooms the map accordingly", () => {
        it("called with wrong parameter bezirk=Harburg1", async () => {
            global.window = Object.create(window);
            Object.defineProperty(window, "location", {
                value: {search: "?bezirk=Harburg1&rueckurl=https://example.com"}
            });

            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                getters = {
                    hasDistrict: () => "",
                    getParameterValue: () => "HARBURG1"
                };

            await initURLParameter({commit, dispatch, getters});

            expect(commit.calledWith("setReturnURL", sinon.match.string)).to.be.true;
            expect(dispatch.calledWith("Alerting/addSingleAlert", sinon.match.string)).to.be.true;
        });

        it("called with parameter bezirk=Harburg", async () => {
            global.window = Object.create(window);
            Object.defineProperty(window, "location", {
                value: {search: "?bezirk=Harburg&rueckurl=https://example.com"}
            });

            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                getters = {
                    hasDistrict: () => "HARBURG",
                    getParameterValue: () => "HARBURG"
                };

            await initURLParameter({commit, dispatch, getters});

            expect(commit.calledWith("setReturnURL", sinon.match.string)).to.be.true;
            expect(dispatch.calledWith("Maps/zoomToFeatures", {ZOOMTOGEOMETRY: "HARBURG"})).to.be.true;
        });
    });

    it("parseXML handles the wms response", async () => {
        const parser = new DOMParser(),
            xml = "<?xml version='1.0' standalone='yes' ?><FIELDS Gemarkungsname='Eimsbüttel' Gemarkungsnummer='0303' Flurstuecksnummer='1975'/>",
            xmlDoc = parser.parseFromString(xml, "application/xml"),

            commit = sinon.spy(),
            getters = {
                submitObject: {
                    KoordinateX: "563648,1345574543",
                    KoordinateY: "5936575,067938738",
                    Baublock: "305013",
                    Gemarkungsname: "Eimsbüttel",
                    Gemarkungsnummer: "0303",
                    Flurstuecksnummer: "1975"
                },
                createSubmitURL: () => "https://example.com?foo=bar"
            };

        await parseXML({commit, getters}, xmlDoc);

        expect(commit.calledWith("setSubmitURL", sinon.match.string)).to.be.true;
        expect(commit.calledWith("setSubmitObject", sinon.match.object)).to.be.true;
    });

    it("zoomToAddress zooms the map to the address", async () => {
        const dispatch = sinon.spy(),
            coords = ["562853.385", "5936823.903"],
            coordsArray = [562853.385, 5936823.903];

        await zoomToAddress({dispatch}, coords);

        expect(dispatch.calledWith("Maps/setCenter", coordsArray)).to.be.true;
        expect(dispatch.calledWith("Maps/setZoom", 9)).to.be.true;
        expect(dispatch.calledWith("Maps/placingPointMarker", coordsArray)).to.be.true;
    });
});
