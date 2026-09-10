import {handleActivateActionforSearchBar} from "./handler/handleActivateActionforSearchBar.js";
import {handleAddImportedFilename} from "./handler/handleAddImportedFilename.js";
import {handleAddLayerToLayerConfig} from "./handler/handleAddLayerToLayerConfig.js";
import {handleAddLayerToTopicTree} from "./handler/handleAddLayerToTopicTree.js";
import {handleChangeCategory} from "./handler/handleChangeCategory.js";
import {handleChangeCurrentComponent} from "./handler/handleChangeCurrentComponent.js";
import {handleChangeLocale} from "./handler/handleChangeLocale.js";
import {handleChangeMapMode} from "./handler/handleChangeMapMode.js";
import {handleChangeVisibility} from "./handler/handleChangeVisibility.js";
import {handleCreatePrintJob} from "./handler/handleCreatePrintJob.js";
import {handleDoRequestForSdpDownload} from "./handler/handleDoRequestForSdpDownload.js";
import {handleDrawClearLayer} from "./handler/handleDrawClearLayer.js";
import {handleDrawClickDownload} from "./handler/handleDrawClickDownload.js";
import {handleDrawInteractionOld} from "./handler/handleDrawInteractionOld.js";
import {handleDrawRedoAndUndo} from "./handler/handleDrawRedoAndUndo.js";
import {handleDrawSetCircleRadius} from "./handler/handleDrawSetCircleRadius.js";
import {handleDrawSetColor} from "./handler/handleDrawSetColor.js";
import {handleDrawSetDownloadFormat} from "./handler/handleDrawSetDownloadFormat.js";
import {handleDrawSetDrawType} from "./handler/handleDrawSetDrawType.js";
import {handleDrawSetFillTransparency} from "./handler/handleDrawSetFillTransparency.js";
import {handleDrawSetFontName} from "./handler/handleDrawSetFontName.js";
import {handleDrawSetFontSize} from "./handler/handleDrawSetFontSize.js";
import {handleDrawSetInteraction} from "./handler/handleDrawSetInteraction.js";
import {handleDrawSetShapeMethod} from "./handler/handleDrawSetShapeMethod.js";
import {handleDrawSetStrokeWidth} from "./handler/handleDrawSetStrokeWidth.js";
import {handleDrawSetText} from "./handler/handleDrawSetText.js";
import {handleDrawSetUnit} from "./handler/handleDrawSetUnit.js";
import {handleDrawSetVisibility} from "./handler/handleDrawSetVisibility.js";
import {handleFetchDirections} from "./handler/handleFetchDirections.js";
import {handlefetchIsochrones} from "./handler/handlefetchIsochrones.js";
import {handleFormatInputForCoordToolkit} from "./handler/handleFormatInputForCoordToolkit.js";
import {handleLayerNavigate} from "./handler/handleLayerNavigate.js";
import {handleMenuNavigateBack} from "./handler/handleMenuNavigateBack.js";
import {handlePositionClickedForCoordToolkit} from "./handler/handlePositionClickedForCoordToolkit.js";
import {handleRemoveLayer} from "./handler/handleRemoveLayer.js";
import {handleReplaceByIdInLayerConfig} from "./handler/handleReplaceByIdInLayerConfig.js";
import {handleResetMenu} from "./handler/handleResetMenu.js";
import {handleRotate} from "./handler/handleRotate.js";
import {handleSearch} from "./handler/handleSearch.js";
import {handleToggleMenu} from "./handler/handleToggleMenu.js";
import {handleUpdateLayerTransparency} from "./handler/handleUpdateLayerTransparency.js";
import {convertRgbStringToPackedColorValue} from "./util.js";

/**
 * Evaluates a dispatched Vuex action and triggers the corresponding Matomo tracking event.
 * @param {Object} action The dispatched Vuex action.
 * @param {String} action.type The type identifier of the action.
 * @param {Object} action.payload The payload carried by the action.
 * @param {Object} store The vuex store.
 * @returns {void}
 */
export function actionCallback (action, store) {
    try {
        switch (action.type) {
            case "addLayerToLayerConfig":
                handleAddLayerToLayerConfig(action.payload);
                break;
            case "changeCategory":
                handleChangeCategory(action.payload);
                break;
            case "replaceByIdInLayerConfig":
                handleReplaceByIdInLayerConfig(action.payload, store);
                break;
            case "Controls/Rotation/rotateClockwise":
                handleRotate(true);
                break;
            case "Controls/Rotation/rotateCounterClockwise":
                handleRotate(false);
                break;
            case "Maps/changeMapMode":
                handleChangeMapMode(action.payload);
                break;
            case "Menu/changeCurrentComponent":
                handleChangeCurrentComponent(action.payload, store);
                break;
            case "Menu/navigateBack":
                handleMenuNavigateBack(action.payload, store);
                break;
            case "Menu/resetMenu":
                handleResetMenu(action.payload, store);
                break;
            case "Menu/toggleMenu":
                handleToggleMenu(action.payload);
                break;
            case "Modules/CoordToolkit/formatInput":
                handleFormatInputForCoordToolkit();
                break;
            case "Modules/CoordToolkit/positionClicked":
                handlePositionClickedForCoordToolkit();
                break;
            case "Modules/Draw_old/clearLayer":
                handleDrawClearLayer();
                break;
            case "Modules/Draw_old/drawInteractionOnDrawEvent":
                handleDrawInteractionOld(action.payload, store);
                break;
            case "Modules/Draw_old/fileDownloaded":
                handleDrawClickDownload();
                break;
            case "Modules/Draw_old/redoLastStep":
                handleDrawRedoAndUndo(false);
                break;
            case "Modules/Draw_old/setCircleMethod":
                handleDrawSetShapeMethod({
                    method: action.payload.target.value,
                    shape: "circle"
                });
                break;
            case "Modules/Draw_old/setCircleRadius":
                handleDrawSetCircleRadius({isOuter: false, value: action.payload});
                break;
            case "Modules/Draw_old/setCircleOuterRadius":
                handleDrawSetCircleRadius({isOuter: true, value: action.payload});
                break;
            case "Modules/Draw_old/setColor":
                handleDrawSetColor({
                    isOuter: false,
                    type: "fill",
                    value: convertRgbStringToPackedColorValue(
                        action.payload.target.value
                    )
                });
                break;
            case "Modules/Draw_old/setColorContour":
                handleDrawSetColor({
                    isOuter: false,
                    type: "stroke",
                    value: convertRgbStringToPackedColorValue(
                        action.payload.target.value
                    )
                });
                break;
            case "Modules/Draw_old/setDownloadSelectedFormat":
                handleDrawSetDownloadFormat(action.payload);
                break;
            case "Modules/Draw_old/setDrawType":
                handleDrawSetDrawType(
                    action.payload.target.options[action.payload.target.selectedIndex].id
                        .replace("draw", "")
                        .replace("write", "")
                );
                break;
            case "Modules/Draw_old/setFont":
                handleDrawSetFontName(action.payload.target.value);
                break;
            case "Modules/Draw_old/setFontSize":
                handleDrawSetFontSize(action.payload.target.value);
                break;
            case "Modules/Draw_old/setOpacity":
                handleDrawSetFillTransparency({
                    isOuter: false,
                    value: Math.round((1 - parseFloat(action.payload.target.value, 10)) * 100)
                });
                break;
            case "Modules/Draw_old/setOuterColorContour":
                handleDrawSetColor({
                    isOuter: true,
                    type: "stroke",
                    value: convertRgbStringToPackedColorValue(
                        action.payload.target.value
                    )
                });
                break;
            case "Modules/Draw_old/setSquareMethod":
                handleDrawSetShapeMethod({
                    method: action.payload.target.value,
                    shape: "square"
                });
                break;
            case "Modules/Draw_old/setStrokeWidth":
                handleDrawSetStrokeWidth({
                    isOuter: false,
                    value: parseInt(action.payload.target.value, 10)
                });
                break;
            case "Modules/Draw_old/setText":
                handleDrawSetText();
                break;
            case "Modules/Draw_old/setUnit":
                handleDrawSetUnit(action.payload.target.value);
                break;
            case "Modules/Draw_old/toggleInteraction":
                handleDrawSetInteraction(action.payload);
                break;
            case "Modules/Draw_old/undoLastStep":
                handleDrawRedoAndUndo(true);
                break;
            case "Modules/Draw_old/updateDrawLayerVisible":
                handleDrawSetVisibility(action.payload.value);
                break;
            case "Modules/FileImport/addImportedFilename":
                handleAddImportedFilename();
                break;
            case "Modules/Language/changeLocale":
                handleChangeLocale(action.payload);
                break;
            case "Modules/LayerSelection/changeVisibility":
                handleChangeVisibility(action.payload, store);
                break;
            case "Modules/LayerSelection/navigateBack":
            case "Modules/LayerSelection/navigateForward":
                handleLayerNavigate(action.payload, store);
                break;
            case "Modules/LayerTree/updateTransparency":
                handleUpdateLayerTransparency(action.payload, store);
                break;
            case "Modules/LayerTree/removeLayer":
                handleRemoveLayer(action.payload, store);
                break;
            case "Modules/Print/createPrintJob":
                handleCreatePrintJob(action.payload);
                break;
            case "Modules/Routing/Directions/fetchDirections":
                handleFetchDirections();
                break;
            case "Modules/Routing/Isochrones/fetchIsochrones":
                handlefetchIsochrones();
                break;
            case "Modules/SdpDownload/doRequest":
                handleDoRequestForSdpDownload();
                break;
            case "Modules/SearchBar/activateAction":
                handleActivateActionforSearchBar(action.payload, store);
                break;
            case "Modules/SearchBar/addLayerToTopicTree":
                handleAddLayerToTopicTree(action.payload, store);
                break;
            case "Modules/SearchBar/search":
                handleSearch(action.payload, store);
                break;
            default:
                break;
        }
    }
    catch (error) {
        console.error(`Vuex-store callback failed for action "${action.type}": ${error.stack}`);
    }
}
