import {expect} from "chai";
import mutations from "../../../store/mutationsQuickResponseCode";

const {setEvtCoordinate} = mutations;

describe("addons/quickResponseCode/store/mutationsQuickResponseCode.js", () => {

    describe("setEvtCoordinate", () => {
        it("set the coordinate of a click event ", () => {
            const state = {
                    evtCoordinate: null
                },
                coordinate = [10, 20];

            setEvtCoordinate(state, {coordinate});

            expect(state.evtCoordinate.length).to.equals(2);
            expect(state.evtCoordinate).to.equals(coordinate);
        });
    });

});
