import Feature from "ol/Feature.js";
import {GeoJSON} from "ol/format";
import Icon from "ol/style/Icon";
import Point from "ol/geom/Point";
import Style from "ol/style/Style.js";
// import ScenarioNeighborhood from "../../ScenarioBuilder/classes/ScenarioNeighborhood";
// import ScenarioFeature from "../../ScenarioBuilder/classes/ScenarioFeature";
// import Scenario from "../../ScenarioBuilder/classes/Scenario";
// import createStyle from "../../../../src/modules/draw/utils/style/createStyle";

export default {
    /**
     * Parsing the state
     * @param {Object} map the map objects
     * @param {Object} state the state parameter
     * @param {Object} path the store paths
     * @param {Boolean} districtsSet if districts are set
     * @param {Boolean} reset if states are reset
     * @returns {void}
     */
    parseState (map, state, path = [], districtsSet = false, reset = false) {
        for (const key in map) {
            if (Array.isArray(map[key]) && key === "Root") {
                for (const attr of map[key]) {
                    const mutation = `set${attr[0].toUpperCase() + attr.substring(1)}`;

                    this.commitState(mutation, attr, state[attr]);
                }
            }
            else if (
                Array.isArray(map[key]) &&
                Object.hasOwnProperty.call(state, key) &&
                map[key].every(e => typeof e === "string")
            ) {
                for (const attr of map[key]) {
                    // continue if prop doesn't exist on the save state
                    if (!Object.hasOwnProperty.call(state[key], attr)) {
                        continue;
                    }
                    let mutation = `${key}/set${attr[0].toUpperCase() + attr.substring(1)}`;

                    // add parent nodes for nested states
                    if (path.length > 0) {
                        mutation = path.join("/") + "/" + mutation;
                    }

                    switch (`${key}/${attr}`) {
                        case "ScenarioBuilder/scenarioCards":
                            this.$store.commit(mutation, this.parseScenarios(state[key][attr]));
                            this.$store.dispatch("Modules/ScenarioBuilder/updateScenarioLayer");
                            break;
                        case "Maps/layerIds":
                            this.$nextTick(() => {
                                state[key][attr].forEach(layerId => this.getTopicsLayer(layerId, reset));
                            });
                            break;
                        case "Maps/loadedLayers":
                            setTimeout(() => {
                                this.$nextTick(() => {
                                    state[key][attr].forEach(layerId => this.getTopicsLayer(layerId, reset));
                                });
                            }, 500);
                            break;
                        case "Maps/view":
                            mapCollection.getMap("2D").setView(state[key][attr]);
                            break;
                        case "Maps/center":
                            mapCollection.getMapView("2D").setCenter(state[key][attr]);
                            break;
                        case "Maps/zoom":
                            mapCollection.getMapView("2D").setZoom(state[key][attr]);
                            break;
                        case "Draw/layer":
                            // this.parseDrawFeatures(state, mutation, key, attr);
                            break;
                        case "Dashboard/statsFeatureFilter": {
                            this.commitState(mutation, attr, state[key][attr]);
                            break;
                        }
                        default:
                            this.commitState(mutation, attr, state[key][attr]);
                    }
                }
            }
            else if (map[key].constructor === Object) {
                state[key] = this.parseState(map[key], state[key], [...path, key], districtsSet, reset);
            }
        }
    },

    /**
     * Parsing the state
     * @param {Object} mutation the mutation objects
     * @param {String} attr the attribute
     * @param {Object} state the state parameter
     * @param {Boolean} districtsSet if districts are set
     * @returns {void}
     */
    commitState (mutation, attr, state) {
        if (attr === "active") {
            if (state) {
                this.$store.commit(mutation, state);

                // const key = mutation.replace("/setActive", "/id"),
                //     model = getComponent(this.$store.getters[key]);

                // if (model) {
                //     model.set("isActive", state);
                // }
            }
        }
        else {
            const _state = this.hasDeepFeatures(mutation, attr) ?
                this.deepParse(state) :
                this.parseFeatures(state);

            this.$store.commit(mutation, _state);
        }
    },

    /**
     * Parsing the state
     * @param {ol/Feature|ol/Feature[]} val the features
     * @returns {ol/Feature|ol/Feature[]} the parsed features
     */
    parseFeatures (val) {
        const parser = new GeoJSON();

        if (!Array.isArray(val)) {
            if (val?.constructor === Object && val?.properties?.isOlFeature) {
                return parser.readFeature(val);
            }
            if (val?.constructor === Object && val?.isOlGeometry) {
                return parser.readGeometry(val);
            }
            return val;
        }

        return val.map(el => {
            if (el?.constructor === Object && el?.properties?.isOlFeature) {
                return parser.readFeature(el);
            }
            return el;
        });
    },

    /**
     * Parsing the scenarios features
     * @param {Object} scenarios the scenarios of state
     * @returns {Object} the parsed scenarios
     */
    parseScenarios (scenarios) {
        if (!Array.isArray(scenarios) || !scenarios.length) {
            return scenarios;
        }

        scenarios.forEach(scenario => {
            if (!Array.isArray(scenario.objects) || !scenario.objects.length) {
                return;
            }

            scenario.objects.forEach(object => {
                const parsedFeature = object.feature;
                let finalFeature = parsedFeature;

                if (!(parsedFeature instanceof Feature)) {
                    // WFS features usually keep their geometry under "the_geom", not "geometry"
                    const geometryName = parsedFeature.geometryName_ || "geometry",
                        flatCoordinates = parsedFeature.values_[geometryName].flatCoordinates;

                    finalFeature = new Feature();
                    finalFeature.setGeometryName(geometryName);
                    finalFeature.setGeometry(new Point([flatCoordinates[0], flatCoordinates[1]]));
                    finalFeature.setId(parsedFeature.id_);

                    // features styled by their layer have no own style, and not every own style is an icon
                    const style = parsedFeature.style_,
                        iconSrc = style?.image_?.iconImage_?.src_,
                        parsedStyle = iconSrc ? new Style({
                            image: new Icon({
                                src: iconSrc,
                                scale: style.image_.scale_,
                                opacity: style.image_.opacity_,
                                rotation: style.image_.rotation_,
                                rotateWithView: style.image_.rotateWithView_,
                                displacement: style.image_.displacement_
                            })
                        }) : null;

                    finalFeature.setStyle(parsedStyle);

                    // Copy your application properties
                    for (const [key, value] of Object.entries(parsedFeature.values_)) {
                        if (key !== geometryName) {
                            finalFeature.set(key, value);
                        }
                    }
                }

                object.feature = finalFeature;
            });
        });

        return scenarios;
    },

    /**
     * Parsing the geometry
     * @param {String} type the geometry type
     * @param {Array} coordinates the coordinates
     * @returns {Object} the parsed geometry
     */
    parseGeometry ({type, coordinates}) {
        if (!type || !coordinates) {
            return undefined;
        }

        return new this.geomConstructors[type](coordinates);
    },

    /**
     * Parsing the drawn features
     * @param {Object} state the state parameter
     * @param {Object} mutation the mutation objects
     * @param {String} key the key in state
     * @param {String} attr the attribute
     * @returns {Object} the parsed drawn features
     */
    async parseDrawFeatures (state, mutation, key, attr) {
        /** @todo not tested!!! */
        this.$store.commit(mutation, await this.addNewLayerIfNotExists({layerName: this.$store.state.Tools.Draw.layerId}));
        this.$store.dispatch("Tools/Draw/clearLayer");
        const source = this.$store.state.Tools.Draw.layer.getSource();

        for (const feature of this.parseFeatures(state[key][attr])) {
            /* const drawState = feature.get("drawState");
             styleSettings = {
                    color: drawState.color,
                    colorContour: drawState.colorContour,
                    font: drawState.font,
                    fontSize: drawState.fontSize,
                    strokeWidth: drawState.strokeWidth,
                    text: drawState.text
                };*/

            feature.setStyle(function (_feature) {
                if (_feature.get("isVisible")) {
                    // return createStyle.createStyle(_feature.get("drawState"), styleSettings);
                }
                return undefined;
            });
            source.addFeature(feature);
        }
    },

    /**
     * Deep parse state
     * @param {Object} state the state parameter
     * @returns {Object} the parsed state
     */
    deepParse (state) {
        if (
            (state?.constructor === Object || Array.isArray(state)) &&
            !(state.properties?.isOlFeature || state.isOlGeometry)
        ) {
            for (const key in state) {
                state[key] = this.deepParse(state[key]);
            }

            return state;
        }
        return this.parseFeatures(state);
    }
};
