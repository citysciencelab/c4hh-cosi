import {handleAddImportedFilename} from "./handler/handleAddImportedFilename.js";
import {handleAddLayerToLayerConfig} from "./handler/handleAddLayerToLayerConfig.js";
import {handleAddLayerToTopicTree} from "./handler/handleAddLayerToTopicTree.js";
import {handleChangeCategory} from "./handler/handleChangeCategory.js";
import {handleChangeCurrentComponent} from "./handler/handleChangeCurrentComponent.js";
import {handleChangeMapMode} from "./handler/handleChangeMapMode.js";
import {handleChangeVisibility} from "./handler/handleChangeVisibility.js";
import {handleCreatePrintJob} from "./handler/handleCreatePrintJob.js";
import {handleDoRequestForSdpDownload} from "./handler/handleDoRequestForSdpDownload.js";
import {handleDrawInteractionOnDrawEventOld} from "./handler/handleDrawInteractionOnDrawEventOld.js";
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
            case "Modules/Draw_old/drawInteractionOnDrawEvent":
                handleDrawInteractionOnDrawEventOld();
                break;
            case "Modules/FileImport/addImportedFilename":
                handleAddImportedFilename();
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
        console.error(`Vuex-store callback failed for action "${action.type}"`);
    }
}
