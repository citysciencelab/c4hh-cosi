import crs from "@masterportal/masterportalapi/src/crs";
import mapMarker from "../../../src/core/maps/js/mapMarker";

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
    return map.getViewPointSync ? map.getViewPointSync() : map.getViewpointSync();
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
        console.warn("VCMap is not initialized. Please click the VCMap's home button or change the VCMap's configuration to have an initial view.");

        return undefined;
    }
    return map.gotoViewPoint ? map.gotoViewPoint(viewpoint) : map.gotoViewpoint(viewpoint);
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
                const header = iframe.contentWindow.document.getElementById("header"),
                    vc6Header = iframe.contentWindow.document.getElementsByTagName("header")[0],
                    mapMenu = iframe.contentWindow.document.getElementsByClassName("vcm-btn-icon single-first maptool-btn vcm-btn-base-default vcm-btn-base-splash-hover vcm-border vcm-border-dye03 vcm-btn-icon-font-default vcm-btn-icon-font-dye01-hover vcm-no-select vcm-btn-map-Oblique")[0],
                    overviewMap = iframe.contentWindow.document.getElementsByClassName("overview-map-wrap")[0],
                    vcs = document.getElementById("obliqueIframe").contentWindow.vcs,
                    map = getActiveMap(vcs),
                    pixelCoordinate = mapCollection.getMap("2D").getPixelFromCoordinate(rootGetters["Maps/initialCenter"]),
                    mapElements = iframe.contentWindow.document.getElementsByClassName("mapElement vcm-map-top");

                commit("Maps/setClickPixel", pixelCoordinate, {root: true});

                if (map) {
                    map.olMap.on("moveend", () => {
                        const transformedCooridnates = crs.transform("EPSG:4326", mapCollection.getMapView("2D").getProjection().getCode(), getViewpointSync(map).groundPosition);

                        transformedCooridnates.every((coordinate, index) => {
                            if (Math.round(coordinate) !== Math.round(getters.lastCoordinates[index]) && (coordinate - getters.lastCoordinates[index] > 50 || coordinate - getters.lastCoordinates[index] < -50)) {
                                dispatch("obliqueView", transformedCooridnates);
                                return false;
                            }
                            return true;
                        });
                    });

                    map.imageChanged.addEventListener(() => {
                        const heading = getViewpointSync(map).heading,
                            coordinates = rootGetters["Maps/clickCoordinate"] ? rootGetters["Maps/clickCoordinate"] : rootGetters["Maps/initialCenter"];

                        if (heading !== getters.heading) {
                            dispatch("Maps/placingPointMarker", {rotation: heading, coordinates}, {root: true});
                        }
                        commit("setHeading", heading);
                    });
                }

                if (header) {
                    header.style.display = "none";
                    header.parentElement.style.display = "none";

                    for (const element of mapElements) {
                        element.style.top = 0;
                    }

                    dispatch("obliqueView", rootGetters["Maps/center"]);
                    observer.disconnect();
                }
                if (header || vc6Header) {
                    mapMarker.getMapmarkerLayerById("marker_point_layer").get("styleId");
                    commit("setDefaultMapMarkerStyleId", mapMarker.getMapmarkerLayerById("marker_point_layer").get("styleId"));
                    if (getters.styleId) {
                        mapMarker.getMapmarkerLayerById("marker_point_layer").set("styleId", getters.styleId);
                    }
                }
                if (mapMenu) {
                    mapMenu.style.display = "none";
                }
                if (overviewMap) {
                    overviewMap.style.display = "none";
                }
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
        mapMarker.getMapmarkerLayerById("marker_point_layer").set("styleId", getters.defaultMapMarkerStyleId);
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

            await gotoViewpoint(map, viewPoint);
            commit("Maps/setClickCoordinate", coordinates, {root: true});
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
