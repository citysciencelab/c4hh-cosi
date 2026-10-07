import {createTransactionFeature, normalizeFeaturePrefix, sendWfstTransaction} from "../../js/sendWfstTransaction.js";
import {expect} from "chai";
import LineString from "ol/geom/LineString.js";
import MultiPolygon from "ol/geom/MultiPolygon.js";
import Polygon from "ol/geom/Polygon.js";
import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
import sinon from "sinon";
import wfs from "@masterportal/masterportalapi/src/layer/wfs";

describe("addons/heavyRain/shared/js/sendWfstTransaction.js", () => {
    const wfstAttributes = {
            comment: "beschreibung",
            name: "name",
            contactPerson: "ansprechpartner",
            creationDate: "eingabedatum"
        },
        wfstGeometryName = "geom";
    let formValues,
        geometry;

    beforeEach(() => {
        geometry = new Polygon([[[0, 0], [0, 1], [1, 1], [0, 0]]]);
        formValues = {
            name: "name",
            contactPerson: "contactPerson",
            creationDate: "2026-09-22",
            comment: ""
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("createTransactionFeature", () => {
        it("should set the geometry under the given geometry name", () => {
            const feature = createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName);

            expect(feature.getGeometryName()).to.equal("geom");
        });

        it("should convert a drawn polygon to a multi polygon, as the service allows multi polygons only", () => {
            const feature = createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName);

            expect(feature.getGeometry().getType()).to.equal("MultiPolygon");
            expect(feature.getGeometry().getCoordinates()).to.deep.equal([[[[0, 0], [0, 1], [1, 1], [0, 0]]]]);
        });

        it("should keep a geometry which already is a multi polygon", () => {
            geometry = new MultiPolygon([[[[0, 0], [0, 1], [1, 1], [0, 0]]]]);

            const feature = createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName);

            expect(feature.getGeometry().getType()).to.equal("MultiPolygon");
            expect(feature.getGeometry().getCoordinates()).to.deep.equal([[[[0, 0], [0, 1], [1, 1], [0, 0]]]]);
        });

        it("should throw for a geometry which is not an area, as the service allows multi polygons only", () => {
            geometry = new LineString([[0, 0], [0, 1]]);

            expect(() => createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName)).to.throw(/LineString/);
        });

        it("should set the filled in values under the given attribute names", () => {
            const feature = createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName);

            expect(feature.get("name")).to.equal("name");
            expect(feature.get("ansprechpartner")).to.equal("contactPerson");
            expect(feature.get("eingabedatum")).to.equal("2026-09-22");
        });

        it("should set the properties in the order of the given attributes with the geometry last", () => {
            formValues.comment = "comment";

            const keys = Object.keys(createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName).getProperties());

            expect(keys).to.deep.equal([
                "beschreibung",
                "name",
                "ansprechpartner",
                "eingabedatum",
                "geom"
            ]);
        });

        it("should not set attributes for values which were left out", () => {
            const feature = createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName);

            expect(feature.get("beschreibung")).to.be.undefined;
        });

        it("should ignore form values which have no attribute", () => {
            formValues.unknown = "unknown";

            const feature = createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName);

            expect(feature.get("unknown")).to.be.undefined;
        });

        it("should not prefix the attributes, as it is required for an insert", () => {
            const feature = createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName);

            Object.keys(feature.getProperties()).forEach(key => {
                expect(key).to.not.include(":");
            });
        });

        it("should not set an id for an insert", () => {
            expect(createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName).getId()).to.be.undefined;
        });

        describe("update", () => {
            const update = {featureId: "meldungen.42", featurePrefix: "de.hh.up"};

            it("should set the id of the edited feature", () => {
                expect(createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName, update).getId()).to.equal("meldungen.42");
            });

            it("should prefix the attributes and the geometry with the namespace in the order of the given attributes with the geometry last", () => {
                const keys = Object.keys(createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName, update).getProperties());

                expect(keys).to.deep.equal([
                    "de.hh.up:beschreibung",
                    "de.hh.up:name",
                    "de.hh.up:ansprechpartner",
                    "de.hh.up:eingabedatum",
                    "de.hh.up:geom"
                ]);
            });

            it("should set the filled in values under the prefixed attribute names", () => {
                const feature = createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName, update);

                expect(feature.get("de.hh.up:name")).to.equal("name");
                expect(feature.get("de.hh.up:eingabedatum")).to.equal("2026-09-22");
                expect(feature.getGeometry().getType()).to.equal("MultiPolygon");
                expect(feature.getGeometryName()).to.equal("de.hh.up:geom");
            });

            it("should set emptied values to null, so that the service removes them", () => {
                const feature = createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName, update);

                expect(feature.get("de.hh.up:beschreibung")).to.be.null;
            });

            it("should not prefix the attributes if the service has no namespace prefix", () => {
                const feature = createTransactionFeature(geometry, formValues, wfstAttributes, wfstGeometryName, {featureId: "meldungen.42"});

                expect(feature.get("name")).to.equal("name");
                expect(feature.getGeometryName()).to.equal("geom");
            });
        });
    });

    describe("normalizeFeaturePrefix", () => {
        it("should remove a trailing colon without changing the configuration of the layer", () => {
            const layerConfig = {id: "36013", featurePrefix: "app:"},
                normalized = normalizeFeaturePrefix(layerConfig);

            expect(normalized.featurePrefix).to.equal("app");
            expect(layerConfig.featurePrefix).to.equal("app:");
        });

        it("should keep a configuration which has no trailing colon", () => {
            const layerConfig = {id: "36013", featurePrefix: "app"};

            expect(normalizeFeaturePrefix(layerConfig)).to.equal(layerConfig);
        });

        it("should keep a configuration without a feature prefix", () => {
            const layerConfig = {id: "36013"};

            expect(normalizeFeaturePrefix(layerConfig)).to.equal(layerConfig);
        });
    });

    describe("sendWfstTransaction", () => {
        /**
         * Creates the options of the transaction.
         * @param {String} [featureId] the id of the edited feature.
         * @returns {Object} the options of the transaction.
         */
        function createOptions (featureId) {
            return {wfstId: "36013", projectionCode: "EPSG:25832", geometry, formValues, wfstAttributes, wfstGeometryName, featureId};
        }

        it("should send an insert transaction with the url and the config of the layer", async () => {
            const layerConfig = {id: "36013", url: "https://example.com/wfs", featureType: "meldungen"},
                sendTransactionStub = sinon.stub(wfs, "sendTransaction").resolves("feature");

            sinon.stub(rawLayerList, "getLayerWhere").returns(layerConfig);

            const result = await sendWfstTransaction(createOptions());

            expect(sendTransactionStub.calledOnce).to.be.true;
            expect(sendTransactionStub.firstCall.args[0]).to.equal("EPSG:25832");
            expect(sendTransactionStub.firstCall.args[1].getGeometryName()).to.equal("geom");
            expect(sendTransactionStub.firstCall.args[1].get("name")).to.equal("name");
            expect(sendTransactionStub.firstCall.args[2]).to.equal(layerConfig.url);
            expect(sendTransactionStub.firstCall.args[3]).to.equal(layerConfig);
            expect(sendTransactionStub.firstCall.args[4]).to.equal("insert");
            expect(result).to.equal("feature");
        });

        it("should send an update transaction with the prefixed attributes for an edited feature", async () => {
            const sendTransactionStub = sinon.stub(wfs, "sendTransaction").resolves("feature");

            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36013", url: "https://example.com/wfs", featurePrefix: "de.hh.up:"});

            await sendWfstTransaction(createOptions("meldungen.42"));

            expect(sendTransactionStub.firstCall.args[1].getId()).to.equal("meldungen.42");
            expect(sendTransactionStub.firstCall.args[1].get("de.hh.up:name")).to.equal("name");
            expect(sendTransactionStub.firstCall.args[4]).to.equal("selectedUpdate");
        });

        it("should send the feature prefix of the layer without a trailing colon", async () => {
            const layerConfig = {id: "36013", url: "https://example.com/wfs", featureType: "meldungen", featurePrefix: "app:"},
                sendTransactionStub = sinon.stub(wfs, "sendTransaction").resolves("feature");

            sinon.stub(rawLayerList, "getLayerWhere").returns(layerConfig);

            await sendWfstTransaction(createOptions());

            expect(sendTransactionStub.firstCall.args[3].featurePrefix).to.equal("app");
            expect(sendTransactionStub.firstCall.args[3].featureType).to.equal("meldungen");
        });

        it("should throw if the layer is not configured", async () => {
            const sendTransactionStub = sinon.stub(wfs, "sendTransaction");
            let error = null;

            sinon.stub(rawLayerList, "getLayerWhere").returns(undefined);

            try {
                await sendWfstTransaction(createOptions());
            }
            catch (e) {
                error = e;
            }

            expect(error).to.be.an("error");
            expect(sendTransactionStub.notCalled).to.be.true;
        });
    });
});
