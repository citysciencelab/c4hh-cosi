import {expect} from "chai";
import getters from "../../../store/gettersOktagonKartenportal";

const {
    createSubmitURL,
    getParameterValue,
    hasDistrict
} = getters;

describe("addons/oktagonKartenportal/store/gettersOktagonKartenportal", () => {
    it("createSubmitURL creates the submit url", () => {
        const submitObject = {
                "KoordinateX": "562867,80478388",
                "KoordinateY": "5936848,780021071",
                "Baublock": "303004",
                "Gemarkungsname": "Eimsbüttel",
                "Gemarkungsnummer": "0303",
                "Flurstuecksnummer": "1963"
            },
            state = {
                returnURL: "https://oktagon-dev.stadt.hamburg.de/g2vbplus/portalcallback?mandator=1&tasktype=BG62&selektor=LGV_HINTERGRUND&key=KP_SrgmG94ays"
            };

        expect(createSubmitURL(state)(submitObject)).to.equals("https://oktagon-dev.stadt.hamburg.de/g2vbplus/portalcallback?mandator=1&tasktype=BG62&selektor=LGV_HINTERGRUND&key=KP_SrgmG94ays&KoordinateX=562867,80478388&KoordinateY=5936848,780021071&Baublock=303004&Gemarkungsname=Eimsbüttel&Gemarkungsnummer=0303&Flurstuecksnummer=1963");
    });
    it("getParameterValue returns the parameter value", () => {
        const parameterObject = {
            "result": {
                "STRASSE": "OSTERSTRAßE"
            },
            "property": "STRASSE"
        };

        expect(getParameterValue()(parameterObject)).to.equals("OSTERSTRAßE");
    });
    it("hasDistrict handels the Bezirk URL parameter", () => {
        const districtFromUrl = "HARBURG";

        expect(hasDistrict()(districtFromUrl)).to.equals("HARBURG");
    });
});
