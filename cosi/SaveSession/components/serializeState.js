import {GeoJSON} from "ol/format";
import Feature from "ol/Feature";
import {Point, Polygon, MultiPoint, MultiPolygon, Geometry} from "ol/geom";

export default {
    serializeState () {
        const state = this.deepCopyState(this.storePaths, this.$store.state);

        this.serializeView(state);
        this.serializeScenarios(state);
        this.serializeBackboneModules(state);
        this.serializeDrawFeatures(state);
        this.state = state;
    },

    deepCopyState (map, store) {
        const state = {};

        for (const key in map) {
            if (
                Array.isArray(map[key]) &&
                map[key].every(e => typeof e === "string")
            ) {
                state[key] = {};
                for (const attr of map[key]) {
                    const val = this.hasDeepFeatures(key, attr) ?
                        this.serializeToolDatasets(store[key][attr]) :
                        this.serializeFeatures(store[key][attr]);

                    state[key][attr] = val;
                }
            }
            else if (map[key].constructor === Object) {
                state[key] = this.deepCopyState(map[key], store[key]);
            }
        }

        return state;
    },

    deepSerialize (state) {
        let _state;

        if (state?.constructor === Object) {
            _state = {...state};

            for (const key in _state) {
                _state[key] = this.deepSerialize(_state[key]);
            }

            return _state;
        }
        else if (Array.isArray(state)) {
            _state = [...state];

            for (const i in state) {
                _state[i] = this.deepSerialize(_state[i]);
            }

            return _state;
        }

        return this.serializeFeatures(state);
    },

    serializeFeatures (val) {
        const parser = new GeoJSON();
        let res;

        if (!Array.isArray(val)) {
            if (val?.constructor === Feature) {
                res = parser.writeFeatureObject(val);

                res.properties.isOlFeature = true;
            }
            else if ([Point, MultiPoint, Polygon, MultiPolygon].includes(val?.constructor)) {
                res = parser.writeGeometryObject(val);
                res.isOlGeometry = val.getType();
            }
            else {
                res = val;
            }
        }
        else {
            res = [];

            for (let i = 0; i < val.length; i++) {
                if (val[i].constructor === Feature) {
                    const geojson = parser.writeFeatureObject(val[i]);

                    geojson.properties.isOlFeature = true;
                    res.push(geojson);
                }
                else {
                    res.push(val[i]);
                }
            }
        }

        return res;
    },

    serializeScenarios (state) {
        const parser = new GeoJSON();

        state.Tools.ScenarioBuilder.scenarios =
            state.Tools.ScenarioBuilder.scenarios.map(
                scenario => this.serializeScenario(scenario, parser)
            );
    },

    serializeScenario (scenario, parser) {
        const simulatedFeatures = scenario.getSimulatedFeatures().map(
                scenarioFeature => this.serializeScenarioFeature(scenarioFeature, parser)
            ),
            modifiedFeatures = scenario.getModifiedFeatures().map(
                scenarioFeature => this.serializeScenarioFeature(scenarioFeature, parser, true)
            ),
            neighborhoods = scenario.getNeighborhoods().map(
                scenarioNeighborhood => this.serializeNeighborhood(scenarioNeighborhood, parser)
            );

        return {
            ...scenario,
            guideLayer: null,
            isActive: false,
            simulatedFeatures,
            modifiedFeatures,
            neighborhoods
        };
    },

    serializeScenarioFeature (scenarioFeature, parser, revertToOriginalData = false) {
        const feature = parser.writeFeatureObject(scenarioFeature.feature);

        // serialize original data (copy object)
        if (feature.properties.originalData) {
            feature.properties.originalData = {...feature.properties.originalData};
        }

        // serialize geometry (original data)
        if (feature.properties.originalData?.geometry) {
            feature.properties.originalData.geometry = this.serializeGeometry(feature.properties.originalData.geometry);
        }

        // serialize geometry (scenario data)
        if (scenarioFeature.scenarioData.geometry) {
            scenarioFeature.scenarioData.geometry = this.serializeGeometry(scenarioFeature.scenarioData.geometry);
        }

        if (revertToOriginalData) {
            feature.geometry = feature.properties.originalData?.geometry || feature.geometry;
            feature.properties = {
                ...feature.properties,
                ...feature.properties.originalData || {}
            };
        }

        // delete original Data if necessary
        if (Object.hasOwnProperty.call(feature.properties, "originalData")) {
            delete feature.properties.originalData;
        }

        // remove redundant geometries
        for (const key in feature.properties) {
            if (feature.properties[key] instanceof Geometry) {
                delete feature.properties[key];
            }
        }

        return {
            ...scenarioFeature,
            guideLayer: null,
            scenario: null,
            eventKeys: null,
            feature: feature,
            layer: scenarioFeature.layer.get("id")
        };
    },

    serializeNeighborhood (scenarioNeighborhood, parser) {
        return {
            feature: parser.writeFeatureObject(scenarioNeighborhood.feature)
        };
    },

    serializeBackboneModules (state) {
        state.Backbone = {};

        state.Backbone.Filter = this.serializeFilters();
    },

    serializeFilters () {
        // const model = Radio.request("ModelList", "getModelByAttributes", {id: "filter"});
    },

    serializeGeometry (geom) {
        const
            type = geom.getType(),
            coordinates = geom.getCoordinates();

        return {
            type, coordinates
        };
    },

    serializeDrawFeatures (state) {
        state.Tools.Draw.layer = this.serializeFeatures(state.Tools.Draw.layer?.getSource().getFeatures() || []);
    },

    serializeToolDatasets (state) {
        return this.deepSerialize(state);
    },

    serializeView (state) {
        state.Maps.view = this.$store.getters["Maps/getView"];
    }
};
