import Layer from "ol/layer/Vector.js";
import Source from "ol/source/Vector.js";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";

const
    statsFeatures = [
        new Feature({
            id: "statgebiet_1_bev",
            statgebiet: "Wolkenkuckucksheim",
            verwaltungseinheit: "statgebiete",
            stadtteil: "Eimsbüttel",
            bezirk: "Eimsbüttel",
            kategorie: "Bevölkerung insgesamt",
            jahr_2012: "3166",
            jahr_2013: "3196",
            jahr_2014: "3203",
            jahr_2015: "3218",
            jahr_2016: "3278",
            jahr_2017: "3377",
            jahr_2018: "3531",
            jahr_2019: "3582",
            jahr_2020: "3585",
            group: "Bevölkerung"
        }),
        new Feature({
            id: "statgebiet_1_alg",
            statgebiet: "Wolkenkuckucksheim",
            verwaltungseinheit: "statgebiete",
            stadtteil: "Eimsbüttel",
            bezirk: "Eimsbüttel",
            kategorie: "Arbeitslose insgesamt",
            jahr_2012: "166",
            jahr_2013: "196",
            jahr_2014: "203",
            jahr_2015: "218",
            jahr_2016: "278",
            jahr_2017: "377",
            jahr_2018: "531",
            jahr_2019: "582",
            jahr_2020: "585",
            group: "Arbeitslose"
        }),
        new Feature({
            id: "statgebiet_1_proz_alg",
            statgebiet: "Wolkenkuckucksheim",
            verwaltungseinheit: "statgebiete",
            stadtteil: "Eimsbüttel",
            bezirk: "Eimsbüttel",
            kategorie: "Anteil der Arbeitslosen",
            jahr_2012: "5.2",
            jahr_2013: "6.1",
            jahr_2014: "6.3",
            jahr_2015: "6.8",
            jahr_2016: "8.5",
            jahr_2017: "11.16",
            jahr_2018: "15.0",
            jahr_2019: "16.2",
            jahr_2020: "16.3",
            group: "Arbeitslose"
        })
    ],
    feature = new Feature({
        id: "123",
        statgebiet: "Wolkenkuckucksheim",
        geometry: new Polygon([
            [
                [
                    10.051116943359375,
                    53.592504809039376
                ],
                [
                    10.030517578125,
                    53.53214572511981
                ],
                [
                    10.136260986328125,
                    53.528880618043225
                ],
                [
                    10.139007568359375,
                    53.585168439492456
                ],
                [
                    10.051116943359375,
                    53.592504809039376
                ]
            ]
        ])
    }),
    layer = new Layer({
        source: new Source({
            features: [feature]
        })
    }),
    district = {
        "adminFeature": feature,
        "statFeatures": statsFeatures,
        "originalStatFeatures": statsFeatures,
        "isSelected": true,
        getId: () => "123",
        getName: () => "Wolkenkuckucksheim",
        getLabel: () => "Wolkenkuckucksheim (Statgebiet)",
        getReferencDistrictName: () => "Eimsbüttel"
    },
    refStatsFeatures = [
        new Feature({
            id: "stadtteil_1_bev",
            verwaltungseinheit: "stadtteile",
            stadtteil: "Eimsbüttel",
            bezirk: "Eimsbüttel",
            kategorie: "Bevölkerung insgesamt",
            jahr_2012: "31660",
            jahr_2013: "31960",
            jahr_2014: "32030",
            jahr_2015: "32180",
            jahr_2016: "32780",
            jahr_2017: "33770",
            jahr_2018: "35310",
            jahr_2019: "35820",
            jahr_2020: "35850",
            group: "Bevölkerung"
        }),
        new Feature({
            id: "stadtteil_1_alg",
            verwaltungseinheit: "stadtteile",
            stadtteil: "Eimsbüttel",
            bezirk: "Eimsbüttel",
            kategorie: "Arbeitslose insgesamt",
            jahr_2012: "1660",
            jahr_2013: "1960",
            jahr_2014: "2030",
            jahr_2015: "2180",
            jahr_2016: "2780",
            jahr_2017: "3770",
            jahr_2018: "5310",
            jahr_2019: "5820",
            jahr_2020: "5850",
            group: "Arbeitslose"
        }),
        new Feature({
            id: "stadtteil_1_proz_alg",
            verwaltungseinheit: "stadtteile",
            stadtteil: "Eimsbüttel",
            bezirk: "Eimsbüttel",
            kategorie: "Anteil der Arbeitslosen",
            jahr_2012: "5.2",
            jahr_2013: "6.1",
            jahr_2014: "6.3",
            jahr_2015: "6.8",
            jahr_2016: "8.5",
            jahr_2017: "11.16",
            jahr_2018: "15.0",
            jahr_2019: "16.2",
            jahr_2020: "16.3",
            group: "Arbeitslose"
        })
    ],
    refFeature = new Feature({
        id: "456",
        stadtteil_name: "Eimsbüttel",
        geometry: new Polygon([
            [
                [
                    10.03944396972656,
                    53.61409894623015
                ],
                [
                    10.00648498535156,
                    53.51704249452471
                ],
                [
                    10.17059326171875,
                    53.51745076075354
                ],
                [
                    10.15274047851563,
                    53.59413494042568
                ],
                [
                    10.03944396972656,
                    53.61409894623015
                ]
            ]
        ])
    }),
    refLayer = new Layer({
        source: new Source({
            features: [refFeature]
        })
    }),
    refDistrict = {
        "adminFeature": refFeature,
        "statFeatures": refStatsFeatures,
        "originalStatFeatures": refStatsFeatures,
        "isSelected": false,
        getId: () => "456",
        getName: () => "Eimsbüttel",
        getLabel: () => "Eimsbüttel",
        getReferencDistrictName: () => null
    },
    refDistrictLevel = {
        "layerId": "1694",
        "label": "Stadtteile",
        "keyOfAttrName": "stadtteil_name",
        "stats": {
            "keyOfAttrName": "stadtteil",
            "baseUrl": ["https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Stadtteile", "https://geodienste.hamburg.de/HH_WFS_Bevoelkerungsprognosen_Stadtteile"],
            "metadataUrls": ["http://hmdk.fhhnet.stadt.hamburg.de/trefferanzeige?docuuid=F4062BD8-43C4-4C4F-AA45-253D84A3685E"]
        },
        "referenceLevel": null,
        "layer": refLayer,
        "nameList": [
            "Eimsbüttel"
        ],
        "propertyNameList": [
            []
        ],
        "featureTypes": [
            []
        ],
        "districts": [
            refDistrict
        ]
    },
    districtLevel = {
        "layerId": "6071",
        "label": "Statistische Gebiete",
        "keyOfAttrName": "statgebiet",
        "stats": {
            "keyOfAttrName": "statgebiet",
            "baseUrl": ["https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Statistische_Gebiete"],
            "metadataUrls": ["http://hmdk.fhhnet.stadt.hamburg.de/trefferanzeige?docuuid=99687398-CFFE-413E-B966-6B8629D335F5"]
        },
        "referenceLevel": refDistrictLevel,
        "layer": layer,
        "nameList": [
            "Wolkenkuckucksheim"
        ],
        "propertyNameList": [
            []
        ],
        "featureTypes": [
            []
        ],
        "districts": [
            district
        ]
    };

export default districtLevel;

