import {expect} from "chai";
import sinon from "sinon";
import layerFactory from "@core/layers/js/layerFactory.js";
import Layer3dGroup from "@core/layers/js/layer3dGroup.js";

describe("src/core/js/layers/Layer3dGroup.js", () => {
    let warn,
        attributes,
        layerTileSet3D,
        layerTileSet3D2,
        layerFactorySpy,
        setVisibleSpy,
        updateLayerValuesStub;

    beforeEach(() => {
        setVisibleSpy = sinon.spy();
        warn = sinon.spy();
        updateLayerValuesStub = sinon.stub();
        sinon.stub(console, "warn").callsFake(warn);
        layerFactorySpy = sinon.stub(layerFactory, "createLayer")
            .callsFake((props) => {
                return {
                    attributes: props,
                    setVisible: setVisibleSpy,
                    updateLayerValues: updateLayerValuesStub
                };
            });
        layerTileSet3D = {
            id: "1",
            name: "layerTileSet3D",
            typ: "TileSet3D"
        };
        layerTileSet3D2 = {
            id: "2",
            name: "layerTileSet3D2",
            typ: "TileSet3D"
        };
        attributes = {
            id: "1,2",
            name: "groupLayer",
            typ: "GROUP3D",
            children: [
                layerTileSet3D,
                layerTileSet3D2
            ]
        };
    });


    describe("createLayer", () => {
        it("new Layer3dGroup without children shall call warn", () => {
            attributes.children = undefined;
            const groupLayer = new Layer3dGroup(attributes, layerFactory);

            expect(groupLayer).not.to.be.undefined;
            expect(warn.calledOnce).to.be.true;
        });
        it("new Layer3dGroup with attributes should create an layer with 2 grouped layers in source", () => {
            const groupLayer = new Layer3dGroup(attributes, layerFactory);

            expect(groupLayer).not.to.be.undefined;
            expect(typeof groupLayer.getLayer()).to.be.equals("object");
            expect(warn.notCalled).to.be.true;
            expect(layerFactorySpy.calledTwice).to.be.true;
            expect(layerFactorySpy.firstCall.args[0]).to.include(layerTileSet3D);
            expect(layerFactorySpy.firstCall.args[1]).to.be.deep.equals("3D");
            expect(layerFactorySpy.secondCall.args[0]).to.include(layerTileSet3D2);
            expect(layerFactorySpy.secondCall.args[1]).to.be.deep.equals("3D");
            expect(groupLayer.getLayer().getSource().length).to.be.equals(2);
        });
        it("should pass the visibility attribute to children", () => {
            const attrsWithVisibility = {
                    ...attributes,
                    visibility: true
                },
                groupLayer = new Layer3dGroup(attrsWithVisibility, layerFactory);

            expect(groupLayer.getLayerSource()[0].attributes.visibility).to.be.true;
            expect(groupLayer.getLayerSource()[1].attributes.visibility).to.be.true;
        });
    });

    describe("updateLayerValues", () => {
        it("should update the values of the group", () => {
            const groupLayer = new Layer3dGroup(attributes, layerFactory);

            groupLayer.updateLayerValues({
                ...attributes,
                visibility: false
            });
            // called for each layer in group
            expect(setVisibleSpy.calledTwice).to.be.true;
        });
        it("should update the visibility of children", () => {
            const groupLayer = new Layer3dGroup(attributes, layerFactory);

            groupLayer.updateLayerValues(attributes);
            // called for each layer in group
            expect(updateLayerValuesStub.calledTwice).to.be.true;
        });
    });

    describe("setLayerSource", () => {
        it("setLayerSource shall be called on creation", () => {
            const groupLayer = new Layer3dGroup(attributes, layerFactory);

            expect(groupLayer).not.to.be.undefined;
            expect(typeof groupLayer.getLayer()).to.be.equals("object");
            expect(warn.notCalled).to.be.true;
            expect(groupLayer.layerSource.length).to.be.equals(2);
        });
    });

    describe("getLayerSource", () => {
        it("getLayerSource shall return 2 grouped layers", () => {
            const groupLayer = new Layer3dGroup(attributes, layerFactory);

            expect(groupLayer).not.to.be.undefined;
            expect(typeof groupLayer.getLayer()).to.be.equals("object");
            expect(warn.notCalled).to.be.true;
            expect(groupLayer.getLayerSource().length).to.be.equals(2);
        });
    });

});
