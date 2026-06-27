import Cluster from "ol/source/Cluster";
import dayjs from "dayjs";
import mapCollection from "../../src/core/maps/js/mapCollection.js";
import thousandsSeparator from "../../src/shared/js/utils/thousandsSeparator.js";

/**
 * By moving on the feature of map to trigger the function to update the mouseover attribute
 * if the feature is from rad or kfz layer.
 * @return {void} -
 */
setTimeout(() => {
    const map = mapCollection.getMap("2D");

    if (typeof map !== "undefined") {
        map.on("pointermove", (evt) => {
            map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
                if (layer && layer.get("gfiTheme") === "trafficCount") {
                    if (layer.getSource().constructor === Cluster) {
                        feature.values_.features.forEach(childFeature => {
                            updateMouseHoverAttribute(childFeature);
                        });
                    }
                    else {
                        updateMouseHoverAttribute(feature);
                    }
                }
            });
        });
    }
}, 500);

/**
 * Setting the attributes in feature for mouseHover
 * @param {ol/Feature} feature - current feature from sensor layer
 * @return {void} -
 */
function updateMouseHoverAttribute (feature) {
    const dataStreamValue = feature.get("dataStreamValue"),
        dataDirection = feature.get("richtung"),
        layerName = feature.get("layerName") ? feature.get("layerName") : "",
        bicycleHeaderSuffix = i18next.t("additional:modules.tools.verkehrsfunctions.bicycleHeaderSuffix"),
        carsHeaderSuffix = i18next.t("additional:modules.tools.verkehrsfunctions.carsHeaderSuffix"),
        trucksHeaderSuffix = i18next.t("additional:modules.tools.verkehrsfunctions.trucksHeaderSuffix");

    let phenomenonTime = "",
        phenomenonTimeRange = "invalid date",
        absTrafficCount = "",
        direction = "";

    if (feature.get("Datastreams") && Array.isArray(feature.get("Datastreams")) && feature.get("Datastreams").length
        && feature.get("Datastreams")[0].Observations && Array.isArray(feature.get("Datastreams")[0].Observations)
        && feature.get("Datastreams")[0].Observations.length && feature.get("Datastreams")[0].Observations[0].phenomenonTime) {
        phenomenonTime = feature.get("Datastreams")[0].Observations[0].phenomenonTime;
    }

    if (phenomenonTime && phenomenonTime.split("/").length === 2) {
        const startTime = phenomenonTime.split("/")[0],
            endTime = phenomenonTime.split("/")[1];

        phenomenonTimeRange = getPhenomenonTimeRange(startTime, endTime);
    }

    if (typeof dataDirection === "string") {
        direction = "(" + dataDirection + ")";
    }

    if (dataStreamValue) {
        absTrafficCount = getAbsTrafficCount(dataStreamValue);
        if (layerName.includes("Anzahl_Fahrraeder")) {
            absTrafficCount = bicycleHeaderSuffix + ": " + thousandsSeparator(absTrafficCount) + " " + direction;
        }
        else if (layerName.includes("Anzahl_Kfz") && layerName.indexOf(" | ") === -1 && absTrafficCount.indexOf(" | ") === -1) {
            absTrafficCount = carsHeaderSuffix + ": " + thousandsSeparator(absTrafficCount) + " " + direction;
        }
        else if (layerName.includes("Anzahl_Schwerverkehr")) {
            absTrafficCount = trucksHeaderSuffix + ": " + thousandsSeparator(absTrafficCount) + " " + direction;
        }
    }

    feature.set("absTrafficCount", absTrafficCount);
    feature.set("phenomenonTimeRange", phenomenonTimeRange);
}

/**
 * Getting the absolute traffic count
 * @param {String} dataStreamValue - dataStream Value(s) of the current feature
 * @return {String} the absolute count or "No data"
 */
function getAbsTrafficCount (dataStreamValue) {
    let value = "No data";

    if (dataStreamValue !== undefined && dataStreamValue !== null) {
        value = dataStreamValue;
    }

    return value;
}

/**
 * Getting the KFZ and SV count
 * @param {String} absTrafficCount - dataStream Value(s) of the current feature
 * @param {String} layerName - layer name of the current feature
 * @param {String} type - "Anzahl_Kfz" or "Anzahl_SV"
 * @return {String} the proportional count or "No data"
 */
function getKfzTrafficCount (absTrafficCount, layerName, type) {
    let value = "No data";

    layerName.split(" | ").forEach((name, i) => {
        if (name.includes(type)) {
            value = absTrafficCount.split(" | ")[i];
        }
    });

    return value;
}

/**
 * Parsing the right date format
 * @param  {String} startTime - starting time of measuring a phenomenon
 * @param  {String} endTime - ending time of measuring a phenomenon
 * @return {String} time phenomenonTime
 */
function getPhenomenonTimeRange (startTime, endTime) {
    const startDay = dayjs(startTime).format("DD.MM.YYYY"),
        endDay = dayjs(endTime).format("DD.MM.YYYY");

    let time = "";

    if (startDay !== endDay) {
        time = dayjs(startTime).format("DD.MM.YYYY, HH:mm") +
            " Uhr - " + dayjs(endTime).add(1, "second").format("DD.MM.YYYY, HH:mm") + " Uhr";
    }
    else {
        time = dayjs(startTime).format("DD.MM.YYYY, HH:mm") +
            " Uhr - " + dayjs(endTime).add(1, "second").format("HH:mm") + " Uhr";
    }

    return time;
}

export {
    getAbsTrafficCount,
    getKfzTrafficCount,
    getPhenomenonTimeRange
};
