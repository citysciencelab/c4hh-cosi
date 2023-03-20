import testAction from "../../../../../test/unittests/VueTestUtils";
import actions from "../../../store/actionsOktagonKartenportal";


const {
    addCoordinatesToSubmitObject,
    alertWrongInputParameters,
    createAddress,
    handleResponse,
    initURLParameter,
    parseXML,
    zoomToAddress
} = actions;

describe("addons/oktagonKartenportal/store/actionsOktagonKartenportal", () => {
    it("addCoordinatesToSubmitObject adds the coordinate parameters to the submit object ", done => {
        testAction(addCoordinatesToSubmitObject, [563661.6283001676, 5936589.223139428], {}, {}, [
            {type: "setSubmitObject", payload: {KoordinateX: "563661,6283001676", KoordinateY: "5936589,223139428"}}
        ], {submitObject: {}}, done);
    });
    it("alertWrongInputParameters triggers an alert for wrong input Parameters", done => {

        testAction(alertWrongInputParameters, {}, {}, {}, [
            {type: "Alerting/addSingleAlert", payload: "<strong>" + i18next.t("additional:modules.tools.oktagon.wrongAddressParameter") + "</strong>"
            + "<br>"
            + "<small>" + i18next.t("additional:modules.tools.oktagon.wrongAddressParameterMessage") + "</small>",
            dispatch: true}
        ], {}, done);
    });
    describe("createAddress assembles the address from the URL parameters", function () {
        const getters = {
            getParameterValue: (paramObject) => {
                if (paramObject.property === "STRASSE") {
                    return "OSTERSTRAßE";
                }
                else if (paramObject.property === "HAUSNUMMER") {
                    return "12";
                }
                return "a";
            }
        };

        it("createAddress with parameter street ", done => {
            const searchParams = {
                searchStreets: true
            };

            testAction(createAddress, {}, {}, {}, [
                {type: "setAddress", payload: "OSTERSTRASSE"},
                {type: "startSearch", payload: {searchInput: "OSTERSTRAßE", searchParams: searchParams}, dispatch: true}
            ], getters, done);

        });
        it("createAddress with parameter straße and hausnummer ", done => {
            const searchParams = {
                searchStreets: true,
                searchAddress: true
            };

            testAction(createAddress, {HAUSNUMMER: "12"}, {}, {}, [
                {type: "setAddress", payload: "OSTERSTRASSE 12"},
                {type: "startSearch", payload: {searchInput: "OSTERSTRAßE 12", searchParams: searchParams}, dispatch: true}
            ], getters, done);

        });
        it("createAddress with parameter straße, hausnummer and zusatz ", done => {
            const searchParams = {
                searchStreets: true,
                searchAddress: true
            };

            testAction(createAddress, {HAUSNUMMER: "12", ZUSATZ: "a"}, {}, {}, [
                {type: "setAddress", payload: "OSTERSTRASSE 12A"},
                {type: "startSearch", payload: {searchInput: "OSTERSTRAßE 12a", searchParams: searchParams}, dispatch: true}
            ], getters, done);

        });
    });
    it("handleResponse handles the wms response", done => {
        const response = [
                {
                    name: "Osterstraße 12",
                    geometry: {
                        type: "Point",
                        coordinates: [
                            "563677.371",
                            "5936552.043"
                        ]
                    }
                }
            ],
            getters = {
                address: "OSTERSTRASSE 12"
            };

        testAction(handleResponse, response, {}, {}, [
            {type: "zoomToAddress", payload: ["563677.371", "5936552.043"], dispatch: true}
        ], getters, done);
    });
    describe("initURLParameter reads the parameters and zooms the map accordingly", function () {
        it("initURLParameter called with wrong parameter bezirk=Harburg1", done => {
            global.window = Object.create(window);
            const url = "?bezirk=Harburg1&rueckurl=https://oktagon-dev.stadt.hamburg.de/g2vbplus/portalcallback?mandator=1%26tasktype=BG62%26selektor=LGV_HINTERGRUND%26key=KP_SrgmG94ays",
                districtFromUrl = "HARBURG1",
                getters = {
                    hasDistrict: () => {
                        return "";
                    },
                    getParameterValue: () => {
                        return "HARBURG1";
                    }
                };

            Object.defineProperty(window, "location", {
                value: {
                    search: url
                }
            });

            testAction(initURLParameter, {}, {}, {}, [
                {type: "setReturnURL", payload: "https://oktagon-dev.stadt.hamburg.de/g2vbplus/portalcallback?mandator=1&tasktype=BG62&selektor=LGV_HINTERGRUND&key=KP_SrgmG94ays"},
                {type: "Alerting/addSingleAlert", payload: "<strong>" + i18next.t("additional:modules.tools.oktagon.wrongDistrictName") + "</strong>"
                + "<br>"
                + "<small>" + i18next.t("additional:modules.tools.oktagon.wrongDistrictNameMessage") + districtFromUrl + ".</small>",
                dispatch: true}
            ], getters, done);
        });
        it("initURLParameter called with parameter bezirk=Harburg", done => {
            global.window = Object.create(window);
            const url = "?bezirk=Harburg&rueckurl=https://oktagon-dev.stadt.hamburg.de/g2vbplus/portalcallback?mandator=1%26tasktype=BG62%26selektor=LGV_HINTERGRUND%26key=KP_SrgmG94ays",
                districtFromUrl = "HARBURG",
                getters = {
                    hasDistrict: () => {
                        return "HARBURG";
                    },
                    getParameterValue: () => {
                        return "HARBURG";
                    }
                };

            Object.defineProperty(window, "location", {
                value: {
                    search: url
                }
            });

            testAction(initURLParameter, {}, {}, {}, [
                {type: "setReturnURL", payload: "https://oktagon-dev.stadt.hamburg.de/g2vbplus/portalcallback?mandator=1&tasktype=BG62&selektor=LGV_HINTERGRUND&key=KP_SrgmG94ays"},
                {type: "ZoomTo/setZoomToGeometry", payload: districtFromUrl},
                {type: "ZoomTo/zoomToFeatures", payload: {}, dispatch: true}
            ], getters, done);
        });
        it("initURLParameter called with parameter strasse", done => {
            global.window = Object.create(window);
            const url = "?strasse=Osterstraße&rueckurl=https://oktagon-dev.stadt.hamburg.de/g2vbplus/portalcallback?mandator=1%26tasktype=BG62%26selektor=LGV_HINTERGRUND%26key=KP_SrgmG94ays";

            Object.defineProperty(window, "location", {
                value: {
                    search: url
                }
            });

            testAction(initURLParameter, {}, {}, {}, [
                {type: "setReturnURL", payload: "https://oktagon-dev.stadt.hamburg.de/g2vbplus/portalcallback?mandator=1&tasktype=BG62&selektor=LGV_HINTERGRUND&key=KP_SrgmG94ays"},
                {type: "createAddress", payload: {RUECKURL: "HTTPS://OKTAGON-DEV.STADT.HAMBURG.DE/G2VBPLUS/PORTALCALLBACK?MANDATOR=1&TASKTYPE=BG62&SELEKTOR=LGV_HINTERGRUND&KEY=KP_SRGMG94AYS", STRASSE: "OSTERSTRASSE"}, dispatch: true}
            ], {}, done);
        });
        it("initURLParameter called with wrong parameter strasse", done => {
            global.window = Object.create(window);
            const url = "?strasse=Osterstra%C3%9Fe&hausnummer=12&rueckurl=https://oktagon-dev.stadt.hamburg.de/g2vbplus/portalcallback?mandator=1%26tasktype=BG62%26selektor=LGV_HINTERGRUND%26key=KP_SrgmG94ays";

            Object.defineProperty(window, "location", {
                value: {
                    search: url
                }
            });

            testAction(initURLParameter, {}, {}, {}, [
                {type: "setReturnURL", payload: "https://oktagon-dev.stadt.hamburg.de/g2vbplus/portalcallback?mandator=1&tasktype=BG62&selektor=LGV_HINTERGRUND&key=KP_SrgmG94ays"}
            ], {}, done);
        });
    });
    it("parseXML handles the wms response", done => {
        const parser = new DOMParser(),
            xml = "<?xml version='1.0' standalone='yes' ?><FIELDS OID='118628' Identifikator='DEHHALKAV00007Kv' GemarkungLand='02' Gemarkungsnummer='0303' Flurstuecksnummer='1975' Flurstueckskennzeichen='020303___01975______' AmtlicheFlaeche='496' ObjektkoordinatenRechtswert='32563645.956' ObjektkoordinatenHochwert='5936578.834' KoordinatenReferenzSystem='ETRS89_UTM32' SchluesselGesamt='020303' Gemarkungsname='Eimsbüttel'/>",
            xmlDoc = parser.parseFromString(xml, "application/xml"),
            getters = {
                submitObject: {
                    KoordinateX: "563648,1345574543",
                    KoordinateY: "5936575,067938738",
                    Baublock: "305013",
                    Gemarkungsname: "Eimsbüttel",
                    Gemarkungsnummer: "0303",
                    Flurstuecksnummer: "1975"
                },
                createSubmitURL: () => {
                    return "https://oktagon-dev.stadt.hamburg.de/g2vbplus/portalcallback?mandator=1&tasktype=BG62&selektor=LGV_HINTERGRUND&key=KP_SrgmG94ays&KoordinateX=563682,0012058329&KoordinateY=5936556,15024062&Baublock=308008";
                }
            };

        testAction(parseXML, xmlDoc, {}, {}, [
            {type: "setSubmitURL", payload: "https://oktagon-dev.stadt.hamburg.de/g2vbplus/portalcallback?mandator=1&tasktype=BG62&selektor=LGV_HINTERGRUND&key=KP_SrgmG94ays&KoordinateX=563682,0012058329&KoordinateY=5936556,15024062&Baublock=308008"},
            {type: "setSubmitObject", payload: {}},
            {type: "setSubmitObject", payload: {
                KoordinateX: "563648,1345574543",
                KoordinateY: "5936575,067938738",
                Baublock: "305013",
                Gemarkungsname: "Eimsbüttel",
                Gemarkungsnummer: "0303",
                Flurstuecksnummer: "1975"
            }}
        ], getters, done);
    });
    it("zoomToAddress zooms the map to the address", done => {
        const coordinates = [
                "562853.385",
                "5936823.903"
            ],
            coordinatesArray = [
                562853.385,
                5936823.903
            ];

        testAction(zoomToAddress, coordinates, {}, {}, [
            {type: "Maps/setCenter", payload: coordinatesArray, dispatch: true},
            {type: "Maps/setZoomLevel", payload: 9, dispatch: true},
            {type: "MapMarker/placingPointMarker", payload: coordinatesArray, dispatch: true}
        ], {}, done);
    });
});
