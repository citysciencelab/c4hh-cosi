import {expect} from "chai";
import {CommuterApi} from "../../../utils/commuterApi.js";

describe("addons/commuterFlows/utils/commuterApi.js", () => {
    describe("CommuterApi.constructor", () => {
        it("should assign the given options to internal options plus default options", () => {
            const api = new CommuterApi({key1: "value1", key2: "value2"}),
                expected = {
                    useProxy: false,
                    blacklistedDistricts: [],
                    serviceUrl: "",
                    key1: "value1",
                    key2: "value2"
                };

            expect(api.options).to.deep.equal(expected);
        });
        it("should assign the given options and override default options", () => {
            const options = {
                    useProxy: true,
                    blacklistedDistricts: ["District 12"],
                    serviceUrl: "https://example.com"
                },
                api = new CommuterApi(options);

            expect(api.options).to.deep.equal(options);
        });
    });

    describe("parseResponseGetFeature", () => {
        const xmlText = `<?xml version='1.0' encoding='UTF-8'?>
<wfs:FeatureCollection xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd http://www.opengis.net/gml/3.2 http://schemas.opengis.net/gml/3.2.1/gml.xsd http://www.deegree.org/app https://geodienste.hamburg.de/MRH_WFS_Pendlerstroeme_im_Tool?SERVICE=WFS&amp;VERSION=2.0.0&amp;REQUEST=DescribeFeatureType&amp;OUTPUTFORMAT=application%2Fgml%2Bxml%3B+version%3D3.2&amp;TYPENAME=app:mrh_samtgemeinden&amp;NAMESPACES=xmlns(app,http%3A%2F%2Fwww.deegree.org%2Fapp)" xmlns:wfs="http://www.opengis.net/wfs/2.0" timeStamp="2021-03-12T06:35:50Z" xmlns:gml="http://www.opengis.net/gml/3.2" numberMatched="unknown" numberReturned="0">
    <wfs:member>
        <app:mrh_samtgemeinden xmlns:app="http://www.deegree.org/app" gml:id="APP_MRH_SAMTGEMEINDEN_City A">
            <app:kreis>District A</app:kreis>
            <app:gemeinde>City A</app:gemeinde>
        </app:mrh_samtgemeinden>
    </wfs:member>
    <wfs:member>
        <app:mrh_samtgemeinden xmlns:app="http://www.deegree.org/app" gml:id="APP_MRH_SAMTGEMEINDEN_City B">
            <app:kreis>District A</app:kreis>
            <app:gemeinde>City B</app:gemeinde>
        </app:mrh_samtgemeinden>
    </wfs:member>
</wfs:FeatureCollection>`,
            api = new CommuterApi(),
            parser = new DOMParser(),
            xmlDoc = parser.parseFromString(xmlText, "text/xml");

        it("should build an array with the received cities", () => {
            const result = api.parseResponseGetFeature(xmlDoc, "app:mrh_samtgemeinden", "app:gemeinde"),
                expected = ["City A", "City B"];

            expect(result).to.deep.equal(expected);
        });
        it("should use the blacklist to avoid given cities", () => {
            const result = api.parseResponseGetFeature(xmlDoc, "app:mrh_samtgemeinden", "app:gemeinde", ["City B"]),
                expected = ["City A"];

            expect(result).to.deep.equal(expected);
        });
    });

    describe("feature filter test", () => {
        const xmlText = `<?xml version='1.0' encoding='UTF-8'?>
<wfs:FeatureCollection xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd http://www.deegree.org/app https://geodienste.hamburg.de/MRH_WFS_Pendlerstroeme_im_Tool?SERVICE=WFS&amp;VERSION=1.1.0&amp;REQUEST=DescribeFeatureType&amp;OUTPUTFORMAT=text%2Fxml%3B+subtype%3Dgml%2F3.1.1&amp;TYPENAME=app:mrh_pendler_kreise&amp;NAMESPACE=xmlns(app=http%3A%2F%2Fwww.deegree.org%2Fapp)" xmlns:wfs="http://www.opengis.net/wfs" timeStamp="2021-03-12T06:52:26Z" xmlns:gml="http://www.opengis.net/gml">
  <gml:featureMember>
    <app:mrh_pendler_kreise xmlns:app="http://www.deegree.org/app" gml:id="APP_MRH_PENDLER_KREISE_4766">
      <app:wohnort>Harburg</app:wohnort>
      <app:arbeitsort>Lübeck</app:arbeitsort>
      <app:anzahl_einpendler>130</app:anzahl_einpendler>
      <app:richtung>einpendler</app:richtung>
      <app:geom_line>
        <!--Inlined geometry 'APP_MRH_PENDLER_KREISE_4766_APP_GEOM_LINE'-->
        <gml:LineString gml:id="APP_MRH_PENDLER_KREISE_4766_APP_GEOM_LINE" srsName="EPSG:25832">
          <gml:posList>560237.341 5907958.903 613555.131 5971711.650</gml:posList>
        </gml:LineString>
      </app:geom_line>
    </app:mrh_pendler_kreise>
  </gml:featureMember>
</wfs:FeatureCollection>`;

        describe("convertXmlToFeatureList", () => {
            it("should convert an xml string into an array of ol/Feature", () => {
                const api = new CommuterApi(),
                    features = api.convertXmlToFeatureList(xmlText, "mrh_pendler_kreise");

                expect(features).to.be.an("array").with.lengthOf(1);
                expect(features[0].get("wohnort")).to.equal("Harburg");
                expect(features[0].get("arbeitsort")).to.equal("Lübeck");
                expect(features[0].get("anzahl_einpendler")).to.equal("130");
                expect(features[0].get("richtung")).to.equal("einpendler");
                expect(features[0].getGeometry().getFirstCoordinate()).to.deep.equal([560237.341, 5907958.903, 0]);
                expect(features[0].getGeometry().getLastCoordinate()).to.deep.equal([613555.131, 5971711.650, 0]);
            });
        });
        describe("translateFeatureList", () => {
            it("should replace values with a generalization for commuter from home to work", () => {
                const api = new CommuterApi(),
                    features = api.convertXmlToFeatureList(xmlText, "mrh_pendler_kreise"),
                    result = api.translateFeatureList(features, "arbeitsort", "anzahl_einpendler", ["wohnort", "arbeitsort", "anzahl_einpendler", "richtung"], true);

                expect(result).to.be.an("array").with.lengthOf(1);
                expect(result[0].get("caption")).to.equal("Lübeck");
                expect(result[0].get("value")).to.equal(130);
                expect(result[0].get("coordinate")).to.deep.equal([613555.131, 5971711.650, 0]);
                expect(result[0].getGeometry().getFirstCoordinate()).to.deep.equal([560237.341, 5907958.903, 0]);
                expect(result[0].getGeometry().getLastCoordinate()).to.deep.equal([613555.131, 5971711.650, 0]);

                expect(result[0].get("wohnort")).to.be.undefined;
                expect(result[0].get("arbeitsort")).to.be.undefined;
                expect(result[0].get("anzahl_einpendler")).to.be.undefined;
                expect(result[0].get("richtung")).to.be.undefined;
            });
            it("should replace values with a generalization for commuter from work to home", () => {
                const api = new CommuterApi(),
                    features = api.convertXmlToFeatureList(xmlText, "mrh_pendler_kreise"),
                    result = api.translateFeatureList(features, "wohnort", "anzahl_einpendler", ["wohnort", "arbeitsort", "anzahl_einpendler", "richtung"], false);

                expect(result).to.be.an("array").with.lengthOf(1);
                expect(result[0].get("caption")).to.equal("Harburg");
                expect(result[0].get("value")).to.equal(130);
                expect(result[0].get("coordinate")).to.deep.equal([560237.341, 5907958.903, 0]);
                expect(result[0].getGeometry().getFirstCoordinate()).to.deep.equal([560237.341, 5907958.903, 0]);
                expect(result[0].getGeometry().getLastCoordinate()).to.deep.equal([613555.131, 5971711.650, 0]);

                expect(result[0].get("wohnort")).to.be.undefined;
                expect(result[0].get("arbeitsort")).to.be.undefined;
                expect(result[0].get("anzahl_einpendler")).to.be.undefined;
                expect(result[0].get("richtung")).to.be.undefined;
            });
        });
        describe("getCenterCoordinate", () => {
            it("should return the first coordinate of the first feature for commuter from home to work", () => {
                const api = new CommuterApi(),
                    features = api.convertXmlToFeatureList(xmlText, "mrh_pendler_kreise"),
                    result = api.getCenterCoordinate(features, true);

                expect(result).to.deep.equal([560237.341, 5907958.903, 0]);
            });
            it("should return the last coordinate of the first feature for commuter from work to home", () => {
                const api = new CommuterApi(),
                    features = api.convertXmlToFeatureList(xmlText, "mrh_pendler_kreise"),
                    result = api.getCenterCoordinate(features, false);

                expect(result).to.deep.equal([613555.131, 5971711.650, 0]);
            });
        });
        describe("getMaxValue", () => {
            it("should return the maximum value found in the given (translated) features", () => {
                const api = new CommuterApi(),
                    rawFeatures = api.convertXmlToFeatureList(xmlText, "mrh_pendler_kreise"),
                    features = api.translateFeatureList(rawFeatures, "arbeitsort", "anzahl_einpendler", ["wohnort", "arbeitsort", "anzahl_einpendler", "richtung"], false),
                    result = api.getMaxValue(features);

                expect(result).to.deep.equal(130);
            });
        });
        describe("getMinValue", () => {
            it("should return the minimum value found in the given (translated) features", () => {
                const api = new CommuterApi(),
                    rawFeatures = api.convertXmlToFeatureList(xmlText, "mrh_pendler_kreise"),
                    features = api.translateFeatureList(rawFeatures, "arbeitsort", "anzahl_einpendler", ["wohnort", "arbeitsort", "anzahl_einpendler", "richtung"], false),
                    result = api.getMinValue(features);

                expect(result).to.deep.equal(130);
            });
        });
        describe("removeBlacklistedFeatures", () => {
            it("should remove the blacklisted features from an existing feature list", () => {
                const api = new CommuterApi(),
                    rawFeatures = api.convertXmlToFeatureList(xmlText, "mrh_pendler_kreise"),
                    features = api.translateFeatureList(rawFeatures, "arbeitsort", "anzahl_einpendler", ["wohnort", "arbeitsort", "anzahl_einpendler", "richtung"], false),
                    result = api.removeBlacklistedFeatures(features, ["Lübeck"]);

                expect(result).to.be.an("array").and.to.be.empty;
            });
        });
    });

});
