import testAction from "@devtools/tests/VueTestUtils.js";
import getCswRecordById from "@shared/js/api/getCswRecordById.js";
import sinon from "sinon";
import actions from "@modules/about/store/actionsAbout.js";
import packageJson from "../../../../../../package.json";

const {initializeAboutInfo, currentMasterportalVersionNumber} = actions;

afterEach(() => {
    sinon.restore();
});

describe("src/modules/layerInformation/store/actionsAbout.js", () => {
    describe("initialize the store", () => {
        it("should show the about module in menu", done => {
            const state = {
                    metaId: "portalId",
                    cswUrl: "test.de"
                },
                rootGetters = {
                    isMobile: false,
                    "Menu/expanded": () => true
                },
                cswReturn = {
                    getTitle: () => "name",
                    getAbstract: () => "abstract",
                    getContact: () => "contact"
                };

            sinon.stub(getCswRecordById, "getRecordById").returns(cswReturn);

            testAction(initializeAboutInfo, {}, state, {}, [
                {type: "setTitle", payload: "name"},
                {type: "setAbstractText", payload: "abstract", commit: true},
                {type: "setContact", payload: "contact", commit: true},
                {type: "currentMasterportalVersionNumber", payload: undefined, dispatch: true}
            ], {}, done, rootGetters);
        });

        it("should set the masterportal version from state, if version is a string", done => {
            const state = {
                version: "3.4.0"
            };

            testAction(currentMasterportalVersionNumber, {}, state, {}, [
                {type: "setVersion", payload: "3.4.0", commit: true}
            ], {}, done, {});
        });

        it("should set the masterportal version from package.json, if version is true", done => {
            const state = {
                version: true
            };

            testAction(currentMasterportalVersionNumber, {}, state, {}, [
                {type: "setVersion", payload: packageJson.version, commit: true}
            ], {}, done, {});
        });
        it("should NOT call CSW if cswUrl is empty", async () => {
            const state = {
                metaId: "portalId",
                cswUrl: ""
            };

            const spy = sinon.spy(getCswRecordById, "getRecordById");

            await initializeAboutInfo({commit: () => {
                null;
            }, dispatch: () => {
                null;
            }, state, rootGetters: {}});

            sinon.assert.notCalled(spy);
        });
        it("should NOT overwrite existing abstractText if metadata is missing", async () => {
            const commit = sinon.spy();

            const state = {
                metaId: "portalId",
                cswUrl: null,
                abstractText: "existing text"
            };

            await initializeAboutInfo({
                commit,
                dispatch: () => {
                    null;
                },
                state,
                rootGetters: {}
            });

            const calls = commit.getCalls().map(c => c.args[0]);

            if (calls.includes("setAbstractText")) {
                throw new Error("abstractText should not be overwritten");
            }
        });
        it("should use publisher if contact is not available", done => {
            const state = {
                    metaId: "portalId",
                    cswUrl: "test.de"
                },
                cswReturn = {
                    getTitle: () => "name",
                    getAbstract: () => "abstract",
                    getContact: () => null,
                    getPublisher: () => "publisher"
                };

            sinon.stub(getCswRecordById, "getRecordById").returns(cswReturn);

            testAction(initializeAboutInfo, {}, state, {}, [
                {type: "setTitle", payload: "name"},
                {type: "setAbstractText", payload: "abstract", commit: true},
                {type: "setContact", payload: "publisher", commit: true},
                {type: "currentMasterportalVersionNumber", dispatch: true}
            ], {}, done, {});
        });
    });
});
