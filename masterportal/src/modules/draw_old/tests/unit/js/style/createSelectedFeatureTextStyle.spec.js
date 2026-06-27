import {expect} from "chai";
import {createSelectedFeatureTextStyle} from "@modules/draw_old/js/style/createSelectedFeatureTextStyle.js";
import Feature from "ol/Feature.js";
import {Text} from "ol/style.js";

describe("src/modules/draw/js/style/createSelectedFeatureTextStyle.js", () => {
    describe("createSelectedFeatureTextStyle", () => {
        it("the result should be an instance of Text", () => {
            const feature = new Feature(),
                result = createSelectedFeatureTextStyle(feature);

            expect(result instanceof Text).to.be.true;
        });
    });
});
