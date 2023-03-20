import mutations from "../../../store/mutationsSchoolRoutePlanning";
import {expect} from "chai";

const {
    setRegionalPrimarySchool,
    resetStateElements,
    setRouteDescription
} = mutations;

describe("addons/schoolRoutePlanning/store/mutationsSchoolRoutePlanning.js", () => {
    describe("setRegionalPrimarySchool", () => {
        it("Should set no found school key, if no school has been found", () => {
            const state = {
                    schools: [],
                    regionalPrimarySchoolName: "",
                    regionalPrimarySchoolNumber: ""
                },
                regionalPrimarySchoolNumber = "5810-0";

            setRegionalPrimarySchool(state, regionalPrimarySchoolNumber);

            expect(state.regionalPrimarySchoolName).equals("additional:modules.tools.schoolRoutePlanning.noSchoolFound");
            expect(state.regionalPrimarySchoolNumber).equals("5810-0");
        });
    });

    describe("resetStateElements", () => {
        it("Should set many attributes to default value", () => {
            const state = {
                inputAddress: "123",
                streetNames: ["xyz"],
                houseNumbers: ["def"],
                filteredHouseNumbers: ["abc"],
                regionalPrimarySchoolNumber: 999,
                regionalPrimarySchoolName: "Test",
                selectedSchool: null,
                selectedSchoolNumber: "8109-2",
                selectedAddress: "ABC Street",
                routeDescription: ["opq"],
                routeElements: {abc: 123},
                routeGeometry: 777,
                routeLength: 888
            };

            resetStateElements(state);
            expect(state.inputAddress).to.equals("");
            expect(state.streetNames).to.be.an("array").that.is.empty;
            expect(state.houseNumbers).to.be.an("array").that.is.empty;
            expect(state.filteredHouseNumbers).to.be.an("array").that.is.empty;

            expect(state.regionalPrimarySchoolNumber).to.equals(null);
            expect(state.regionalPrimarySchoolName).to.equals(null);
            expect(state.selectedSchool).to.equals(null);
            expect(state.selectedSchoolNumber).to.equals("");
            expect(state.selectedAddress).to.equals("");

            expect(state.routeDescription).to.be.an("array").that.is.empty;
            expect(state.routeElements).to.be.an("object").that.is.empty;
            expect(state.routeGeometry).to.equals(null);
            expect(state.routeLength).to.equals(null);
        });
    });

    describe("setRouteDescription", () => {
        it("Should set the route description data", () => {
            const state = {
                    routeDescription: []
                },
                routeDescription = [
                    {
                        anweisung: "abc"
                    },
                    {
                        anweisung: "def"
                    }
                ];

            setRouteDescription(state, routeDescription);
            expect(state.routeDescription).to.deep.equals([
                ["1", "abc"],
                ["2", "def"]
            ]);

        });
    });
});
