import Scenario from "../../../../ScenarioBuilder/classes/Scenario";
import Layer from "ol/layer/Vector.js";
import Source from "ol/source/Vector.js";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import district from "./mock.district";


const simFeature = new Scenario(
        new Feature({
            schulname: "feature 1",
            anzahl_schueler: 42,
            adresse_strasse_hausnr: "Hauptstraße",
            adresse_ort: "Hamburg",
            kapitelbezeichnung: "Grundschule",
            geometry: new Point([
                10.086822509765625,
                53.55825752009741
            ])
        }),
        new Layer({
            id: "1234",
            source: new Source()
        })
    ),
    simNeighborhood = new Scenario(
        new Feature({
            geometry: new Polygon([
                [
                    [
                        10.03120422363282,
                        53.55774767833318
                    ],
                    [
                        10.031547546386726,
                        53.55060924848581
                    ],
                    [
                        10.04768371582032,
                        53.55081322033721
                    ],
                    [
                        10.044593811035163,
                        53.56131644165769
                    ],
                    [
                        10.03120422363282,
                        53.55774767833318
                    ]
                ]
            ]),
            baseStats: {
                reference: {},
                absolute: [],
                relative: []
            },
            name: "Mein Wohnquartier",
            area: 100,
            residents: 100,
            avgHouseholdSize: 2.5,
            housingUnits: 0,
            gfz: 1.0,
            populationDensity: 5000,
            livingSpace: 30,
            stats: [],
            year: new Date().toISOString().substring(0, 7)
        }),
        [district],
        new Layer({
            id: "neighborhoods",
            source: new Source()
        })
    ),
    scenario = new Scenario(
        "New Szenario",
        new Layer({
            id: "guidelayer",
            source: new Source()
        }),
        {
            simulatedFeatures: [simFeature],
            neighborhoods: [simNeighborhood]
        }
    );

export default scenario;

