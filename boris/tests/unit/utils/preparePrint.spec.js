import {createAddressString, createPostalCodeCityString, printFloorValues} from "../../../utils/preparePrint";
import {expect} from "chai";

describe("boris preparePrint functions", () => {
    it("createAddressString", () => {
        const attributes = {"strassenname": "Bananas", "hausnummer": "19", "hausnummerzusatz": "b"},
            feature = {
                "attributes": attributes,
                get: (key)=> {
                    return attributes[key];
                }
            };

        expect(createAddressString(feature)).equals("Bananas 19b");

    });
    it("createPostalCodeCityString", () => {
        const attributes = {"postleitzahl": "21109", "gemeinde": "Hamburg"},
            feature = {
                "attributes": attributes,
                get: (key)=> {
                    return attributes[key];
                }
            };

        expect(createPostalCodeCityString(feature)).equals("21109 Hamburg");
    });
    it("printFloorValues is true", () => {
        const feature = {"schichtwerte": [
            {"geschoss": "3. Obergeschoss oder höher",
                "nutzung": "Büros",
                "schichtwert": "1.505,75",
                "schichtwertDM": "2.945,0",
                "wgfz": "2.00"},
            {"geschoss": "2. Obergeschoss",
                "nutzung": "Büros",
                "schichtwert": "1.505,75",
                "schichtwertDM": "2.945,0",
                "wgfz": "1.00"}
        ]};

        expect(printFloorValues(feature)).equals(true);
    });
    it("printFloorValues is false", () => {
        const feature = {"keineSchichtwerte": "gar keine"};

        expect(printFloorValues(feature)).equals(false);
    });
});
