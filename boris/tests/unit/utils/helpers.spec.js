import helpers from "../../../utils/helpers";
import {expect} from "chai";

describe("boris helper functions", () => {
    it("findBrwFeatureByYear is true", () => {
        const attribute = {
                jahrgang: "2022"
            },
            attribute1 = {
                jahrgang: "2020"
            },
            features = [{
                attribute: attribute,
                get: (key) => {
                    return attribute[key];
                }
            },
            {
                attribute: attribute1,
                get: (key) => {
                    return attribute1[key];
                }
            }],
            year = "2022",
            findBrwFeatureByYear = helpers.findBrwFeatureByYear({features, year});

        expect(findBrwFeatureByYear).to.equal(features[0]);
    });
    it("findBrwFeatureByYear is null", () => {
        const features = "",
            year = "2018",
            findBrwFeatureByYear = helpers.findBrwFeatureByYear({features, year});

        expect(findBrwFeatureByYear).to.equal(null);
    });
    it("convert", () => {
        const values = {
                jahrgang: "2022",
                richtwertnummer: "09110239",
                richtwert_euro: "5,22",
                richtwert_dm: "",
                postleitzahl: "20457",
                nutzung: "A",
                nutzung_kombiniert: "A Acker",
                grdstk_flaeche: "16000",
                stadtteil: "Hamburg-Altstadt",
                gemeinde: "Hamburg",
                beitragszustand: "erschließungsbeitrags-/kostenerstattungsbeitragsfrei und abgabenfrei nach Kommunalabgabengesetz",
                entwicklungszustand: "LF Flächen der Land- oder Forstwirtschaft",
                bodenrichtwertgruppennr: "91",
                bodenrichtwertgruppenkuerzel: "A",
                normrichtwert: "7.09",
                bezirk: "Hamburg-Mitte",
                statistisches_gebiet: "1006",
                strassenschluessel: "A158",
                strassenname: "Alter Wall",
                hausnummer: "11",
                baublock: "102010",
                schichtwert: null,
                stichtag: "01.01.2022",
                convertedBrw: "",
                convertedBrwDM: "",
                zEntwicklungszustand: "LF Flächen der Land- oder Forstwirtschaft",
                zBeitragszustand: "erschließungsbeitrags-/kostenerstattungsbeitragsfrei und abgabenfrei nach Kommunalabgabengesetz",
                zNutzung: "A Acker",
                zGrdstk_flaeche: "16000",
                zStrassenLage: null
            },
            brw = {
                values_: values,
                get: (key) => {
                    return values[key];
                }
            },
            STAG = helpers.convert({brw}).STAG,
            STAGVALUE = {
                dataType: "string",
                value: brw.get("stichtag")
            },
            ZBEIT = helpers.convert({brw}).ZBEIT,
            ZBEITVALUE = {
                dataType: "string",
                value: brw.get("zBeitragszustand")
            };

        expect(STAG).to.deep.equal(STAGVALUE);
        expect(ZBEIT).to.deep.equal(ZBEITVALUE);
    });
    it("getSW", () => {
        const values = {
                schichtwert: {
                    normschichtwert_laden: "21.000,00",
                    normschichtwert_ladenDM: "",
                    normschichtwert_laden_text: "Normierter Bodenrichtwert für Geschäftshäuser (Ergeschoss-Anteil)"
                }
            },
            feature = {
                values_: values,
                get: (key) => {
                    return values[key];
                }
            },
            getSWFunction = helpers.getSW(feature);

        expect(getSWFunction).equal(values.schichtwert);

    });
    it("getSW without schichtwert", () => {
        const values = {},
            feature = {
                values_: values,
                get: (key) => {
                    return values[key];
                }
            },
            getSWFunction = helpers.getSW(feature);

        expect(getSWFunction).to.deep.equal(null);
    });
    it("parseSW", () =>{
        const values = {
                jahrgang: "2022",
                schichtwert: {
                    normschichtwert_laden: "21000.00",
                    normschichtwert_ladenDM: "",
                    normschichtwert_laden_text: "Normierter Bodenrichtwert für Geschäftshäuser (Ergeschoss-Anteil)"
                }
            },
            feature = {
                values_: values,
                get: (key) => {
                    return values[key];
                }
            },
            parseSW = helpers.parseSW({feature});

        expect(parseSW.normschichtwert_laden).to.equal("21.000,00");
    });
    it("parseSW without sw", () => {
        const values = {
                jahrgang: "2022"
            },
            feature = {
                values_: values,
                get: (key) => {
                    return values[key];
                }
            },
            parseSW = helpers.parseSW({feature});

        expect(parseSW).to.equal(null);
    });
});
