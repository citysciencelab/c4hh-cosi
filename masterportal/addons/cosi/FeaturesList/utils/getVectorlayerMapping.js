
/**
 * @description creates a new layer mapping object
 * @param {Object[]} layer the layer to map
 * @param {String} title - The title of the layer group
 * @returns {Object} the mapped and filtered vectorlayer
 */
export function createVectorLayerMappingObject (layer, title) {
    const keyOfAttrName = layer.mouseHoverField || "name",
        addressField = layer.addressField || "adresse",
        categoryField = layer.categoryField || layer.searchField;

    return {
        // hier die group erweitern und default für weighting?
        layerId: layer.id,
        id: layer.name,
        group: title,
        weighting: 1,
        numericalValues: layer.numericalValues || [],
        addressField: Array.isArray(addressField) // the address can be a single or multiple fields that will be combined for the table view
            ? addressField
            : [addressField],
        categoryField: Array.isArray(categoryField) // last search field, must be set in config.json
            ? categoryField[categoryField.length - 1]
            : categoryField,
        keyOfAttrName: Array.isArray(keyOfAttrName) // first mouse hover field
            ? keyOfAttrName[0]
            : keyOfAttrName,
        additionalValues: layer.additionalValues || []
    };
}

/**
 * @description Reducer function for the layers in a folder
 * @param {Object[]} layers the layers in the folder
 * @param {String} condition the condition to filter by
 * @param {String} title - The title of the folder
 * @returns {Object[]} the mapped and filtered vectorlayers
 */
function mapVectorLayersInFolder (layers, condition, title) {
    // console.log(layers);
    // console.log(condition);
    // console.log(title);


    return layers.reduce((layerlist, layer) => {
        if (layer[condition]) {
            layerlist.push(createVectorLayerMappingObject(layer, title));
        }
        return layerlist;
    }, []);
}

/**
 * @description Extracts the layer of a folder recursively
 * @param {*} folder - the folder to extract
 * @param {String} condition - the attribute that must be set (value or true) for a layer to qualify
 * @returns {Object[]} the flat layer array
 */
function flattenFolderLayers (folder, condition) {
    const layerElements = folder.elements.filter(element => element.type === "layer"),
        folderElements = folder.elements.filter(element => element.type === "folder");

    return (folderElements || []).reduce((layers, subFolder) => {
        return [...layers, ...flattenFolderLayers(subFolder, condition)];
    }, mapVectorLayersInFolder(layerElements || [], condition, folder.name));
}


/**
 * @description reads ou the analyzable vectorlayers from the portals config.json
 * @param {Object} topicsConfig -
 * @param {String} path - the folder path containing all analyzable layers
 * @param {String} condition - the attribute that must be set (value or true) for a layer to qualify
 * @param {String} misc - the name to group ungrouped layers by
 * @returns {Object[]} the layer mapping array
 */
// export default function getVectorlayerMapping (topicsConfig, path = ["Fachdaten - Analyse / Simulation"], condition = "isFacility", misc = "Sonstiges") {

export default function getVectorlayerMapping (topicsConfig, condition = "isFacility", misc = "Sonstiges") {
    // console.log(topicsConfig);

    const mapping = [];
    const vectorlayerHierarchy = topicsConfig.elements[0];
    // console.log(vectorlayerHierarchy);

    // follow the path down the folder structure to the destined folder containing the analysis layers
    // if (path.length > 1) {
    // for (let i = 1; i < path.length; i++) {
    //     if (vectorlayerHierarchy && vectorlayerHierarchy.elements) {
    //         console.log(path[i]);

    //         vectorlayerHierarchy = vectorlayerHierarchy.elements.find(folder => folder.name === path[i]);
    //     }
    // }
    // }

    if (vectorlayerHierarchy) {
        // add a group for each folder in the hierarchy
        if (Array.isArray(vectorlayerHierarchy.elements)) {
            for (const folder of vectorlayerHierarchy.elements) {
                if (folder.type !== "folder") {
                    continue;
                }
                else {
                    mapping.push({
                        group: folder.name,
                        layer: flattenFolderLayers(folder, condition)
                    });
                }
            }
        }

        // assign the not grouped layers to the misc category
        if (vectorlayerHierarchy.Layer && vectorlayerHierarchy.Layer.length) {
            mapping.push({
                group: misc,
                layer: mapVectorLayersInFolder(vectorlayerHierarchy.Layer, condition)
            });
        }
    }

    return mapping;
}

