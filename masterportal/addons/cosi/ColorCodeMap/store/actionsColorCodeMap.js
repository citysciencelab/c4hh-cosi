import {Fill, Stroke, Style, Text} from "ol/style.js";
import utils from "../../utils";
import {mapDistrictNames} from "../../DistrictSelector/utils/prepareDistrictLevels";
import {convertColor} from "@shared/js/utils/convertColor";
import {generateColorScale} from "../../utils/colorScale.js";

const actions = {

    /**
     * If name from config.json starts with "translate#", the corrected key is set to name here.
     * @param {object} state of this component
     * @param {string} payload name of this component
     * @returns {void}
     */
    renderVisualization ({commit, state, rootGetters}) {
        const selectedDistricts = rootGetters["Modules/DistrictSelector/selectedDistrictLevel"].districts.filter(district => district.isSelected === true);

        commit("setSelectedStatFeatures", selectedDistricts.map(district => district.statFeatures).flat());

        if (state.visualizationState) {
            const results = state.selectedStatFeatures.filter(x => x.get("kategorie") === state.selectedFeature),
                resultValues = results.map(x => {
                    const yearValue = x.get(state.yearSelector + state.selectedYear);

                    if (yearValue !== undefined) {
                        return yearValue;
                    }

                    return "noData";

                });

            commit("setLegendValues", results);
            const colorScale = generateColorScale(resultValues, "interpolateBlues");

            commit("setUpdateLegendList", state.updateLegendList += 1);
            rootGetters["Modules/DistrictSelector/selectedFeatures"].forEach(district => {
                const getStyling = district.getStyle(),
                    matchResults = results.find(
                        x => utils.unifyString(x.get(rootGetters["Modules/DistrictSelector/keyOfAttrNameStats"])) === utils.unifyString(mapDistrictNames(district.get(rootGetters["Modules/DistrictSelector/keyOfAttrName"]), rootGetters["Modules/DistrictSelector/selectedDistrictLevel"]))
                    );

                if (matchResults) {
                    if (this.originalStyling === null) {
                        this.originalStyling = getStyling;
                    }
                    const styleArray = [],
                        match_props = matchResults.get(state.yearSelector + state.selectedYear),
                        convertedColor = convertColor(colorScale.scale(match_props), "rgb"),
                        headText = new Style({
                            zIndex: 100,
                            text: new Text({
                                font: "16px Calibri, sans-serif",
                                fill: new Fill({
                                    color: [0, 0, 0]
                                }),
                                placement: "point",
                                backgroundFill: new Fill({
                                    color: [255, 255, 255]
                                }),
                                backgroundStroke: new Stroke({
                                    color: [0, 0, 0],
                                    width: 1
                                }),
                                padding: [5, 10, 5, 10],
                                text: matchResults.get(rootGetters["Modules/DistrictSelector/keyOfAttrNameStats"]),
                                offsetY: -35,
                                overflow: true
                            })
                        });

                    getStyling.fill = match_props !== undefined ? new Fill({color: [...convertedColor, 0.75]}) : new Fill({color: "rgba(0, 0, 0, 0.75)"});
                    getStyling.zIndex = 1;
                    getStyling.text = new Text({
                        font: "16px Calibri,sans-serif",
                        fill: new Fill({
                            color: [255, 255, 255]
                        }),
                        stroke: new Stroke({
                            color: [0, 0, 0],
                            width: 3
                        }),
                        text: match_props !== undefined
                            ? parseFloat(match_props).toLocaleString(this.currentLocale) + "\n(" + state.selectedYear + ")"
                            : "noData",
                        overflow: true
                    });
                    styleArray.push(new Style(getStyling));
                    if (state.lastYear) {
                        const additionalText = new Style({
                            zIndex: 2,
                            text: new Text({
                                font: "14px Calibri, sans-serif",
                                fill: new Fill({
                                    color: [0, 0, 0]
                                }),
                                stroke: new Stroke({
                                    color: [240, 240, 240],
                                    width: 2
                                }),
                                text: matchResults.get(state.yearSelector + state.lastYear) !== undefined
                                    ? state.lastYear + ": " + parseFloat(matchResults.get(state.yearSelector + state.lastYear)).toLocaleString("de-DE") + "  (" + parseFloat(Math.round((matchResults.get(state.yearSelector + state.lastYear) / match_props) * 100)) + "%)"
                                    : "noData",
                                offsetY: 25,
                                overflow: true
                            })
                        });

                        styleArray.push(additionalText);
                    }

                    styleArray.push(headText);

                    district.setStyle(styleArray);
                }
            });
        }
        else {
            rootGetters["Modules/DistrictSelector/selectedFeatures"].forEach(district => {
                const style = new Style({
                    fill: new Fill({color: "rgba(255, 255, 255, 0)"}),
                    stroke: new Stroke({color: "rgba(33, 132, 251, 1)", width: 8})
                });

                district.setStyle(style);
            });
        }
    }
};

export default actions;
