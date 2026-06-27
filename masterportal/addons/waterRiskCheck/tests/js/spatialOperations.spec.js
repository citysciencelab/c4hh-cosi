import {expect} from "chai";
import spatialOperations from "../../js/spatialOperations.js";


const buildingFeatures = [
        {
            "type": "Feature",
            "id": 316452,
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [
                            9.966927792685999,
                            53.571173630336546
                        ],
                        [
                            9.966815541847277,
                            53.57122851620633
                        ],
                        [
                            9.966637310502461,
                            53.57109925737904
                        ],
                        [
                            9.966740600840307,
                            53.571048776759405
                        ],
                        [
                            9.966812742315584,
                            53.57110115655929
                        ],
                        [
                            9.966821873923417,
                            53.57109697481007
                        ],
                        [
                            9.966927792685999,
                            53.571173630336546
                        ]
                    ]
                ]
            },
            "properties": {
                "oid": "DEHHALKA7Li0000SBL",
                "aktualit": "2022-01-07Z",
                "gebnutzbez": "Gebaeude",
                "funktion": "Wohnhaus",
                "gfkzshh": "31001_1010",
                "anzahlgs": 5,
                "gmdschl": "02000000",
                "lagebeztxt": "Felix-Dahn-Straße 10"
            }
        },
        {
            "type": "Feature",
            "id": 317575,
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [
                    [
                        [
                            [
                                9.96712783064036,
                                53.57106988089654
                            ],
                            [
                                9.96713262140798,
                                53.571073347850955
                            ],
                            [
                                9.966927792685999,
                                53.571173630336546
                            ],
                            [
                                9.966821873923417,
                                53.57109697481007
                            ],
                            [
                                9.966864805357211,
                                53.571075701567075
                            ],
                            [
                                9.966855103076343,
                                53.571068768612676
                            ],
                            [
                                9.9669029769714,
                                53.57104503738308
                            ],
                            [
                                9.966912679254573,
                                53.57105197033359
                            ],
                            [
                                9.967211106089701,
                                53.57090404480271
                            ],
                            [
                                9.9672636553028,
                                53.570942263361715
                            ],
                            [
                                9.9673118743874,
                                53.570977343816566
                            ],
                            [
                                9.96712783064036,
                                53.57106988089654
                            ]
                        ]
                    ]
                ]
            },
            "properties": {
                "oid": "DEHHALKAV0000XAJBL",
                "aktualit": "2022-01-07Z",
                "gebnutzbez": "Gebaeude",
                "funktion": "Wohnhaus",
                "gfkzshh": "31001_1010",
                "anzahlgs": 5,
                "gmdschl": "02000000",
                "lagebeztxt": "Felix-Dahn-Straße 6, 8"
            }
        },
        {
            "type": "Feature",
            "id": 339693,
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [
                    [
                        [
                            [
                                9.9672636553028,
                                53.570942263361715
                            ],
                            [
                                9.967211106089701,
                                53.57090404480271
                            ],
                            [
                                9.967141664678444,
                                53.57085352209972
                            ],
                            [
                                9.967267960779797,
                                53.570790800845806
                            ],
                            [
                                9.967261006471789,
                                53.570785832259915
                            ],
                            [
                                9.967560755521397,
                                53.57063708614279
                            ],
                            [
                                9.967567709634531,
                                53.57064204572401
                            ],
                            [
                                9.967696575560815,
                                53.57057817061796
                            ],
                            [
                                9.967814847113377,
                                53.570664730129145
                            ],
                            [
                                9.967830574912854,
                                53.57065711509262
                            ],
                            [
                                9.967851461900231,
                                53.57067240708033
                            ],
                            [
                                9.967835764295973,
                                53.570680021875255
                            ],
                            [
                                9.96768886682035,
                                53.570751153250505
                            ],
                            [
                                9.96767721126029,
                                53.570742672087455
                            ],
                            [
                                9.967368336694106,
                                53.570893892336684
                            ],
                            [
                                9.96736589560476,
                                53.5708921412559
                            ],
                            [
                                9.9672636553028,
                                53.570942263361715
                            ]
                        ]
                    ]
                ]
            },
            "properties": {
                "oid": "DEHHALKAV0000XuMBL",
                "aktualit": "2022-01-07Z",
                "gebnutzbez": "Gebaeude",
                "funktion": "Wohnhaus",
                "gfkzshh": "31001_1010",
                "anzahlgs": 5,
                "gmdschl": "02000000",
                "lagebeztxt": "Felix-Dahn-Straße 2, 4"
            }
        }
    ],
    parcelFeature = {
        "type": "Feature",
        "id": 77515,
        "geometry": {
            "type": "MultiPolygon",
            "coordinates": [
                [
                    [
                        [
                            9.967436445793066,
                            53.571067969689565
                        ],
                        [
                            9.96695113310666,
                            53.57130903983572
                        ],
                        [
                            9.96657523063028,
                            53.571040423016385
                        ],
                        [
                            9.967064990809352,
                            53.57079774536198
                        ],
                        [
                            9.967436445793066,
                            53.571067969689565
                        ]
                    ]
                ]
            ]
        },
        "properties": {
            "oid": "DEHHALKAV00007uYFL",
            "aktualit": "2022-01-07Z",
            "idflurst": "DEHHALKAV00007uY",
            "flaeche": 1645.0,
            "flstkennz": "020303___02988______",
            "land": "Hamburg",
            "landschl": "02",
            "gemarkung": "Eimsbüttel",
            "gemaschl": "020303",
            "flurschl": "020303___",
            "flstnrzae": "2988",
            "regbezirk": "Hamburg",
            "regbezschl": "020",
            "kreis": "Hamburg",
            "kreisschl": "02000",
            "gemeinde": "Hamburg",
            "gmdschl": "02000000",
            "lagebeztxt": "Felix-Dahn-Straße 6, 8, 10",
            "tntxt": "Wohnbauflaeche; 1645"
        }
    };

describe("addons/waterRiskCheck/js/spatialOperations.js", () => {
    describe("getUnbuiltArea", () => {
        it("should return the passed parcelFeature", () => {
            const unbuiltArea = spatialOperations.getUnbuiltArea(parcelFeature, []);

            expect(unbuiltArea).to.deep.equal(parcelFeature);
        });
        it("should not return the passed parcelFeature", () => {
            const unbuiltArea = spatialOperations.getUnbuiltArea(parcelFeature, buildingFeatures);

            expect(unbuiltArea).to.not.equal(parcelFeature);
        });
    });

    describe("buffer", () => {
        it("should return a different geometry", () => {
            const bufferedFeatures = spatialOperations.buffer(buildingFeatures, 2);

            expect(bufferedFeatures[0].geometry.coordinates).to.not.equal(buildingFeatures[0].geometry.coordinates);
        });

        it("should return an empty array", () => {
            const bufferedPolygon = spatialOperations.buffer([], 5);

            expect(bufferedPolygon).to.be.an("array").an.to.be.empty;
        });

        it("should return the passed geometry if radius is 0", () => {
            const bufferedFeatures = spatialOperations.buffer(buildingFeatures, 0);

            expect(bufferedFeatures[0].geometry).to.deep.equal(buildingFeatures[0].geometry);
        });
    });

    describe("findPointInPolygonsByHighestValue", () => {
        it("should return the first param if the first param is not an array", () => {
            expect(spatialOperations.findPointInPolygonsByHighestValue()).to.be.undefined;
            expect(spatialOperations.findPointInPolygonsByHighestValue(null)).to.be.null;
        });
        it("should return the first param if the second is not an array", () => {
            expect(spatialOperations.findPointInPolygonsByHighestValue([])).to.be.an("array").that.is.empty;
        });
    });
});
