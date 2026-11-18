import {expect} from "chai";

import mutations from "@modules/draw/store/mutationsDraw.js";

describe("src/modules/draw/store/mutationsDraw.js", () => {
    describe("applyDrawTypeStyle", () => {
        it("positive: merges the given style parts into the state", () => {
            const state = {
                circleOptions: {innerRadius: 100, unit: "m"},
                currentLayout: {strokeWidth: 1, text: ""},
                currentLayoutOuterCircle: {strokeWidth: 1}
            };

            mutations.applyDrawTypeStyle(state, {
                circleOptions: {unit: "km"},
                currentLayout: {strokeWidth: 5},
                currentLayoutOuterCircle: {strokeWidth: 3}
            });

            expect(state.circleOptions).to.deep.equal({innerRadius: 100, unit: "km"});
            expect(state.currentLayout).to.deep.equal({strokeWidth: 5, text: ""});
            expect(state.currentLayoutOuterCircle).to.deep.equal({strokeWidth: 3});
        });

        it("negative: leaves style parts untouched that are not given", () => {
            const state = {
                circleOptions: {unit: "m"},
                currentLayout: {strokeWidth: 1},
                currentLayoutOuterCircle: {strokeWidth: 1}
            };

            mutations.applyDrawTypeStyle(state, {currentLayout: {strokeWidth: 2}});

            expect(state.currentLayout).to.deep.equal({strokeWidth: 2});
            expect(state.circleOptions).to.deep.equal({unit: "m"});
            expect(state.currentLayoutOuterCircle).to.deep.equal({strokeWidth: 1});
        });
    });
});
