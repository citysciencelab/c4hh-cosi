import {expect} from "chai";
import sinon from "sinon";

import actions from "@modules/draw/store/actionsDraw.js";

describe("src/modules/draw/store/actionsDraw.js", () => {
    describe("featureStyleChanged", () => {
        it("positive: does neither commit nor dispatch anything", () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            expect(actions.featureStyleChanged({commit, dispatch}, {key: "strokeWidth", value: 5})).to.be.undefined;
            expect(commit.notCalled).to.be.true;
            expect(dispatch.notCalled).to.be.true;
        });

        it("negative: does not throw without payload", () => {
            expect(() => actions.featureStyleChanged({commit: sinon.spy(), dispatch: sinon.spy()})).to.not.throw();
        });
    });

    describe("editActionPerformed", () => {
        it("positive: does neither commit nor dispatch anything", () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            expect(actions.editActionPerformed({commit, dispatch}, {action: "undo"})).to.be.undefined;
            expect(commit.notCalled).to.be.true;
            expect(dispatch.notCalled).to.be.true;
        });

        it("negative: does not throw without payload", () => {
            expect(() => actions.editActionPerformed({commit: sinon.spy(), dispatch: sinon.spy()})).to.not.throw();
        });
    });
});
