import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";

const feature = new Feature({
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
    district = {
        "adminFeature": feature,
        "statFeatures": [],
        "originalStatFeatures": [],
        "isSelected": true,
        getId: () => "123",
        getName: () => "Wolkenkuckucksheim",
        getLabel: () => "Wolkenkuckucksheim (Bezirk)"
    };

export default district;
