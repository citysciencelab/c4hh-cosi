import getters from "../../../store/gettersSchoolRoutePlanning";
import {expect} from "chai";

describe("addons/schoolRoutePlanning/store/gettersSchoolRoutePlanning.js", () => {
    describe("SchoolRoutePlanning getters", () => {
        it("returns the sorted schools from state", () => {
            const state = {
                    schools: [
                        {
                            name: "aSchool",
                            get: () => "aSchool"
                        },
                        {
                            name: "cSchool",
                            get: () => "cSchool"
                        },
                        {
                            name: "bSchool",
                            get: () => "bSchool"
                        }
                    ]
                },
                finalPosition = ["aSchool", "bSchool", "cSchool"];

            getters.sortedSchools(state).forEach((school, index) => {
                expect(school.get("schulname")).equals(finalPosition[index]);
            });
        });
    });
});
