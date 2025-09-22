import axios from "axios";
import {buildEndpointUrl} from "../utils/buildEndpointUrl";
import {Draw, Modify, Translate} from "ol/interaction";
import {Style, Stroke, Fill, Circle as CircleStyle} from "ol/style";
import wfs from "@masterportal/masterportalapi/src/layer/wfs";

let drawInteraction,
    drawLayer,
    modifyInteraction,
    selectInteraction,
    featureProperties = [],
    translateInteraction;

const actions = {
    async loadCategories ({commit, getters}) {
        const url = buildEndpointUrl(getters.categoriesUrl, {t: Date.now()}),
            response = await axios.get(url);

        commit("setCategories", response.data.categories);
    },
    async loadDepartments ({commit, getters}) {
        const url = buildEndpointUrl(getters.departmentsUrl, {t: Date.now()}),
            response = await axios.get(url);

        commit("setDepartments", response.data.departments);
    },
    /**
     * Clears all map interactions and resets related variables.
     * @param {Object} dispatch - The dispatch object.
     * @returns {void}
     */
    clearInteractions ({dispatch}) {
        const map = mapCollection.getMap("2D");

        if (drawInteraction) {
            dispatch("Maps/removeInteraction", drawInteraction, {root: true});
        }
        if (modifyInteraction) {
            dispatch("Maps/removeInteraction", modifyInteraction, {root: true});
        }
        if (selectInteraction) {
            dispatch("Maps/removeInteraction", selectInteraction, {root: true});
        }
        if (translateInteraction) {
            dispatch("Maps/removeInteraction", translateInteraction, {root: true});
        }
        map.removeLayer(drawLayer);

        drawInteraction = undefined;
        modifyInteraction = undefined;
        selectInteraction?.getFeatures().clear();
        selectInteraction = undefined;
        translateInteraction = undefined;
        drawLayer = undefined;
    },
    /**
     * Prepares everything so that the user can interact with features or draw features
     * to be able to send a transaction to the service.
     *
     * @param {Function} dispatch - The dispatch function to trigger actions.
     * @param {Function} getters - The getters function to access state values.
     * @param {Function} rootGetters - The root getters function to access state values.
     * @param {Function} commit - The commit function to trigger mutations.
     * @param {("Point"|"update")} interaction Identifier of the selected interaction.
     * @returns {void}
     */
    async setMapInteraction ({dispatch, getters, rootGetters, commit}, interaction) {
        dispatch("clearInteractions");

        const {layerInformation} = getters;

        switch (interaction) {
            case "Point":
                commit("setSelectedInteraction", "insert");
                dispatch("handleDrawInteraction", {
                    interaction,
                    layerInformation,
                    rootGetters
                });
                break;
            // case "update":
            //     commit("setSelectedInteraction", "singleUpdate");
            //     dispatch("handleUpdateInteraction", {
            //         sourceLayer
            //     });
            //     break;
            default:
                break;
        }
    },
    /**
     * Handles draw interaction for a single feature.
     * @param {Function} commit - The commit function to trigger mutations.
     * @param {Function} dispatch - The dispatch function to trigger actions.
     * @param {Object} payload - The payload object.
     * @returns {void}
     */
    async handleDrawInteraction ({commit, dispatch}, payload) {
        const {interaction, layerInformation} = payload,
            pointStyle = new Style({
                image: new CircleStyle({
                    radius: 10,
                    fill: new Fill({
                        color: "rgba(9, 237, 245, 1)"
                    }),
                    stroke: new Stroke({
                        color: "rgba(255, 255, 255, 1)",
                        width: 2
                    })
                })
            }),
            layer = layerInformation[0];

        featureProperties = await wfs.receivePossibleProperties(layer.url, layer.version, layer.featureType, layer.isSecured);
        let drawOptions = {};

        drawLayer = await dispatch("Maps/addNewLayerIfNotExists", {layerName: "module/geoMarker/vectorLayer", id: "module/geoMarker/vectorLayer"}, {root: true});

        drawOptions = {
            source: drawLayer.getSource(),
            type: interaction,
            stopClick: true,
            geometryName: featureProperties.find(({type}) => type === "geometry")?.key,
            style: pointStyle
        };

        drawInteraction = new Draw(drawOptions);

        modifyInteraction = new Modify({
            source: drawLayer.getSource()
        });

        translateInteraction = new Translate({
            layers: [drawLayer]
        });

        drawLayer.setStyle(pointStyle);

        drawInteraction.on("drawend", (event) => {
            commit("setSelectedInteraction", "insert");
            commit("setNewGeoMarkerFeature", event.feature);

            drawLayer.getSource().clear();

            dispatch("Maps/removeInteraction", drawInteraction, {root: true});

            dispatch("Maps/addInteraction", modifyInteraction, {root: true});
            dispatch("Maps/addInteraction", translateInteraction, {root: true});
        });

        dispatch("Maps/addInteraction", drawInteraction, {root: true});
    }
};

export default actions;
