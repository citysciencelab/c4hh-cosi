import axios from "axios";
import helpers from "../js/helpers.js";
import thousandsSeparator from "../../../src/shared/js/utils/thousandsSeparator.js";
import {WFS, WMSGetFeatureInfo} from "ol/format.js";
import layerCollection from "../../../src/core/layers/js/layerCollection.js";
import WPS from "../../../src/shared/js/api/wps.js";
import mapCollection from "../../../src/core/maps/js/mapCollection.js";

const actions = {
    /**
     * Sets a filtered layerList
     * @param {Object} initialize.dispatch the dispatch
     * @param {Object} initialize.commit the commit
     * @returns {void}
     */
    initialize ({commit, rootGetters}) {
        const layerList = rootGetters.layerConfigsByAttributes({isNeverVisibleInTree: true});

        if (layerList) {
            commit("setFilteredLayerList", layerList);
        }
    },
    /**
     * Requests parametic url and checks if all neccessary information is available to simulate feature click and landuse select
     * @param {Object} handleUrlParameters.rootState the rootState
     * @param {Object} handleUrlParameters.dispatch the dispatch
     * @param {Object} handleUrlParameters.commit the commit
     * @returns {void}
     * url parameter. "?brwId=01510241&brwlayername=31.12.2017&center=565774,5933956"
     */
    async handleUrlParameters ({rootState, dispatch, commit}) {
        const brwId = rootState.urlParams?.BRWID,
            brwLayerName = rootState.urlParams?.BRWLAYERNAME,
            processFromParametricUrl = true;

        let center;

        // This check ensures that `center` is properly handled whether `rootState.urlParams.CENTER` is an array or a string.
        if (rootState.urlParams && rootState.urlParams.CENTER) {
            center = Array.isArray(rootState.urlParams.CENTER)
                ? rootState.urlParams.CENTER.map(parseFloat)
                : rootState.urlParams.CENTER.split(",").map(parseFloat);
        }
        else {
            center = undefined;
        }

        if (brwId && brwLayerName && center) {
            commit("setIsProcessFromParametricUrl", processFromParametricUrl);
            commit("setParamUrlParams", {
                brwId: brwId,
                brwLayerName: brwLayerName,
                center: center});

            await dispatch("switchLayer", brwLayerName);
            commit("setSelectedLayerName", brwLayerName);
            dispatch("Maps/setCenter", center, {root: true});
            dispatch("requestGFI", {processFromParametricUrl, center});
        }
        else if (rootState.urlParams.LAYERS) {
            dispatch("initialize");
        }
    },
    /**
     * Simulates landuse selection when parametric URL is being used
     * @param {Object} simulateLanduseSelect.commit the commit
     * @param {Object} simulateLanduseSelect.getters the getters
     * @returns {void}
     */
    simulateLanduseSelect ({commit, getters}) {
        const landuseByBrwId = getters.findLanduseByBrwId;

        commit("setSelectedLanduse", landuseByBrwId);
        commit("setIsProcessFromParametricUrl", false);
    },
    /**
     * Handles a layer switch by setting some attributes to their initial state and selecting the layer by the selected layer name
     * @param {Object} switchLayer.rootGetters the rootgetters
     * @param {Object} switchLayer.state the state
     * @param {Object} switchLayer.dispatch the dispatch
     * @param {Object} switchLayer.commit the commit
     * @param {String} selectedLayerName name of the selected layer
     * @returns {void}
     */
    switchLayer ({rootGetters, state, dispatch, commit}, selectedLayerName) {
        const previousSelectedLayer = state.filteredLayerList.filter(function (layer) {
                return layer.visibility === true;
            }),
            currentYear = selectedLayerName.split(".")[2];
        let previousYear = null;

        previousSelectedLayer.forEach(layer => {
            layer.visibility = false;
            previousYear = layer.name.split(".")[2];
            dispatch("replaceByIdInLayerConfig", {
                layerConfigs: [{
                    id: layer.id,
                    layer: {
                        id: layer.id,
                        visibility: false
                    }
                }]
            }, {root: true});
        });

        dispatch("selectLayerByName", selectedLayerName);
        commit("setSelectedLayerName", selectedLayerName);

        if (currentYear > 2008 && rootGetters["Maps/clickCoordinate"]) {
            dispatch("requestGFI", {processFromParametricUrl: false, center: null});
        }
        else {
            dispatch("Maps/removePolygonMarker", null, {root: true});
            if (rootGetters["Maps/clickCoordinate"] && !(previousYear > 2008 && currentYear <= 2008)) {
                dispatch("requestGFI", {processFromParametricUrl: false, center: null});
            }
        }
        if (previousYear > 2008 && currentYear <= 2008 && rootGetters["Maps/clickCoordinate"]) {
            dispatch("requestGFI", {processFromParametricUrl: false, center: null});
        }
        else if (currentYear > 2008 && previousYear <= 2008) {
            dispatch("Maps/removePointMarker", null, {root: true});
            commit("setSelectedBrwFeature", {});
            commit("setTextIds", []);
        }
        if (state.selectedLayer?.typ !== "GROUP" && state.selectedLayer?.layers.indexOf("flaeche") > -1) {
            commit("setIsAreaLayer", true);
            dispatch("toggleStripesLayer", state.isStripesLayer);
        }
        else {
            commit("setIsAreaLayer", false);
            dispatch("toggleStripesLayer", false);
        }
    },
    /**
     * Shows or hides the old view of brw in stripes
     * @param {Object} toggleStripesLayer.state the state
     * @param {Object} toggleStripesLayer.dispatch the dispatch
     * @param {Object} toggleStripesLayer.commit the commit
     * @param {Boolean} value true or false
     * @returns {void}
     */
    toggleStripesLayer ({state, dispatch, commit}, value) {
        const layerList = state.filteredLayerList.filter(layer => layer.isNeverVisibleInTree === true),
            selectedLayer = layerList.find(layer=> layer.visibility === true),
            selectedLayerName = selectedLayer.name,
            layerName = selectedLayerName + "-stripes";

        if (!selectedLayer) {
            console.warn("No visible layer found in the list");
            return;
        }
        commit("setIsStripesLayer", value);

        if (value) {
            dispatch("selectLayerByName", layerName);
            if (!layerList.some(aLayer => aLayer.name === layerName)) {
                console.warn(`Layer with name ${layerName} not found`);
            }
        }
        else {
            const layer = layerList.find(aLayer => aLayer.name === layerName);

            if (layer) {
                layer.visibility = false;
            }
            else {
                console.warn(`There are no block stripes available for layer ${selectedLayerName}`);
            }
        }
    },
    /**
     * Selects a layer by selectedLayerName
     * @param {Object} selectLayerByName.state the state
     * @param {Object} selectLayerByName.commit the commit
     * @param {String} selectedLayerName name of the layer
     * @returns {void}
     */
    selectLayerByName ({state, commit}, selectedLayerName) {
        const layerList = state.filteredLayerList.filter(layer => layer.isNeverVisibleInTree === true),
            selectedLayer = layerList.find((layer) => {
                if (layer.name === selectedLayerName) {
                    return layer;
                }
                return undefined;
            });

        if (selectedLayer !== undefined) {
            selectedLayer.visibility = true;
            commit("setSelectedLayer", selectedLayer);
        }
    },
    /**
     * Sends a get feature info request to the currently selected layer
     * @param {Object} requestGFI.state the state
     * @param {Object} requestGFI.dispatch the dispatch
     * @param {MapBrowserPointerEvent} event map browser event
     * @param {Boolean} [processFromParametricUrl] flag if process is started from parametric url. Then  the gfi request has to be faked, and the landuse has to be automatically selected, so that all the brw features can be displayed
     * @param {Number[]} [center] center coordinate of faked gfi
     * @returns {void}
     */
    async requestGFI ({rootGetters, state, dispatch}, {processFromParametricUrl, center}) {
        const selectedLayer = state.filteredLayerList.find(layer => layer.visibility === true),
            coordinates = processFromParametricUrl ? center : rootGetters["Maps/clickCoordinate"],
            map = mapCollection.getMap("2D"),
            mapView = map.getView();
        let groupedLayers = "",
            url = null;

        await dispatch("replaceByIdInLayerConfig", {
            layerConfigs: [{
                id: selectedLayer.id,
                layer: {
                    id: selectedLayer.id,
                    visibility: true
                }
            }]
        }, {root: true});
        groupedLayers = layerCollection.getLayerById(selectedLayer.id);
        if (!selectedLayer) {
            console.error("No visible layer found in filteredLayerList.");
            return;
        }
        if (!groupedLayers || !groupedLayers.layerSource || groupedLayers.layerSource.length === 0) {
            return;
        }

        if (Array.isArray(groupedLayers.layerSource)) {
            url = groupedLayers.layerSource[0].layerSource.getFeatureInfoUrl(coordinates, mapView.getResolution(), mapView.getProjection());
        }
        else {
            url = groupedLayers.layerSource.getFeatureInfoUrl(coordinates, mapView.getResolution(), mapView.getProjection());
        }

        axios.get(url)
            .then((response) => {
                if (response.status === 200) {
                    dispatch("handleGfiResponse", {response: response.data, coordinate: coordinates});
                }
            })
            .catch((error) => {
                console.error(error.response);
                dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.boris.alertMessage:noData"), {root: true});
            });
    },
    /**
     * Handles wms get feature info response
     * @param {Object} handleGfiResponse.state the state
     * @param {Object} handleGfiResponse.dispatch the dispatch
     * @param {Object} handleGfiResponse.commit the commit
     * @param {String} response XML sent as String
     * @param {ol.coordinate} coordinates clicked coordinates
     * @returns {void}
     */
    handleGfiResponse ({state, dispatch, commit}, {response, coordinate}) {
        const feature = new WMSGetFeatureInfo().readFeature(response);

        if (feature !== null) {
            if (parseInt(feature.get("jahrgang"), 10) > 2008) {
                feature.set("nutzungsart", JSON.parse(feature.get("nutzungsart")).nutzungen);
                dispatch("getFeatureRequestById", {featureId: feature.getId(), featureYear: feature.get("jahrgang")});
                commit("setSelectedPolygon", feature);
                dispatch("matchPolygonFeatureWithLanduse", {feature, selectedLanduse: state.selectedLanduse});
            }
            else {
                commit("setBrwFeatures", feature);
                dispatch("Maps/placingPointMarker", coordinate, {root: true});
                dispatch("Maps/setCenter", coordinate, {root: true});
                dispatch("combineFeatureWithSelectedDate", feature);
                commit("setSelectedPolygon", null);
            }
        }
        else {
            dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.boris.alertMessage:noBrw"), {root: true});
            dispatch("Maps/removePolygonMarker", null, {root: true});
            dispatch("Maps/removePointMarker", null, {root: true});
            commit("setSelectedBrwFeature", {});
            commit("setSelectedPolygon", null);
            commit("setSelectedLanduse", "");
            commit("setTextIds", []);
            commit("Maps/setClickCoordinate", null, {root: true});
        }
    },
    /**
     * Sends a wfs get feature request filtered by id
     * @param {Object} getFeatureRequestById.dispatch the dispatch
     * @param {String} featureId id of seelected feature
     * @param {String} year selected year
     * @returns {void}
     */
    getFeatureRequestById ({dispatch}, {featureId, featureYear}) {
        const yearInt = parseInt(featureYear, 10),
            index = Config.layerConf.lastIndexOf("/"),
            url = Config.layerConf.substring(0, index);

        let typeName,
            urlParams = null,
            geometryName = "geom_zone";

        if (featureId.indexOf("FLAECHE") > -1) {
            typeName = "app:v_brw_zonen_geom_flaeche_" + featureYear;
            geometryName = "geom_zone_flaeche";
        }
        else if (yearInt <= 2008) {
            typeName = "lgv_brw_lagetypisch_alle";
        }
        else if (yearInt <= 2014) {
            typeName = "lgv_brw_zoniert_" + featureYear;
        }
        else {
            typeName = "lgv_brw_zonen_" + featureYear;
        }
        urlParams = "typeName" + typeName + "&featureID=" + featureId;


        axios.get(url + "/HH_WFS_Bodenrichtwerte?service=WFS&version=1.1.0&request=GetFeature&" + urlParams)
            .then((response) =>{
                const feature = new WFS().readFeature(response.data);

                if (feature) {
                    feature.unset("geom_brw_grdstk");
                    feature.setGeometryName(geometryName);
                    dispatch("Maps/placingPolygonMarker", feature, {root: true});
                }
            })
            .catch((error) => {
                console.error(error.message);
                dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.boris.alertMessage:noData"), {root: true});
            });

    },
    /**
     * Combines the polygonFeature with the selectedLanduse
     * if so, the function sendGetFeatureRequest is called,
     * to finally get the brwFeatureInformation for the selectedPolygon with the selectedLanduse
     * @param {Object} matchPolygonFeatureWithLanduse.dispatch the dispatch
     * @param {Object} matchPolygonFeatureWithLanduse.commit the commit
     * @param {ol.Feature} feature - selectedPolygon feature
     * @param {String} selectedLanduse - currently selectedLanduse
     * @returns {void}
     */
    matchPolygonFeatureWithLanduse ({dispatch, commit}, {feature, selectedLanduse}) {
        const landuseMatch = feature.get("nutzungsart").find((typeOfUse) => {
            return typeOfUse.nutzungsart === selectedLanduse;
        });

        if (landuseMatch) {
            dispatch("postFeatureRequestByBrwNumber", {brwNumber: landuseMatch.richtwertnummer, featureYear: feature.get("jahrgang")});
        }
        else {
            commit("setSelectedLanduse", "");
            commit("setSelectedBrwFeature", {});
        }
    },
    /**
     * Sends a wfs get feature request filtered by Bodenrichtwertnummer
     * @param {Object} postFeatureRequestByBrwNumber.dispatch the dispatch
     * @param {String} brwNumber brwNumber is the standard land value number
     * @param {String} featureYear selected year
     * @returns {void}
     */
    postFeatureRequestByBrwNumber ({dispatch}, {brwNumber, featureYear}) {
        const typeName = parseInt(featureYear, 10) > 2008 ? "lgv_brw_zoniert_alle" : "lgv_brw_lagetypisch_alle",
            index = Config.layerConf.lastIndexOf("/"),
            url = Config.layerConf.substring(0, index),
            wfsString = `<GetFeature version='1.1.0' xmlns:wfs='http://www.opengis.net/wfs'>
            <wfs:Query typeName='${typeName}'>
                <Filter xmlns='http://www.opengis.net/ogc'>
                    <PropertyIsEqualTo>
                        <PropertyName>richtwertnummer</PropertyName>
                        <Literal>${brwNumber}</Literal>
                    </PropertyIsEqualTo>
                </Filter>
            </wfs:Query>
        </GetFeature>`;

        axios.post(url + "/HH_WFS_Bodenrichtwerte", wfsString, {
            headers: {"Content-Type": "text/xml"}
        }).then((response) => {
            if (response.status === 200) {
                dispatch("handleGetFeatureResponse", {response: response.data, status: response.status, year: featureYear});
            }
        }).catch((error) => {
            console.error(error.response);
            dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.boris.alertMessage:noData"), {root: true});
        });
    },
    /**
     * Handles the response from a wfs get feature request
     * @param {Object} handleGetFeatureResponse.dispatch the dispatch
     * @param {Object} handleGetFeatureResponse.commit the commit
     * @param {String} response XML to be sent as String
     * @param {Integer} status request status
     * @param {Number} year selected year
     * @returns {void}
     */
    async handleGetFeatureResponse ({dispatch, commit}, {response, year}) {
        const features = new WFS().readFeatures(response),
            featureByYear = await helpers.findBrwFeatureByYear({features, year});

        commit("setBrwFeatures", features);
        dispatch("combineFeatureWithSelectedDate", featureByYear);
    },
    /**
     * Get the actually selected date and set date and feature to get the extended feature attributes
     * @param {Object} combineFeatureWithSelectedDate.dispatch the dispatch
     * @param {Object} combineFeatureWithSelectedDate.getters the getters
     * @param {ol.Feature[]} feature selected feature
     * @returns {void}
     */
    async combineFeatureWithSelectedDate ({dispatch, getters}, feature) {
        const date = await getters.getDateBySelectedLayerName;

        if (feature !== undefined) {
            dispatch("extendFeatureAttributes", {feature, date});
        }
        else {
            console.error("Data query failed");
            dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.boris.alertMessage:noData"), {root: true});
        }
    },
    /**
     * Sets the extended feature attributes
     * @param {Object} extendFeatureAttributes.state the state
     * @param {Object} extendFeatureAttributes.commit the commit
     * @param {Object} feature selected fetaure
     * @param {String} date date
     * @returns {void}
     */
    extendFeatureAttributes ({dispatch, commit, state}, {feature, date}) {
        const isDMTime = parseInt(feature.get("jahrgang"), 10) < 2002,
            sw = helpers.parseSW({feature});

        feature.setProperties({
            "richtwert_dm": isDMTime ? thousandsSeparator(parseFloat(feature.get("richtwert_dm"), 10).toFixed(1)) : "",
            "richtwert_euro": thousandsSeparator(feature.get("richtwert_euro")),
            "schichtwert": sw,
            "stichtag": date,
            "convertedBrw": "", // Converted standard land value
            "convertedBrwDM": "",
            "zEntwicklungszustand": feature.get("entwicklungszustand"), // Mandatory attribute for WPS
            "zBeitragszustand": feature.get("beitragszustand"), // Mandatory attribute for WPS
            "zNutzung": feature.get("nutzung_kombiniert"), // Mandatory attribute for WPS
            "zBauweise": state.selectedBuildDesign !== "" ? state.selectedBuildDesign : null,
            "zGeschossfl_zahl": feature.get("geschossfl_zahl") !== "" ? feature.get("geschossfl_zahl") : null,
            "zGrdstk_flaeche": feature.get("grdstk_flaeche") !== "" ? feature.get("grdstk_flaeche") : null,
            "zStrassenLage": feature.get("nutzung_kombiniert") === "EFH Ein- und Zweifamilienhäuser" ? state.selectedPositionToStreet : null
        });

        commit("setSelectedBrwFeature", feature);
        dispatch("sendWpsConvertRequest", state);

        return feature;
    },
    /**
     * Sends a request to convert the BRW
     * @returns {void}
     */
    sendWpsConvertRequest ({dispatch, state, rootGetters}) {
        const data = helpers.convert({brw: state.selectedBrwFeature}),
            url = rootGetters.restServiceById(state.wpsId);

        if (url === undefined) {
            console.warn("Rest Service with the ID " + this.wpsId + " is not configured in rest-services.json!");
        }
        else {
            WPS.wpsRequest(state.wpsId, url.url, state.fmwProcess, data, (response, status) => dispatch("handleConvertResponse", {response, status}));
        }
    },
    /**
     * Extracts and stores the converted BRW
     * @param  {string} response - the response xml of the wps
     * @param  {number} status - the HTTPStatusCode
     * @returns {void}
     */
    handleConvertResponse ({dispatch}, {response, status}) {
        let complexData,
            executeResponse,
            showErrorMessage = false;

        if (status === 200) {
            executeResponse = response.ExecuteResponse;

            if (executeResponse.ProcessOutputs) {

                complexData = response.ExecuteResponse.ProcessOutputs.Output.Data.ComplexData;
                if (complexData.serviceResponse) {
                    showErrorMessage = true;
                    console.error("FME-Server status info: " + complexData.serviceResponse.statusInfo.message);
                }
                else if (complexData.Bodenrichtwert) {
                    if (complexData.Bodenrichtwert.Ergebnis.ErrorOccured !== "No") {
                        showErrorMessage = true;
                        console.error("BRWConvert error message: " + complexData.Bodenrichtwert.Ergebnis.Fehlermeldung);
                    }
                    else {
                        dispatch("updateSelectedBrwFeature", {converted: "convertedBrw", brw: complexData.Bodenrichtwert.Ergebnis.BRW});
                    }
                }
            }
            else if (executeResponse.Status) {
                showErrorMessage = true;
                console.error("FME-Server execute response: " + executeResponse.Status.ProcessFailed.ExceptionReport.Exception.ExceptionText);
            }
        }
        else {
            showErrorMessage = true;
            console.error("WPS-Query with status " + status + " aborted.");
        }
        if (showErrorMessage) {
            dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.boris.alertMessage:noData"), {root: true});
        }
    },
    /**
     * Updater for selectedBrwFeature that forces a refresh
     * @param {Object} updateSelectedBrwFeature.state the state
     * @param {Object} updateSelectedBrwFeature.commit the commit
     * @param {String} converted attribute name of the selected feature
     * @param {String} brw attribute value
     * @returns {void}
     */
    updateSelectedBrwFeature ({state, commit}, {converted, brw}) {
        if (Object.keys(state.selectedBrwFeature).length !== 0) {
            const feature = state.selectedBrwFeature,
                isDMTime = parseInt(feature.get("jahrgang"), 10) < 2002,
                valueDm = isDMTime ? thousandsSeparator((parseFloat(brw, 10) * 1.95583).toFixed(1)) : "";

            switch (converted) {
                case "zBauweise":
                    feature.setProperties({
                        "zBauweise": brw,
                        "convertedBrw": "",
                        "convertedBrwDM": ""
                    });
                    break;
                case "zGeschossfl_zahl":
                    feature.setProperties({
                        "zGeschossfl_zahl": brw,
                        "convertedBrw": "",
                        "convertedBrwDM": ""
                    });
                    break;
                case "zGrdstk_flaeche":
                    feature.setProperties({
                        "zGrdstk_flaeche": brw,
                        "convertedBrw": "",
                        "convertedBrwDM": ""
                    });
                    break;
                case "zStrassenLage":
                    feature.setProperties({
                        "zStrassenLage": brw,
                        "convertedBrw": "",
                        "convertedBrwDM": ""
                    });
                    break;
                default:
                    feature.setProperties({"convertedBrw": thousandsSeparator(brw)});
                    feature.setProperties({"convertedBrwDM": valueDm});
            }

            commit("setSelectedBrwFeature", feature);
            commit("setConvertedBrw", state.selectedBrwFeature.get("convertedBrw"));
        }
    }
};

export default actions;
