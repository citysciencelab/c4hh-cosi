import {addVectorLayer, getModelByAttributes} from "../../utils/radioBridge.js";

/**
 * Sets additional attributes on the new layer
 * @param {Object} model - the layer from the imported file
 * @param {Object} attrs - the attrs to set
 * @returns {void}
 */
function setLayerAttributes (model) {
    model.set({
        gfiComplex: "true",
        gfiTheme: "default",
        typ: "GeoJSON",
        isFacility: true,
        alwaysOnTop: true,
        group: "DIPAS",
        mouseHoverField: "title",
        searchField: "category",
        addressField: "contributionType",
        numericalValues: [
            {
                id: "commentsNumber",
                name: "Anzahl Kommentare"
            },
            {
                id: "votingPro",
                name: "Pos. Bewertungen"
            },
            {
                id: "votingContra",
                name: "Neg. Bewertungen"
            }
        ]
    });
}

/**
 * Adds the layer to theme tree under the menu Importierte Daten
 * @param {{name: String, id: String, features: module:ol/Feature[]}} newLayer - the layer from the imported file
 * @returns {void}
 */
function addLayerToTree (newLayer) {
    const layerName = newLayer.name,
        layerId = newLayer.id,
        features = newLayer.features,
        isBaseLayer = newLayer.isBaseLayer || false;
    let gfiAttributes = Object();

    gfiAttributes = newLayer.project ? projectGfiAttributes() : contributionsGfiAttributes();

    addVectorLayer(layerName, layerId, features, "dipas", undefined, gfiAttributes, {isNeverVisibleInTree: true, isBaseLayer});

    return getModelByAttributes({type: "layer", id: newLayer.id});
}

/**
 * Returns the GFI Attributes for projects
 * @returns {void} the GFI attributes
 */
function projectGfiAttributes () {
    return {
        nameFull: "Projektname",
        dateStart: "Startdatum",
        dateEnd: "Enddatum",
        dipasPhase: "DIPAS Phase",
        website: "Website",
        owner: "Eigentümer",
        publisher: "Veröffentlicher"
    };
}

/**
 * Returns the GFI Attributes for contributions
 * @returns {void} the GFI attributes
 */
function contributionsGfiAttributes () {
    return {
        dateCreated: "Erstellungsdatum",
        title: "Titel",
        link: "Link",
        contributionType: "Beitragstyp",
        contributionContent: "Beitragstext",
        commentsNumber: "Anzahl Kommentare",
        category: "Kategorie",
        votingPro: "Pos. Bewertungen",
        votingContra: "Neg. Bewertung",
        belongToProject: "Verfahren",
        originalGeometryType: "Urspr. Geometrietyp",
        dipasLocated: "Ist verortet?"
    };
}

export default {
    /**
     * Adds a new DIPAS layer to the map, creates a menu model and sets up the filter
     * @param {Object} ctx.rootGetters - the rootGetters of the store
     * @param {Function} ctx.commit - the commit method of the store
     * @param {Object} newLayer - the new layer raw properties to add to the map
     * @returns {VectorBase} a new VectorBase Layer
     */
    addLayer ({rootGetters, commit}, newLayer) {
        const model = addLayerToTree(newLayer);

        setLayerAttributes(model, newLayer);

        // create a filter if the Layer is not a project area
        if (!newLayer.project) {
            const filter = {
                    layerId: newLayer.id,
                    title: newLayer.name,
                    strategy: "active",
                    showHits: true,
                    snippetTags: true,
                    paging: 500,
                    snippets: [
                        {title: contributionsGfiAttributes().contributionContent, attrName: "contributionContent", type: "text", operator: "IN", placeholder: "Beitragstext durchsuchen..."},
                        {title: contributionsGfiAttributes().votingPro, attrName: "votingPro", type: "sliderRange"},
                        {title: contributionsGfiAttributes().votingContra, attrName: "votingContra", type: "sliderRange"},
                        {title: contributionsGfiAttributes().commentsNumber, attrName: "commentsNumber", type: "sliderRange"},
                        {title: contributionsGfiAttributes().category, attrName: "category", type: "dropdown"},
                        {title: contributionsGfiAttributes().contributionType, attrName: "contributionType", type: "dropdown"},
                        {title: contributionsGfiAttributes().originalGeometryType, attrName: "originalGeometryType", type: "dropdown"},
                        {title: contributionsGfiAttributes().dipasLocated, attrName: "dipasLocated", type: "dropdown"}
                    ]
                },
                filters = rootGetters["Tools/Filter/layers"];

            commit("Tools/Filter/setLayers", [...filters, filter], {root: true});
        }

        return model;
    }
};
