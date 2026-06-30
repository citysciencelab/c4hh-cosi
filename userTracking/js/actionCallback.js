import {handleAddLayerToTopicTree} from "./handler/handleAddLayerToTopicTree.js";
import {handleChangeCategory} from "./handler/handleChangeCategory.js";
import {handleChangeCurrentComponent} from "./handler/handleChangeCurrentComponent.js";
import {handleChangeMapMode} from "./handler/handleChangeMapMode.js";
import {handleChangeVisibility} from "./handler/handleChangeVisibility.js";
import {handleCreatePrintJob} from "./handler/handleCreatePrintJob.js";
import {handleLayerNavigate} from "./handler/handleLayerNavigate.js";
import {handleMenuNavigateBack} from "./handler/handleMenuNavigateBack.js";
import {handleResetMenu} from "./handler/handleResetMenu.js";
import {handleSearch} from "./handler/handleSearch.js";

/**
 * Evaluates a dispatched Vuex action and triggers the corresponding Matomo tracking event.
 * @param {Object} store The vuex store.
 * @param {Object} action The dispatched Vuex action.
 * @param {String} action.type The type identifier of the action.
 * @param {Object} action.payload The payload carried by the action.
 * @returns {void}
 */
export function actionCallback (store, action) {
    switch (action.type) {
        case "changeCategory":
            handleChangeCategory(action.payload);
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
        case "Modules/LayerSelection/changeVisibility":
            handleChangeVisibility(action.payload, store);
            break;
        case "Modules/LayerSelection/navigateBack":
        case "Modules/LayerSelection/navigateForward":
            handleLayerNavigate(action.payload, store);
            break;
        case "Modules/Print/createPrintJob": {
            handleCreatePrintJob(action.payload);
            break;
        }
        case "Modules/SearchBar/addLayerToTopicTree":
            handleAddLayerToTopicTree(action.payload, store);
            break;
        case "Modules/SearchBar/search": {
            handleSearch(action.payload, store);
            break;
        }
        default:
            break;
    }
}
