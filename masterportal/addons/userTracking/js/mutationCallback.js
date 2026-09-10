import {handleClearRedoForFeatureForMeasure} from "./handler/handleClearRedoForFeatureForMeasure.js";
import {handleDrawInteraction} from "./handler/handleDrawInteraction.js";
import {handleDrawSetCircleRadius} from "./handler/handleDrawSetCircleRadius.js";
import {handleDrawSetColor} from "./handler/handleDrawSetColor.js";
import {handleDrawSetFillTransparency} from "./handler/handleDrawSetFillTransparency.js";
import {handleDrawSetFontName} from "./handler/handleDrawSetFontName.js";
import {handleDrawSetFontSize} from "./handler/handleDrawSetFontSize.js";
import {handleDrawSetShapeMethod} from "./handler/handleDrawSetShapeMethod.js";
import {handleDrawSetStrokeWidth} from "./handler/handleDrawSetStrokeWidth.js";
import {handleDrawSetText} from "./handler/handleDrawSetText.js";
import {handleDrawSetUnit} from "./handler/handleDrawSetUnit.js";
import {handleDrawSetVisibility} from "./handler/handleDrawSetVisibility.js";
import {handleSetProcessDataForPopulationRequest} from "./handler/handleSetProcessDataForPopulationRequest.js";
import {handleSetSearchedWfsSearch} from "./handler/handleSetSearchedWfsSearch.js";
import {convertRgbArrayToPackedColorValue} from "./util.js";

/**
 * Evaluates a committed Vuex mutation and triggers the corresponding Matomo tracking event.
 * @param {Object} mutation The committed Vuex mutation.
 * @param {String} mutation.type The type identifier of the mutation.
 * @param {*} mutation.payload The payload carried by the mutation.
 * @returns {void}
 */
export function mutationCallback (mutation) {
    try {
        switch (mutation.type) {
            case "Modules/Draw/incrementIdCounter":
                handleDrawInteraction("2026");
                break;
            case "Modules/Draw/setCircleOptions":
                if (mutation.payload.interactive !== undefined) {
                    handleDrawSetShapeMethod({
                        method: mutation.payload.interactive ? "interactive" : "defined",
                        shape: "circle",
                        version: "2026"
                    });
                }

                if (mutation.payload.innerRadius !== undefined) {
                    handleDrawSetCircleRadius({isOuter: false, value: mutation.payload.innerRadius, version: "2026"});
                }

                if (mutation.payload.outerRadius !== undefined) {
                    handleDrawSetCircleRadius({isOuter: true, value: mutation.payload.outerRadius, version: "2026"});
                }

                if (mutation.payload.unit !== undefined) {
                    handleDrawSetUnit(mutation.payload.unit, "2026");
                }

                break;
            case "Modules/Draw/setCurrentLayout":
                if (mutation.payload.fillColor !== undefined) {
                    handleDrawSetColor({
                        isOuter: false,
                        type: "fill",
                        value: convertRgbArrayToPackedColorValue(mutation.payload.fillColor),
                        version: "2026"
                    });
                }

                if (mutation.payload.fillTransparency !== undefined) {
                    handleDrawSetFillTransparency({
                        isOuter: false,
                        value: mutation.payload.fillTransparency,
                        version: "2026"
                    });
                }

                if (mutation.payload.font !== undefined) {
                    handleDrawSetFontName(mutation.payload.font, "2026");
                }

                if (mutation.payload.fontSize !== undefined) {
                    handleDrawSetFontSize(mutation.payload.fontSize, "2026");
                }

                if (mutation.payload.squareMethod !== undefined) {
                    handleDrawSetShapeMethod({
                        method: mutation.payload.squareMethod,
                        shape: "square",
                        version: "2026"
                    });
                }

                if (mutation.payload.strokeColor !== undefined) {
                    handleDrawSetColor({
                        isOuter: false,
                        type: "stroke",
                        value: convertRgbArrayToPackedColorValue(mutation.payload.strokeColor),
                        version: "2026"
                    });
                }

                if (mutation.payload.strokeWidth !== undefined) {
                    handleDrawSetStrokeWidth({
                        isOuter: false,
                        value: mutation.payload.strokeWidth,
                        version: "2026"
                    });
                }

                if (mutation.payload.text !== undefined) {
                    handleDrawSetText("2026");
                }

                break;
            case "Modules/Draw/setCurrentLayoutOuterCircle":
                if (mutation.payload.fillColor !== undefined) {
                    handleDrawSetColor({
                        isOuter: true,
                        type: "fill",
                        value: convertRgbArrayToPackedColorValue(mutation.payload.fillColor),
                        version: "2026"
                    });
                }

                if (mutation.payload.fillTransparency !== undefined) {
                    handleDrawSetFillTransparency({
                        isOuter: true,
                        value: mutation.payload.fillTransparency,
                        version: "2026"
                    });
                }

                if (mutation.payload.strokeColor !== undefined) {
                    handleDrawSetColor({
                        isOuter: true,
                        type: "stroke",
                        value: convertRgbArrayToPackedColorValue(mutation.payload.strokeColor),
                        version: "2026"
                    });
                }

                if (mutation.payload.strokeWidth !== undefined) {
                    handleDrawSetStrokeWidth({
                        isOuter: true,
                        value: mutation.payload.strokeWidth,
                        version: "2026"
                    });
                }

                break;
            case "Modules/Draw/setSelectedInteraction":
                if (mutation.payload === "") {
                    handleDrawSetVisibility(true, "2026");
                }
                else if (mutation.payload === "hide") {
                    handleDrawSetVisibility(false, "2026");
                }

                // to-be-added: handleDrawSetInteraction
                // options + main draw-tools
                // debounce for text
                break;
            case "Modules/Draw/setSelectedDrawType":
                // to-be-added: handleDrawSetDrawType
                // note: called multiple times
                //  -> combine with "setSelectedDrawTypeMain" to track it once
                //  or store previous non-empty value
                break;
            case "Modules/Draw/setSelectedDrawTypeMain":
                // to-be-added: handleDrawSetDrawType
                break;
            case "Modules/Measure/clearRedoForFeature":
                handleClearRedoForFeatureForMeasure();
                break;
            case "Modules/PopulationRequest/setProcessData":
                handleSetProcessDataForPopulationRequest(mutation.payload);
                break;
            case "Modules/WfsSearch/setSearched":
                handleSetSearchedWfsSearch(mutation.payload);
                break;
            default:
                break;
        }
    }
    catch (error) {
        console.error(`Vuex-store callback failed for mutation "${mutation.type}": ${error.stack}`);
    }
}
