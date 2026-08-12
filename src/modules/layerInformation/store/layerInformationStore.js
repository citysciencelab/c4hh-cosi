import {defineStore} from "pinia";
import actionsLayerInformation from "./actionsLayerInformation.js";
import gettersLayerInformation from "./gettersLayerInformation.js";

/**
 * Pinia store for the LayerInformation module.
 *
 * @module modules/layerInformation/store/layerInformationStore
 */
export const useLayerInformationStore = defineStore("layerInformation", {
    state: () => ({
        abstractText: "",
        customText: null,
        dateCreation: "",
        datePublication: "",
        dateRevision: "",
        downloadLinks: null,
        icon: "bi-info-circle",
        layerInfo: {},
        menuSide: "mainMenu",
        metaDataCatalogueId: "2",
        metaURLs: [],
        name: "common:modules.layerInformation.name",
        noMetadataLoaded: "",
        periodicityKey: "",
        showUrlGlobal: null,
        title: "",
        type: "layerInformation",
        legendAvailable: true,
        pointOfContact: "",
        publisher: "",
        selectedLayerIndex: 0
    }),

    getters: {
        ...gettersLayerInformation
    },

    actions: {
        ...actionsLayerInformation
    }
});
