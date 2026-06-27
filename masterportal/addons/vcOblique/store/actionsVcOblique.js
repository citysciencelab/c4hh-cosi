import crs from "@masterportal/masterportalapi/src/crs.js";
import mapMarker from "../../../src/core/maps/js/mapMarker.js";

/**
 * Retrieves the vcs active map independent of VCMap version.
 * @param {@vcmap/core} vcs - vcs window element
 * @returns {@vcmap/core#map?} activeMap object
 */
function getActiveMap (vcs) {
    if (vcs?.vcm) {
        // vcm key only present in VCMap@4
        return vcs.vcm.Framework?.getInstance?.()?.getActiveMap?.();
    }
    return vcs?.getFirstApp?.()?.maps?.activeMap;
}

/**
 * Retrieves the Viewpoint constructor independent auf VCMap version.
 * @param {@vcmap/core} vcs - vcs window element
 * @returns {constructor?} Viewpoint constructor
 */
function getViewpointConstructor (vcs) {
    // Constructor is exposed in VCMap@4 and has to be inferred from an instance in VCMap@6.
    if (vcs?.vcm) {
        // vcm key only present in VCMap@4
        return vcs?.vcm?.util?.ViewPoint;
    }
    return getActiveMap(vcs).getViewpointSync?.()?.constructor;
}

/**
 * There's a spelling difference between VCMap versions 4 and 6 regarding
 * viewpoints. While 4 spells them "ViewPoint", 6 spells them "Viewpoint".
 * @param {@vcmap/core#map} map vcs map object
 * @returns {Promise<Viewpoint>} ViewPoint resp. Viewpoint
 */
function getViewpointSync (map) {
    return getIsVc4() ? map.getViewPointSync() : map.getViewpointSync();
}

/**
 * There's a spelling difference between VCMap versions 4 and 6 regarding
 * viewpoints. While 4 spells them "ViewPoint", 6 spells them "Viewpoint".
 * @param {@vcmap/core#map} map vcs map object
 * @param {@vcmap/core#ViewPoint} viewpoint or viewPoint
 * @returns {void}
 */
function gotoViewpoint (map, viewpoint) {
    if (typeof viewpoint.groundPosition === "undefined") {
        return undefined;
    }
    return getIsVc4() ? map.gotoViewPoint(viewpoint) : map.gotoViewpoint(viewpoint);
}

/**
 * Checks if the VCMap version in use is version 4 by checking the existence of the vcm key in the vcs object.
 * @returns {Boolean} true if VCMap version 4 is in use, false otherwise
 */
function getIsVc4 () {
    const iframe = document.getElementById("obliqueIframe");

    return iframe?.contentWindow?.vcs?.vcm;
}

const actions = {
    /**
    * InitObliqueView creates a click listener at the map. Creates a listener at the olMap in the oblique application when the oblique aerial images have been moved in the sidebar.
    * Removes unwanted html elements once the iframe content has been loaded.
    * Sets the special MapMarker style for the oblique map
    * @param {Object} param store context
    * @param {Object} param.commit the commit
    * @param {Object} param.dispatch the dispatch
    * @param {Object} param.getters the getters
    * @param {Object} param.rootGetters the rootGetters
    * @returns {void}
    */
    initObliqueView ({commit, dispatch, getters, rootGetters}) {
        const iframe = document.getElementById("obliqueIframe");

        iframe?.addEventListener("load", () => {
            const observer = new MutationObserver(() => {
                const doc = iframe.contentWindow?.document,
                    vcs = iframe.contentWindow.vcs,
                    map = getActiveMap(vcs);

                if (!doc || !iframe || !vcs || !map) {
                    return;
                }

                const header = doc.getElementById("header"),
                    mapMenu = doc.getElementsByClassName("vcm-btn-icon single-first maptool-btn vcm-btn-base-default vcm-btn-base-splash-hover vcm-border vcm-border-dye03 vcm-btn-icon-font-default vcm-btn-icon-font-dye01-hover vcm-no-select vcm-btn-map-Oblique")[0],
                    overviewMap = doc.getElementsByClassName("overview-map-wrap")[0],
                    pixelCoordinate = mapCollection.getMap("2D").getPixelFromCoordinate(rootGetters["Maps/initialCenter"]),
                    mapElements = doc.getElementsByClassName("mapElement vcm-map-top");

                commit("Maps/setClickPixel", pixelCoordinate, {root: true});

                if (getIsVc4()) {
                    map.imageChanged.addEventListener(() => {
                        const vp = getViewpointSync(map);

                        if (!vp?.groundPosition) {
                            return;
                        }
                        const heading = vp.heading,
                            coordinates = rootGetters["Maps/clickCoordinate"] || rootGetters["Maps/initialCenter"];

                        if (heading !== getters.heading) {
                            dispatch("Maps/placingPointMarker", {rotation: heading, coordinates}, {root: true});
                        }
                        commit("setHeading", heading);
                    });

                    dispatch("obliqueView", rootGetters["Maps/center"] || rootGetters["Maps/initialCenter"])
                        .then(() => {
                            map.olMap.on("moveend", () => {
                                const transformedCoordinates = crs.transform("EPSG:4326", mapCollection.getMapView("2D").getProjection().getCode(), getViewpointSync(map).groundPosition);

                                transformedCoordinates.every((coordinate, index) => {
                                    if (Math.round(coordinate) !== Math.round(getters.lastCoordinates[index]) && (coordinate - getters.lastCoordinates[index] > 50 || coordinate - getters.lastCoordinates[index] < -50)) {
                                        dispatch("obliqueView", transformedCoordinates);
                                        return false;
                                    }
                                    return true;
                                });
                            });
                        });
                }
                else {
                    let isFirstImageChange = true;

                    map.imageChanged.addEventListener(() => {
                        const vp = getViewpointSync(map);

                        if (!vp?.groundPosition) {
                            return;
                        }
                        if (isFirstImageChange) {
                            isFirstImageChange = false;
                            dispatch("obliqueView", rootGetters["Maps/center"] || rootGetters["Maps/initialCenter"])
                                .then(() => {
                                    map.olMap.on("moveend", () => {
                                        const transformedCoordinates = crs.transform("EPSG:4326", mapCollection.getMapView("2D").getProjection().getCode(), getViewpointSync(map).groundPosition);

                                        transformedCoordinates.every((coordinate, index) => {
                                            if (Math.round(coordinate) !== Math.round(getters.lastCoordinates[index]) && (coordinate - getters.lastCoordinates[index] > 50 || coordinate - getters.lastCoordinates[index] < -50)) {
                                                dispatch("obliqueView", transformedCoordinates);
                                                return false;
                                            }
                                            return true;
                                        });
                                    });
                                });
                            return;
                        }
                        const heading = vp.heading,
                            coordinates = rootGetters["Maps/clickCoordinate"] || rootGetters["Maps/initialCenter"];

                        if (heading !== getters.heading) {
                            dispatch("Maps/placingPointMarker", {rotation: heading, coordinates}, {root: true});
                        }
                        commit("setHeading", heading);
                    });
                }

                if (getIsVc4() && header) {
                    header.style.display = "none";
                    header.parentElement.style.display = "none";

                    for (const element of mapElements) {
                        element.style.top = 0;
                    }
                }

                const layer = mapMarker.getMapmarkerLayerById("marker_point_layer");

                if (!getters.defaultMapMarkerStyleId) {
                    commit("setDefaultMapMarkerStyleId", layer.get("styleId"));
                }
                if (getters.styleId) {
                    mapMarker.getMapmarkerLayerById("marker_point_layer").set("styleId", getters.styleId);
                }
                if (mapMenu) {
                    mapMenu.style.display = "none";
                }
                if (overviewMap) {
                    overviewMap.style.display = "none";
                }
                observer.disconnect();
            });

            observer.observe(iframe.contentDocument, {
                childList: true,
                subtree: true
            });
        });
    },

    /**
    * Unregister the map listener. Resets the mapMarker style. Removes the MapMarker.
    * @param {Object} param store context
    * @param {Object} param.commit the commit
    * @param {Object} param.dispatch the dispatch
    * @param {Object} param.getters the getters
    * @returns {void}
    */
    resetObliqueViewer ({dispatch, getters}) {
        const layer = mapMarker.getMapmarkerLayerById("marker_point_layer");

        if (layer) {
            layer.set("styleId", getters.defaultMapMarkerStyleId || null);

            layer.changed();
        }

        dispatch("Maps/removePointMarker", null, {root: true});
    },

    /**
    * ObliqueView moves the map marker to the click position and centers the oblique aerial images at the point in the sidebar.
    * @param {Object} param store context
    * @param {Object} param.commit the commit
    * @param {Object} param.dispatch the dispatch
    * @param {Object} param.getters the getters
    * @param {Object} param.rootGetters the rootGetters
    * @param {Array} coordinates the click/center coordinate
    * @returns {void}
    */
    async obliqueView ({commit, dispatch, getters}, coordinates = []) {
        const vcs = document.getElementById("obliqueIframe")?.contentWindow?.vcs,
            map = getActiveMap(vcs);
        let viewPoint = {};

        if (map && coordinates && Array.isArray(coordinates) && coordinates.length > 1) {
            commit("setLastCoordinates", coordinates);

            const Viewpoint = getViewpointConstructor(vcs);

            if (Viewpoint) {
                viewPoint = new Viewpoint({
                    groundPosition: crs.transform(mapCollection.getMapView("2D").getProjection().getCode(), "EPSG:4326", coordinates),
                    heading: getters.heading,
                    distance: getViewpointSync(map).distance
                });
            }

            commit("Maps/setClickCoordinate", coordinates, {root: true});
            await gotoViewpoint(map, viewPoint);
            dispatch("Maps/placingPointMarker", {rotation: getters.heading, coordinates}, {root: true});
        }
        else {
            dispatch("Alerting/addSingleAlert",
                "<strong>" + i18next.t("additional:modules.vcOblique.frameworkUndefined") + "</strong>"
                + "<br>"
                + "<small>" + i18next.t("additional:modules.vcOblique.frameworkUndefinedMessage") + "</small>",
                {root: true}
            );
        }
    },
    /**
    * createObliqueViewerURL gets the initialCenter coordinate and creates the URL for the Oblique Map.
    * @param {Object} param store context
    * @param {Object} param.commit the commit
    * @param {Object} param.dispatch the dispatch
    * @param {Object} param.getters the getters
    * @param {Object} param.rootGetters the rootGetters
    * @param {Number[]} initialCenter the initial center coordinate
    * @returns {void}
    */
    createObliqueViewerURL ({commit, dispatch, getters, rootGetters}, initialCenter) {
        if (initialCenter && Array.isArray(initialCenter) && initialCenter.length > 1) {
            const transformedCoordinates = crs.transform(mapCollection.getMapView("2D").getProjection().getCode(), "EPSG:4326", initialCenter),
                startCoordinates = transformedCoordinates[0] + ", " + transformedCoordinates[1];

            if (document.location.hostname === "localhost") {
                commit("setObliqueViewerURL", document.location.origin + "/" + rootGetters.restServiceById(getters.serviceId).url.split("//")[1].replaceAll(".", "_") + "?groundPosition=" + startCoordinates);
            }
            else {
                dispatch("obliqueViewerURLWithSameHostname", startCoordinates);
            }
        }
    },

    /**
     * Checks if the oblique viewer url and called website have the same host and sets the url in the state.
     * Difference only in `www.` is handled separately.
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @param {Object} param.rootGetters the rootGetters
     * @param {String} startCoordinates The start coordinates
     * @returns {void}
     */
    obliqueViewerURLWithSameHostname ({commit, dispatch, getters, rootGetters}, startCoordinates) {
        const urlParts = rootGetters.restServiceById(getters.serviceId).url.split("https://")[1].split("/");

        if (document.location.hostname === urlParts[0]) {
            commit("setObliqueViewerURL", rootGetters.restServiceById(getters.serviceId).url + "?groundPosition=" + startCoordinates);
        }
        else if (document.location.hostname.startsWith("www.") && document.location.hostname.split("www.")[1] === urlParts[0]) {
            dispatch("obliqueViewerURLWithReplacedHostname", {urlParts, startCoordinates});
        }
        else {
            dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.vcOblique.sameOrigin"), {root: true});
        }
    },

    /**
     * Replaces the hostname of the oblique viewer url with the one of the called portal and sets it in state.
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {String} payload The payload
     * @param {String[]} payload.urlParts The parts of the url.
     * @param {String} payload.startCoordinates The start coordinates
     * @returns {void}
     */
    obliqueViewerURLWithReplacedHostname ({commit}, {urlParts, startCoordinates}) {
        let changedUrl = "https:/";

        urlParts.forEach((part, index) => {
            if (index === 0) {
                changedUrl = changedUrl + "/" + document.location.hostname;
            }
            else {
                changedUrl = changedUrl + "/" + part;
            }
        });

        commit("setObliqueViewerURL", changedUrl + "?groundPosition=" + startCoordinates);
    }
};

export default actions;
