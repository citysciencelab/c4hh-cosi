import {expect} from "chai";
import Feature from "ol/Feature.js";
import {Polygon} from "ol/geom.js";
import {mount} from "@vue/test-utils";
import sinon from "sinon";
import PolygonInput from "../../../../../components/shared/components/PolygonInput.vue";

describe("addons/simulationTool/components/shared/components/PolygonInput.vue", () => {
    let map, originalMapCollection, wrapper;

    beforeEach(() => {
        map = {
            addInteraction: sinon.spy(),
            addLayer: sinon.spy(),
            removeInteraction: sinon.spy(),
            removeLayer: sinon.spy()
        };
        originalMapCollection = globalThis.mapCollection;
        globalThis.mapCollection = {
            getMap: sinon.stub().returns(map)
        };
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
            wrapper = null;
        }
        globalThis.mapCollection = originalMapCollection;
    });

    it("renders the label and draw button, and disables drawing when requested", () => {
        wrapper = mount(PolygonInput, {
            props: {
                disabled: true,
                id: "site-area",
                label: "Site area"
            }
        });

        expect(wrapper.find("h5").text()).to.equal("Site area");
        expect(wrapper.find("#site-area-draw-button").element.disabled).to.be.true;
        expect(map.addLayer.calledOnceWith(wrapper.vm.drawLayer)).to.be.true;
    });

    it("formats the area of the provided polygon", () => {
        wrapper = mount(PolygonInput, {
            props: {
                dataProjection: "EPSG:4326",
                featureProjection: "EPSG:4326",
                id: "site-area",
                label: "Site area",
                value: {
                    type: "Polygon",
                    coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
                }
            }
        });

        expect(wrapper.vm.displayValue).to.contain("km²");
        expect(wrapper.vm.displayValue).not.to.equal("");
        expect(wrapper.vm.drawLayer.getSource().getFeatures()).to.have.lengthOf(1);
    });

    it("starts drawing once and emits the drawn polygon as GeoJSON", () => {
        wrapper = mount(PolygonInput, {
            props: {
                dataProjection: "EPSG:4326",
                featureProjection: "EPSG:4326",
                id: "site-area",
                label: "Site area"
            }
        });

        wrapper.vm.startDrawing();
        const interaction = wrapper.vm.drawInteraction;

        wrapper.vm.startDrawing();
        expect(map.addInteraction.calledOnceWith(interaction)).to.be.true;
        expect(wrapper.vm.isDrawing).to.be.true;

        const geometry = new Polygon([[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]);

        interaction.dispatchEvent({
            type: "drawend",
            feature: new Feature({geometry})
        });

        expect(wrapper.emitted("update:value")[0][0]).to.deep.equal({
            type: "Polygon",
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
        });
        expect(map.removeInteraction.calledOnceWith(interaction)).to.be.true;
        expect(wrapper.vm.isDrawing).to.be.false;
    });

    it("does not start drawing when the map is unavailable", () => {
        globalThis.mapCollection.getMap.returns(null);
        wrapper = mount(PolygonInput, {
            props: {
                id: "site-area",
                label: "Site area"
            }
        });

        wrapper.vm.startDrawing();

        expect(wrapper.vm.drawInteraction).to.equal(null);
        expect(wrapper.vm.isDrawing).to.be.false;
        expect(map.addInteraction.called).to.be.false;
    });
});
