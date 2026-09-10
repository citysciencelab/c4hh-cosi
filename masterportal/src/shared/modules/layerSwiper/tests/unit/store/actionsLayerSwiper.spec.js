import sinon from "sinon";
import {expect} from "chai";
import actions from "@shared/modules/layerSwiper/store/actionsLayerSwiper.js";
import layerCollection from "@core/layers/js/layerCollection.js";

describe("actions", () => {
    let commit, dispatch, state, rootGetters, map;

    beforeAll(() => {
        mapCollection.clear();
        map = {
            id: "ol",
            mode: "2D",
            render: sinon.spy(),
            getSize: sinon.stub().returns([800, 600])
        };

        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        commit = sinon.spy();
        dispatch = sinon.spy();
        state = {
            valueX: 100,
            currentTimeSliderObject: {keyboardMovement: 5},
            active: true,
            targetLayerId: "123",
            sourceLayerId: "456"
        };
        rootGetters = {
            "Modules/WmsTime/TimeSlider/playing": false,
            "Maps/mode": "2D",
            "Modules/WmsTime/layerAppendix": "_appendix"
        };
        sinon.stub(layerCollection, "getLayerById").callsFake(id => ({
            id,
            getLayer: sinon.stub().returns({
                once: sinon.stub(),
                on: sinon.stub(),
                un: sinon.stub()
            })
        }));
    });

    it("should calculate new position and commit changes on pointermove", () => {
        const event = {
            type: "pointermove",
            pageX: 150
        };

        actions.moveSwiper({state, commit, dispatch}, event);

        expect(commit.firstCall.args[0]).to.equal("setLayerSwiperValueX");
        expect(commit.firstCall.args[1]).to.equal(150);
        expect(commit.secondCall.args[0]).to.equal("setLayerSwiperStyleLeft");
        expect(commit.secondCall.args[1]).to.equal(150);
        expect(dispatch.calledWith("updateMap")).to.be.true;
    });

    it("should calculate new position and commit changes on keydown right arrow", () => {
        const event = {
            type: "keydown",
            key: "ArrowRight"
        };

        actions.moveSwiper({state, commit, dispatch}, event);

        expect(commit.firstCall.args[0]).to.equal("setLayerSwiperValueX");
        expect(commit.firstCall.args[1]).to.equal(105);
        expect(commit.secondCall.args[0]).to.equal("setLayerSwiperStyleLeft");
        expect(commit.secondCall.args[1]).to.equal(105);
        expect(dispatch.calledWith("updateMap")).to.be.true;
    });

    it("should render map and handle layer prerender and postrender events", async () => {
        await actions.updateMap({state, rootGetters, dispatch});

        expect(map.render.called).to.be.true;
    });
});
