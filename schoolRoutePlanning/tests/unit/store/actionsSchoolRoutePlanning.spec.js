import testAction from "../../../../../test/unittests/VueTestUtils";
import actions from "../../../store/actionsSchoolRoutePlanning";

const {
    setGeometryByFeatureId,
    selectInitializeSchoolNumber
} = actions;


describe("addons/schoolRoutePlanning/store/actionsSchoolRoutePlanning.js", () => {
    describe("setGeometryByFeatureId", () => {
        it("processInput start search streets", done => {
            const targetElement = {
                id: "BratwurstId",
                source: {
                    getExtent: () => "BratwurstExtend"
                },
                geometry: {
                    getType: () => "Point"
                }
            };

            testAction(setGeometryByFeatureId, targetElement, {}, {}, [
                {type: "setFilteredHouseNumbers", payload: []}
            ], {}, done);
        });
    });

    describe("selectInitializeSchoolNumber", () => {
        it("Sets the initialize school number", done => {
            const schoolNumber = "5810-1";

            testAction(selectInitializeSchoolNumber, schoolNumber, {}, {}, [
                {type: "setInitialSelectedSchoolNumber", payload: "5810-1"}
            ], {}, done);
        });
    });
});
