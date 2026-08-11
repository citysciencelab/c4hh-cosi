import getCswRecordById from "@shared/js/api/getCswRecordById.js";
import sinon from "sinon";
import actions from "@modules/about/store/actionsAbout.js";
import packageJson from "../../../../../../package.json";

describe("src/modules/about/store/actionsAbout.js", () => {
    describe("initialize the store", () => {
        it("should show the about module in menu", async () => {
            const state = {
                    metaId: "portalId",
                    cswUrl: "test.de",
                    currentMasterportalVersionNumber: sinon.spy()
                },
                cswReturn = {
                    getTitle: () => "name",
                    getAbstract: () => "abstract",
                    getContact: () => "contact"
                };

            sinon.stub(getCswRecordById, "getRecordById").returns(cswReturn);

            await actions.initializeAboutInfo.call(state);

            expect(state.title).to.equal("name");
            expect(state.abstractText).to.equal("abstract");
            expect(state.contact).to.equal("contact");
            expect(state.currentMasterportalVersionNumber.calledOnce).to.be.true;
        });

        it("should set the masterportal version from state, if version is a string", async () => {
            const state = {
                version: "3.4.0"
            };

            actions.currentMasterportalVersionNumber.call(state);

            expect(state.version).to.equal("3.4.0");
        });

        it("should set the masterportal version from package.json, if version is true", async () => {
            const state = {
                version: true
            };

            actions.currentMasterportalVersionNumber.call(state);

            expect(state.version).to.equal(packageJson.version);
        });

        it("should NOT call CSW if cswUrl is empty", async () => {
            const state = {
                    metaId: "portalId",
                    cswUrl: "",
                    currentMasterportalVersionNumber: sinon.spy()
                },
                spy = sinon.spy(getCswRecordById, "getRecordById");

            await actions.initializeAboutInfo.call(state);

            sinon.assert.notCalled(spy);
        });

        it("should NOT overwrite existing abstractText if metadata is missing", async () => {
            const state = {
                metaId: "portalId",
                cswUrl: null,
                abstractText: "existing text",
                currentMasterportalVersionNumber: sinon.spy()
            };

            await actions.initializeAboutInfo.call(state);

            expect(state.abstractText).to.equal("existing text");
        });

        it("should use publisher if contact is not available", async () => {
            const state = {
                    metaId: "portalId",
                    cswUrl: "test.de",
                    currentMasterportalVersionNumber: sinon.spy()
                },
                cswReturn = {
                    getTitle: () => "name",
                    getAbstract: () => "abstract",
                    getContact: () => null,
                    getPublisher: () => "publisher"
                };

            sinon.stub(getCswRecordById, "getRecordById").returns(cswReturn);

            await actions.initializeAboutInfo.call(state);

            expect(state.title).to.equal("name");
            expect(state.abstractText).to.equal("abstract");
            expect(state.contact).to.equal("publisher");
            expect(state.currentMasterportalVersionNumber.calledOnce).to.be.true;
        });
    });
});
