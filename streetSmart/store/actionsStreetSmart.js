import mapCollection from "../../../src/core/maps/js/mapCollection.js";
import loadPackage from "../js/loadPackage.js";

const actions = {
    /**
     * Loads StreetSmartApi and react in the given versions. They are loaded by appending a script tag to head tag and not by package.json.
     * React is loaded this way, because only the production version works with StreetSmartApi.
     * StreetSmartApi is loaded this way, because it is not a npm package.
     * Versions of them are taken from state.
     * @param {Function} callback  called, if all libs are loaded
     * @returns {void}
     */
    loadPackages ({state}, callback) {
        const urlStreetsmartAPI = `https://streetsmart.cyclomedia.com/api/v${state.streetsmartAPIVersion}/StreetSmartApi.js`,
            urlReact = `https://unpkg.com/react@${state.reactVersion}/umd/react.production.min.js`,
            urlReactDom = `https://unpkg.com/react-dom@${state.reactVersion}/umd/react-dom.production.min.js`;

        try {
            loadPackage(urlReact)
                .then(() => loadPackage(urlReactDom))
                .then(() => loadPackage(urlStreetsmartAPI))
                .then(() => {
                    if (callback) {
                        return callback();
                    }
                    return null;
                })
                .catch((err) => console.error("loading of package failed:", err));
        }
        catch (err) {
            console.error("loading of package failed:", err);
        }
    },

    /**
     * Initializes the StreetSmartApi Panorama viewer.
     * @param {Object} param.state the state
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootGetters the rootGetters
     * @see {@link https://www.cyclomedia.com/de/api-dokumentation }
     * @returns {void}
     */
    initApi ({state, dispatch, getters, rootGetters}) {
        const service = rootGetters.restServiceById(state.serviceId),
            projection = mapCollection.getMapView("2D").getProjection().getCode(),
            locale = getters.currentLocale;

        if (service) {
            const options = {
                targetElement: document.getElementById("street-smart"),
                username: service.params.username,
                password: service.params.password,
                apiKey: service.params.apiKey,
                srs: state.streetSmartSRS ? state.streetSmartSRS : projection,
                locale: locale ? locale : service.params.locale
            };

            if (typeof StreetSmartApi === "undefined") {
                console.warn("Cannot start Streetsmart-View. StreetSmartApi is not available.");
                dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.streetsmart.createViewFailedMoreInfo"), {root: true});
            }
            else {
                StreetSmartApi.init(options)
                    .then(() => {
                        dispatch("onInitSuccess");
                    })
                    .catch(reason => {
                        console.warn("Failed to create component(s) through API: " + reason);
                        dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.streetsmart.createViewFailedMoreInfo"), {root: true});
                    });
            }
        }
        else {
            console.warn("Cannot start Streetsmart-View. No service in rest-services found for serviceId ", state.serviceId);
            dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.streetsmart.createViewFailedMoreInfo"), {root: true});
        }
    },

    /**
     * Is called if initilization of StreetSmartApi was successful.
     * Adds listeners and sets maps center as position in panorama viewer.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.state the state
     * @returns {void}
     */
    onInitSuccess ({dispatch, state}) {
        dispatch("Maps/changeMarkerStyle", {markerId: "marker_point_layer", styleId: state.styleId}, {root: true});
        dispatch("addListener");
        dispatch("setPosition", mapCollection.getMapView("2D").getCenter());
    },

    /**
     * Adds listener to panorama viewer.
     * @param {Object} param.dispatch the dispatch
     * @returns {void}
     */
    addListener ({dispatch}) {
        StreetSmartApi.on(StreetSmartApi.Events.viewer.VIEWER_ADDED, viewerEvent => {
            viewerEvent.detail.viewer.on(StreetSmartApi.Events.panoramaViewer.RECORDING_CLICK, function (e) {
                dispatch("moveAndRotateMarker", e);
            });
            viewerEvent.detail.viewer.on(StreetSmartApi.Events.panoramaViewer.VIEW_CHANGE, function (e) {
                dispatch("rotateMarker", e);
            });
            viewerEvent.detail.viewer.on(StreetSmartApi.Events.panoramaViewer.TILE_LOAD_ERROR, function (e) {
                console.warn(e);
            });
        });
    },

    /**
     * Sets the coordinates of the event to panorama-viewer and sets mapMarker to map.
     * @param {Object} param.state the state
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} evt contains coordinates
     * @see {@link https://www.cyclomedia.com/de/api-dokumentation}
     * @returns {void}
     */
    setPosition ({state, commit, dispatch}, evt) {
        if (evt) {
            const projection = mapCollection.getMapView("2D").getProjection().getCode(),
                coordinates = !evt[0] || !evt[1] ? evt.coordinate : [evt[0], evt[1]];

            try {
                StreetSmartApi.open(
                    {
                        coordinate: coordinates
                    },
                    {
                        viewerType: [StreetSmartApi.ViewerType.PANORAMA],
                        srs: state.streetSmartSRS ? state.streetSmartSRS : projection,
                        panoramaViewer: {
                            replace: true,
                            timeTravelVisible: state.timeTravelVisible,
                            closable: false,
                            // Show green recording dots
                            recordingsVisible: true
                        }
                    }
                )
                    .then(result => {
                        if (result && result[0]) {
                            commit("setLastCoordinates", coordinates);

                            const viewers = StreetSmartApi.getViewers();

                            viewers[0].toggle3DCursor(state.toggle3DCursor);
                            viewers[0].toggleAddressesVisible(state.toggleAddressesVisible);
                        }
                        else {
                            dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.streetsmart.noData"), {root: true});
                            dispatch("Maps/placingPointMarker", {coordinates: state.lastCoordinates}, {root: true});
                        }
                    })
                    .catch(reason => {
                        console.warn("Error opening panorama viewer: " + reason);
                        dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.streetsmart.createViewFailed"), {root: true});
                    });
            }
            catch (e) {
                console.error("Create streetSmart view failed: ", e);
                dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.streetsmart.createViewFailed"), {root: true});
            }
        }
    },

    /**
     * Moves and rotates the mapMarker.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @param {Object} evt to get coordinates and rotation from
     * @returns {void}
     */
    moveAndRotateMarker ({dispatch, getters}, evt) {
        dispatch("Maps/placingPointMarker", {
            coordinates: evt.detail.recording.xyz,
            rotation: evt.detail.recording.relativeYaw + getters.lastYaw
        }, {root: true});
        dispatch("Maps/setCenter", [evt.detail.recording.xyz[0], evt.detail.recording.xyz[1]], {root: true});
    },

    /**
     * Rotates the mapMarker and remembers the last yaw/rotation.
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} evt to get rotation from
     * @returns {void}
     */
    rotateMarker ({commit, dispatch}, evt) {
        const viewers = StreetSmartApi.getViewers(),
            rt = viewers[0].getRecording();

        dispatch("Maps/placingPointMarker", {coordinates: rt.xyz, rotation: evt.detail.yaw}, {root: true});
        commit("setLastCoordinates", rt.xyz);

        commit("setLastYaw", evt.detail.yaw);
    },

    /**
     * Destroys the StreetSmartApi Panorama viewer and removes mapMarker from map.
     * @param {Object} param.dispatch the dispatch
     * @returns {void}
     */
    destroyApi ({dispatch}) {
        dispatch("Maps/removePointMarker", null, {root: true});
        dispatch("removeListener");
        dispatch("Maps/changeMarkerStyle", {markerId: "marker_point_layer"}, {root: true});
        StreetSmartApi.destroy({
            targetElement: document.getElementById("street-smart")
        });
        delete Array.prototype.filterByList;
    },

    /**
     * Removes listener from panorama viewer.
     * @param {Object} param.dispatch the dispatch
     * @returns {void}
     */
    removeListener ({dispatch}) {
        if (typeof StreetSmartApi !== "undefined" && typeof StreetSmartApi.on === "function") {
            StreetSmartApi.on(StreetSmartApi.Events.viewer.VIEWER_ADDED, viewerEvent => {
                viewerEvent.detail.viewer.off(StreetSmartApi.Events.panoramaViewer.RECORDING_CLICK, function (e) {
                    dispatch("moveAndRotateMarker", e);
                });
                viewerEvent.detail.viewer.off(StreetSmartApi.Events.panoramaViewer.VIEW_CHANGE, function (e) {
                    dispatch("rotateMarker", e);
                });
                viewerEvent.detail.viewer.off(StreetSmartApi.Events.panoramaViewer.TILE_LOAD_ERROR, function (e) {
                    console.warn(e);
                });
            });
        }
    }
};

export default actions;
