import dayjs from "dayjs";
import thousandsSeparator from "../../src/utils/thousandsSeparator.js";

Backbone.Events.listenTo(Radio.channel("GFI"), {
    "changeFeature": updateMouseHoverAttribute
});

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
        absTrafficCarCount = "",
        absTrafficSVCount = "",
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
        else if (layerName.includes("Anzahl_SV") && layerName.indexOf(" | ") > -1 && absTrafficCount.indexOf(" | ") > -1) {
            absTrafficCarCount = getKfzTrafficCount(absTrafficCount, layerName, "Anzahl_Kfz");
            absTrafficSVCount = getKfzTrafficCount(absTrafficCount, layerName, "Anzahl_SV");
            absTrafficCount = carsHeaderSuffix + ": " + thousandsSeparator(absTrafficCarCount) + " " + direction + "<br><span class='title'>" + trucksHeaderSuffix + ": " + thousandsSeparator(absTrafficSVCount) + "</span>";
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
 * @param {String} type - Anzahl_Kfz or Anzahl_SV
 * @return {Number|String} the proportional count or "No data"
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
 * @return {String} time phenomenonTime converted with UTC
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
