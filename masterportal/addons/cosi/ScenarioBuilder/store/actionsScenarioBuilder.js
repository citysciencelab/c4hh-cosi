import {addSimulationTag, clearGuideLayer, featureTagStyleMod, featureTagStyle} from "../utils/guideLayer";
import layerCollection from "@core/layers/js/layerCollection";
import layerFactory from "@core/layers/js/layerFactory";

const actions = {
    /**
     * Updates the scenario layers
     * @param {*} context Vuex action context.
     * @param {*} context.commit The commit function
     * @param {*} context.dispatch The dispatch function
     * @param {*} context.getters The getters
     * @returns {void}
     */
    async updateScenarioLayer ({commit, dispatch, getters}) {
        const {title, objects} = getters.activeScenarioCard,
            scenarioLayer = await dispatch("getLayerById", "active-scenario"),
            layer = scenarioLayer.getLayer(),
            features = objects.map(obj => obj.feature);

        commit("setGuideLayer", await dispatch("createGuideLayer"));
        scenarioLayer.getLayer().setVisible(true);
        scenarioLayer.getLayer().setZIndex(10);
        scenarioLayer.set("name", title);
        layer.set("name", title);
        scenarioLayer.getLayerSource().clear();
        clearGuideLayer(getters.guideLayer);

        features.forEach(feature => {
            scenarioLayer.getLayerSource().addFeature(feature);
            addSimulationTag(feature, getters.guideLayer);
        });
    },

    /**
     * Gets a layer by its ID from the layer collection. If the layer does not exist,
     * it creates a new vector-based layer with the specified ID, adds it to the layer collection,
     * and then returns the newly created layer.         *
     * @param {string} id - The unique identifier of the layer to get or create.
     * @returns {ol/layer} The layer object corresponding to the given ID.
     */
    getLayerById (_, id) {
        if (typeof layerCollection.getLayerById(id) !== "undefined") {
            return layerCollection.getLayerById(id);
        }
        const layer = layerFactory.createLayer({
            typ: "VECTORBASE",
            id: id,
            name: id,
            alwaysOnTop: true,
            visibility: true
        });

        layerCollection.addLayer(layer);
        return layer;
    },

    /**
     * Creates a guide layer used for additional info to display on the map.
     * @param {*} context Vuex action context.
     * @param {*} context.dispatch The dispatch function
     * @returns {void}
     */
    async createGuideLayer ({dispatch}) {
        const newLayer = await dispatch("Maps/addNewLayerIfNotExists", {layerName: "ScenarioBuilder_layer"}, {root: true});


        newLayer.setVisible(true);
        newLayer.setStyle(function (feature) {
            if (feature.get("isModified") && !feature.get("isSimulation")) {
                return [featureTagStyleMod(feature)];
            }
            return [featureTagStyle(feature)];
        });
        newLayer.setZIndex(15);

        return newLayer;
    }
};

export default actions;
