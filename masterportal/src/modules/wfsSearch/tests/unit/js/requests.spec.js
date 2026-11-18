import {expect} from "chai";
import axios from "axios";
import sinon from "sinon";
import requestsModule from "@modules/wfsSearch/js/requests.js";

describe("src/modules/wfsSearch/js/requests.js", () => {
    describe("searchFeatures", () => {
        let store, currentInstance, service;

        beforeEach(() => {
            currentInstance = {literals: [], requestConfig: {layerId: "testLayer"}};
            store = {
                getters: {
                    "Maps/projectionCode": "EPSG:4326",
                    "Modules/WfsSearch/currentInstance": currentInstance,
                    allLayerConfigs: []
                },
                dispatch: sinon.spy()
            };
            service = {url: "https://getwfs.de", typeName: "testFeature", dataProjection: "EPSG:3857"};
            sinon.stub(axios, "get").resolves({
                status: 200,
                statusText: "OK",
                data: `<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs"
                    xmlns:gml="http://www.opengis.net/gml" xmlns:test="http://example.com/test">
                    <gml:featureMember>
                        <test:testFeature gml:id="testFeature.1">
                            <test:geometry>
                                <gml:Point srsName="EPSG:3857">
                                    <gml:pos>1113194.9079327357 0</gml:pos>
                                </gml:Point>
                            </test:geometry>
                        </test:testFeature>
                    </gml:featureMember>
                </wfs:FeatureCollection>`
            });
        });

        it("should transform geometries from the configured data projection to the portal CRS", async () => {
            const features = await requestsModule.searchFeatures(store, currentInstance, service),
                coordinates = features[0].getGeometry().getCoordinates();

            expect(features).to.have.lengthOf(1);
            expect(coordinates[0]).to.be.closeTo(10, 0.000001);
            expect(coordinates[1]).to.be.closeTo(0, 0.000001);
            expect(store.dispatch.called).to.be.false;
        });

        it("should keep portal coordinates unchanged when no data projection is configured", async () => {
            delete service.dataProjection;
            store.getters["Maps/projectionCode"] = "EPSG:3857";

            const features = await requestsModule.searchFeatures(store, currentInstance, service);

            expect(features).to.have.lengthOf(1);
            expect(features[0].getGeometry().getCoordinates()).to.deep.equal([1113194.9079327357, 0, 0]);
        });
    });

    describe("createUrl", () => {
        it("createUrl should respect questionmark in given url", () => {
            const url = "https://mapservice.regensburg.de/cgi-bin/mapserv?map=wfs.map",
                typeName = "featureType",
                featureNS = "featureNS",
                featurePrefix = "featurePrefix",
                filter = "filter=filter",
                fromServicesJson = true,
                storedQueryId = "storedQueryId",
                maxFeatures = 10,
                createdUrl = decodeURI(requestsModule.createUrl(url, typeName, featureNS, featurePrefix, filter, fromServicesJson, storedQueryId, maxFeatures)),
                expectedUrl = "https://mapservice.regensburg.de/cgi-bin/mapserv?map=wfs.map&service=WFS&request=GetFeature&typeName=featureType&maxFeatures=10&version=2.0.0&StoredQuery_ID=storedQueryId&filter=filter";

            expect(createdUrl).to.eql(expectedUrl);
        });
        it("createUrl with usual url given", () => {
            const url = "https://getwfs.de",
                typeName = "typeName",
                featureNS = "featureNS",
                featurePrefix = "featurePrefix",
                filter = "filter=filter",
                fromServicesJson = true,
                storedQueryId = "storedQueryId",
                maxFeatures = 10,
                featureType = "featureType",
                createdUrl = decodeURI(requestsModule.createUrl(url, typeName, featureNS, featurePrefix, filter, fromServicesJson, storedQueryId, maxFeatures, featureType)),
                expectedUrl = "https://getwfs.de/?service=WFS&request=GetFeature&typeName=featureType&maxFeatures=10&version=2.0.0&StoredQuery_ID=storedQueryId&filter=filter";

            expect(createdUrl).to.eql(expectedUrl);
        });
        it("createUrl not from servicesJson", () => {
            const url = "https://getwfs.de",
                typeName = "typeName",
                featureNS = "featureNS",
                featurePrefix = "featurePrefix",
                filter = "filter=filter",
                fromServicesJson = false,
                storedQueryId = "storedQueryId",
                maxFeatures = 10,
                featureType = "featureType",
                createdUrl = decodeURI(requestsModule.createUrl(url, typeName, featureNS, featurePrefix, filter, fromServicesJson, storedQueryId, maxFeatures, featureType)),
                expectedUrl = "https://getwfs.de/?maxFeatures=10&version=2.0.0&StoredQuery_ID=storedQueryId&filter=filter";

            expect(createdUrl).to.eql(expectedUrl);
        });
        it("createUrl maxFeatures is 'showAll' and storedFilter", () => {
            const url = "https://getwfs.de",
                typeName = "typeName",
                featureNS = "featureNS",
                featurePrefix = "featurePrefix",
                filter = "&filter=filter&neu=neu",
                fromServicesJson = false,
                storedQueryId = "storedQueryId",
                maxFeatures = "showAll",
                featureType = "featureType",
                createdUrl = decodeURI(requestsModule.createUrl(url, typeName, featureNS, featurePrefix, filter, fromServicesJson, storedQueryId, maxFeatures, featureType)),
                expectedUrl = "https://getwfs.de/?version=2.0.0&StoredQuery_ID=storedQueryId&filter=filter&neu=neu";

            expect(createdUrl).to.eql(expectedUrl);
        });
        it("createUrl maxFeatures is 'showAll' and xmlFilter", () => {
            const url = "https://getwfs.de",
                typeName = "typeName",
                featureNS = "featureNS",
                featurePrefix = null,
                filter = "filter",
                fromServicesJson = false,
                storedQueryId = null,
                maxFeatures = "showAll",
                featureType = "featureType",
                createdUrl = requestsModule.createUrl(url, typeName, featureNS, featurePrefix, filter, fromServicesJson, storedQueryId, maxFeatures, featureType),
                expectedUrlParam = "<ogc:Filter xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:gml=\"http://www.opengis.net/gml\">filter</ogc:Filter>";

            expect(createdUrl.origin).to.eql(url);
            expect(createdUrl.searchParams.get("filter")).to.eql(expectedUrlParam);
            expect(createdUrl.searchParams.get("version")).to.eql("1.1.0");
        });
        it("createUrl uses fallback for filter when featurePrefix and featureNS are not given", () => {
            const url = "https://getwfs.de",
                typeName = "typeName",
                featureNS = null,
                featurePrefix = null,
                filter = "filter",
                fromServicesJson = false,
                storedQueryId = null,
                maxFeatures = 10,
                featureType = "featureType",
                createdUrl = requestsModule.createUrl(url, typeName, featureNS, featurePrefix, filter, fromServicesJson, storedQueryId, maxFeatures, featureType),
                expectedUrlParam = "<ogc:Filter xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:gml=\"http://www.opengis.net/gml\">filter</ogc:Filter>";

            expect(createdUrl.searchParams.get("filter")).to.eql(expectedUrlParam);
        });
        it("createUrl uses featurePrefix and featureNS for filter when given", () => {
            const url = "https://getwfs.de",
                typeName = "typeName",
                featureNS = "featureNS",
                featurePrefix = "featurePrefix",
                filter = "filter",
                fromServicesJson = false,
                storedQueryId = null,
                maxFeatures = 10,
                featureType = "featureType",
                createdUrl = requestsModule.createUrl(url, typeName, featureNS, featurePrefix, filter, fromServicesJson, storedQueryId, maxFeatures, featureType),
                expectedUrlParam = "<ogc:Filter xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:featurePrefix=\"featureNS\">filter</ogc:Filter>";

            expect(createdUrl.searchParams.get("filter")).to.eql(expectedUrlParam);
        });
    });
});
