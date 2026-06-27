import {expect} from "chai";
import sortObjects from "@shared/js/utils/sortObjects.js";
import getters from "../../../store/gettersLayerTree.js";
import stateLayerTree from "../../../store/stateLayerTree.js";
import sinon from "sinon";

describe("src/modules/layerTree/store/gettersLayerTree.js", () => {
    let sortByLayerSequenceSpy,
        allLayerConfigs;

    beforeEach(() => {
        sortByLayerSequenceSpy = sinon.spy(sortObjects, "sortByLayerSequence");
        allLayerConfigs = [
            {
                id: "1",
                zIndex: 1
            },
            {
                id: "5",
                zIndex: 5
            },
            {
                id: "2",
                zIndex: 2
            }
        ];
    });


    describe("layerTreeSortedLayerConfigs", () => {
        it("layerTreeSortedLayerConfigs sortLayerSequence is false", () => {
            const rootGetters = {
                showLayerAddButton: false,
                allLayerConfigs
            };
            const sorted = getters.layerTreeSortedLayerConfigs(stateLayerTree, {}, {}, rootGetters)(false);

            expect(sorted.length).to.be.equals(3);
            expect(sorted[2].zIndex).to.be.equals(1);
            expect(sorted[1].zIndex).to.be.equals(2);
            expect(sorted[0].zIndex).to.be.equals(5);
            expect(sortByLayerSequenceSpy.notCalled).to.be.true;
        });

        it("layerTreeSortedLayerConfigs sortLayerSequence is true, but no layerSequence at layers", () => {
            const rootGetters = {
                showLayerAddButton: false,
                allLayerConfigs
            };
            const sorted = getters.layerTreeSortedLayerConfigs(stateLayerTree, {}, {}, rootGetters)(true);

            expect(sorted.length).to.be.equals(3);
            expect(sorted[2].zIndex).to.be.equals(1);
            expect(sorted[1].zIndex).to.be.equals(2);
            expect(sorted[0].zIndex).to.be.equals(5);
            expect(sortByLayerSequenceSpy.notCalled).to.be.true;
        });

        it("layerTreeSortedLayerConfigs sortLayerSequence is true, with layerSequence at layers", () => {
            const rootGetters = {
                showLayerAddButton: false,
                allLayerConfigs
            };

            allLayerConfigs[0].layerSequence = 1;
            const sorted = getters.layerTreeSortedLayerConfigs(stateLayerTree, {}, {}, rootGetters)(true);

            expect(sorted.length).to.be.equals(3);
            expect(sorted[0].zIndex).to.be.equals(2);
            expect(sorted[1].zIndex).to.be.equals(1);
            expect(sorted[2].zIndex).to.be.equals(0);
            expect(sortByLayerSequenceSpy.calledOnce).to.be.true;
        });
    });


});
