import {createPolygonStyle} from "../../js/createPolygonStyle.js";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import sinon from "sinon";

describe("addons/heavyRain/shared/js/createPolygonStyle.js", () => {
    it("should create a style with the color of the feature", () => {
        const style = createPolygonStyle(() => "#0055A4")(new Feature());

        expect(style.getFill().getColor()).to.deep.equal([0, 85, 164, 0.3]);
        expect(style.getStroke().getColor()).to.deep.equal([0, 85, 164, 1]);
        expect(style.getStroke().getWidth()).to.equal(2);
    });

    it("should pass the feature to the given color function", () => {
        const feature = new Feature(),
            getColor = sinon.stub().returns("#0055A4");

        createPolygonStyle(getColor)(feature);

        expect(getColor.calledOnceWith(feature)).to.be.true;
    });

    it("should reuse the style for features with the same color", () => {
        const styleFunction = createPolygonStyle(feature => feature.get("color")),
            firstStyle = styleFunction(new Feature({color: "#0055A4"})),
            secondStyle = styleFunction(new Feature({color: "#0055A4"})),
            thirdStyle = styleFunction(new Feature({color: "#D55E00"}));

        expect(firstStyle).to.equal(secondStyle);
        expect(firstStyle).to.not.equal(thirdStyle);
        expect(thirdStyle.getFill().getColor()).to.deep.equal([213, 94, 0, 0.3]);
    });
});
