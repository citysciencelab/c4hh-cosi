const baseProportionTemplate = {
        baseLayer: {
            map: {
                type: "mapProportion",
                proportion: 0.6,
                style: {
                    borderSize: 2,
                    color: [
                        228,
                        26,
                        28,
                        1
                    ]
                },
                layerIds: [
                    "33780"
                ]
            }
        }
    },
    baseFixedTemplateForHamburg = {
        baseLayer: {
            map: {
                type: "mapFixed",
                bbox: [545114.80, 5914269.80, 591483.01, 5957132.28],
                layerIds: [
                    "33780"
                ]
            }
        }
    },
    mapfishServerConfig = {
        template: "cosiImage",
        name: "mapfish_qs"
    };

export {
    baseProportionTemplate,
    baseFixedTemplateForHamburg,
    mapfishServerConfig
};
