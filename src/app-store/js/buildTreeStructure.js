import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import getNestedValues from "@shared/js/utils/getNestedValues.js";
import {sortObjects} from "@shared/js/utils/sortObjects.js";
import {treeBaselayersKey, treeSubjectsKey} from "@shared/js/utils/constants.js";
import {uniqueId} from "@shared/js/utils/uniqueId.js";
import layerTypes from "@core/layers/js/layerTypes.js";

/**
 * Returns all layer from services.json to add to states layerConfig for treetype 'auto', besides background-layers.
 * The layers are sorted and grouped by metadata-name. All folders and elements get ids and parentIds.
 * @module app-store/js/buildTreeStructure
 * @param  {Object[]} layerList - the filtered raw layer list
 * @param  {Object} layerConfig configuration of layer like in the config.json, to get background-layer from
 * @param  {String} category the category to get the tree for
 * @param  {Object} [shownLayerConfs=[]] configuration of layer to show on first level of tree, configured in config.json
 * @param  {Boolean} [categoryChanged=false] if true, category has changed
 * @returns {Object} tree structure as json object
 */
function build (layerList, layerConfig, category, shownLayerConfs = [], categoryChanged = false) {
    const categoryKey = category?.key,
        groups = {},
        folder = {
            elements: []
        },
        layersByMdName = {};

    if (!category) {
        return layerList;
    }

    const {bgLayerIds, subjectDataLayers} = prepareConfiguredLayers(layerList, layerConfig, folder, categoryChanged);

    addLayersToFolder(layerList, folder, groups, layersByMdName, bgLayerIds, subjectDataLayers, shownLayerConfs, categoryKey);

    return folder;
}

/**
 * Prepares background layer ids and subject data layers from the given layer configuration.
 * @param {Object[]} layerList the filtered raw layer list
 * @param {Object} layerConfig configuration of layer like in the config.json
 * @param {Object} folder root folder to add already configured folders to
 * @param {Boolean} categoryChanged true if category has changed
 * @returns {Object} object containing background layer ids and subject data layers
 */
function prepareConfiguredLayers (layerList, layerConfig, folder, categoryChanged) {
    let bgLayerIds = [],
        subjectDataLayers = [];

    if (layerConfig) {
        bgLayerIds = getBackgroundLayerIds(layerConfig);

        if (layerConfig[treeSubjectsKey]) {
            subjectDataLayers = prepareSubjectDataLayers(layerList, layerConfig, folder, categoryChanged);
        }
    }

    return {
        bgLayerIds,
        subjectDataLayers
    };
}

/**
 * Returns ids of all configured background layers.
 * @param {Object} layerConfig configuration of layer like in the config.json
 * @returns {String[]} background layer ids
 */
function getBackgroundLayerIds (layerConfig) {
    const bgLayers = getNestedValues(layerConfig[treeBaselayersKey], "elements", true).flat(Infinity);

    return getIdsOfLayers(bgLayers);
}

/**
 * Prepares subject data layers and handles 3D layer configuration.
 * @param {Object[]} layerList the filtered raw layer list
 * @param {Object} layerConfig configuration of layer like in the config.json
 * @param {Object} folder root folder to add already configured folders to
 * @param {Boolean} categoryChanged true if category has changed
 * @returns {Object[]} subject data layers
 */
function prepareSubjectDataLayers (layerList, layerConfig, folder, categoryChanged) {
    let subjectDataLayers = getNestedValues(layerConfig[treeSubjectsKey], "elements", true).flat(Infinity);
    const layers3D = get3DLayers(subjectDataLayers);

    if (categoryChanged) {
        subjectDataLayers = layers3D;
        layerConfig[treeSubjectsKey].elements = [];
    }

    if (layers3D.length > 0 && layers3D.length === subjectDataLayers.length) {
        folder.elements = layerConfig[treeSubjectsKey].elements ? layerConfig[treeSubjectsKey].elements : layerConfig[treeSubjectsKey];
    }
    else if (!categoryChanged && layers3D.length > 0) {
        handleMixedSubjectDataLayers(layerList, layerConfig, folder, subjectDataLayers);
    }
    else {
        subjectDataLayers = [];
    }

    return subjectDataLayers;
}

/**
 * Handles subject data layers if configured 3D and non-3D layers are mixed.
 * @param {Object[]} layerList the filtered raw layer list
 * @param {Object} layerConfig configuration of layer like in the config.json
 * @param {Object} folder root folder to add 3D folders to
 * @param {Object[]} subjectDataLayers configured subject data layers
 * @returns {void}
 */
function handleMixedSubjectDataLayers (layerList, layerConfig, folder, subjectDataLayers) {
    layerConfig[treeSubjectsKey].elements.forEach(element => {
        const nestedLayers = getNestedValues(element, "elements", true).flat(Infinity);

        if (element.type === "folder" && containsOnly3DLayer(nestedLayers)) {
            folder.elements.push(element);
        }
        else {
            replaceLayerConfiguration(layerList, subjectDataLayers, element);
        }
    });
}

/**
 * Replaces raw layer configuration with configured layer values.
 * @param {Object[]} layerList the filtered raw layer list
 * @param {Object[]} subjectDataLayers configured subject data layers
 * @param {Object} element configured layer element
 * @returns {void}
 */
function replaceLayerConfiguration (layerList, subjectDataLayers, element) {
    const rawLayerConfig = layerList.find(layer => layer.id === element.id);

    if (rawLayerConfig) {
        const index = subjectDataLayers.findIndex(layer => layer.id === rawLayerConfig.id),
            replacement = Object.assign({}, rawLayerConfig, element);

        layerList.splice(layerList.indexOf(rawLayerConfig), 1, replacement);
        subjectDataLayers.splice(index, 1);
    }
}

/**
 * Adds all valid raw layers to the folder structure.
 * @param {Object[]} layerList the filtered raw layer list
 * @param {Object} folder root folder
 * @param {Object} groups layers grouped by group name and metadata name
 * @param {Object} layersByMdName layers grouped by metadata name
 * @param {String[]} bgLayerIds background layer ids
 * @param {Object[]} subjectDataLayers configured subject data layers
 * @param {Object[]} shownLayerConfs configured layers to show on first level
 * @param {String} categoryKey category key
 * @returns {void}
 */
function addLayersToFolder (layerList, folder, groups, layersByMdName, bgLayerIds, subjectDataLayers, shownLayerConfs, categoryKey) {
    for (let i = 0; i < layerList.length; i++) {
        const rawLayer = layerList[i];

        if (shouldSkipLayer(rawLayer, bgLayerIds, subjectDataLayers)) {
            continue;
        }

        normalizeEmptyCategory(rawLayer, categoryKey);

        if (hasCategory(rawLayer, categoryKey)) {
            applyShownLayerConfiguration(rawLayer, shownLayerConfs);
            addLayerToGroups(rawLayer, folder, groups, layersByMdName, categoryKey);
        }
    }
}

/**
 * Returns true if the given raw layer should not be added to the tree.
 * @param {Object} rawLayer raw layer
 * @param {String[]} bgLayerIds background layer ids
 * @param {Object[]} subjectDataLayers configured subject data layers
 * @returns {Boolean} true if the layer should be skipped
 */
function shouldSkipLayer (rawLayer, bgLayerIds, subjectDataLayers) {
    return bgLayerIds.indexOf(rawLayer.id) > -1 ||
        subjectDataLayers.find(conf => conf.id === rawLayer.id) !== undefined;
}

/**
 * Replaces empty category values with the no-category translation key.
 * @param {Object} rawLayer raw layer
 * @param {String} categoryKey category key
 * @returns {void}
 */
function normalizeEmptyCategory (rawLayer, categoryKey) {
    if (rawLayer.datasets[0] && (rawLayer.datasets[0][categoryKey] === ""
        || Array.isArray(rawLayer.datasets[0][categoryKey]) && rawLayer.datasets[0][categoryKey].length === 0
        || Array.isArray(rawLayer.datasets[0][categoryKey]) && rawLayer.datasets[0][categoryKey].length === 1 && rawLayer.datasets[0][categoryKey][0] === "")) {
        rawLayer.datasets[0][categoryKey] = "common:modules.layerTree.noCategory";
    }
}

/**
 * Returns true if the given layer has a value for the category key.
 * @param {Object} rawLayer raw layer
 * @param {String} categoryKey category key
 * @returns {Boolean} true if the layer has the category key
 */
function hasCategory (rawLayer, categoryKey) {
    return rawLayer.datasets[0] && rawLayer.datasets[0][categoryKey] !== undefined;
}

/**
 * Applies configured shown layer values to the raw layer.
 * @param {Object} rawLayer raw layer
 * @param {Object[]} shownLayerConfs configured layers to show on first level
 * @returns {void}
 */
function applyShownLayerConfiguration (rawLayer, shownLayerConfs) {
    shownLayerConfs.forEach(layerConf => {
        if (layerConf.id === rawLayer.id) {
            Object.assign(rawLayer, layerConf);
        }
    });
}

/**
 * Adds the given layer to all configured category groups.
 * @param {Object} rawLayer raw layer
 * @param {Object} folder root folder
 * @param {Object} groups layers grouped by group name and metadata name
 * @param {Object} layersByMdName layers grouped by metadata name
 * @param {String} categoryKey category key
 * @returns {void}
 */
function addLayerToGroups (rawLayer, folder, groups, layersByMdName, categoryKey) {
    const groupNames = getGroupNames(rawLayer, categoryKey),
        id = rawLayer.id;

    for (let j = 0; j < groupNames.length; j++) {
        addLayerToGroup(rawLayer, folder, groups, layersByMdName, groupNames[j], id);
    }
}

/**
 * Adds the given layer to one category group.
 * @param {Object} rawLayer raw layer
 * @param {Object} folder root folder
 * @param {Object} groups layers grouped by group name and metadata name
 * @param {Object} layersByMdName layers grouped by metadata name
 * @param {String} groupName name of the category group
 * @param {String} id id of the raw layer
 * @returns {void}
 */
function addLayerToGroup (rawLayer, folder, groups, layersByMdName, groupName, id) {
    const mdName = rawLayer.datasets[0].md_name;
    let isFirstLayer = true;

    if (layersByMdName[mdName] && layersByMdName[mdName].find(aLayer => aLayer.id === id)) {
        return;
    }

    isFirstLayer = isFirstLayerWithMdName(layersByMdName, rawLayer, mdName);

    if (!Object.keys(groups).find((key) => key === groupName)) {
        addGroup(folder, groups, groupName);
    }

    const subFolder = folder.elements.find((obj) => obj.name === groupName);

    if (subFolder.id === undefined) {
        subFolder.id = getId();
    }

    addLayerToMetadataGroup(rawLayer, subFolder, groups, layersByMdName, groupName, mdName, isFirstLayer);
}

/**
 * Adds the given layer to its metadata group.
 * @param {Object} rawLayer raw layer
 * @param {Object} subFolder category folder
 * @param {Object} groups layers grouped by group name and metadata name
 * @param {Object} layersByMdName layers grouped by metadata name
 * @param {String} groupName name of the category group
 * @param {String} mdName metadata name of the layer
 * @param {Boolean} isFirstLayer true if this is the first layer with the given metadata name
 * @returns {void}
 */
function addLayerToMetadataGroup (rawLayer, subFolder, groups, layersByMdName, groupName, mdName, isFirstLayer) {
    if (!Object.keys(groups[groupName]).find((key) => key === mdName)) {
        groups[groupName][mdName] = [];

        if (isFirstLayer) {
            addSingleLayer(subFolder, rawLayer, mdName);
        }
        else {
            addSubGroup(subFolder, groups, groupName, mdName);
        }
    }

    if (!isFirstLayer) {
        addLayerToMetadataFolder(rawLayer, subFolder, groups, layersByMdName, groupName, mdName);
    }
}

/**
 * Adds a layer to an existing metadata folder or creates such a folder if needed.
 * @param {Object} rawLayer raw layer
 * @param {Object} subFolder category folder
 * @param {Object} groups layers grouped by group name and metadata name
 * @param {Object} layersByMdName layers grouped by metadata name
 * @param {String} groupName name of the category group
 * @param {String} mdName metadata name of the layer
 * @returns {void}
 */
function addLayerToMetadataFolder (rawLayer, subFolder, groups, layersByMdName, groupName, mdName) {
    const mdNameFolder = subFolder.elements.find((obj) => obj.name === mdName);
    let parentId = mdNameFolder ? mdNameFolder.id : subFolder.id;

    if (layersByMdName[mdName].length === 2) {
        parentId = moveFirstLayerToFolder(subFolder, groups, layersByMdName, groupName, mdName);
    }

    rawLayer.parentId = parentId;
    groups[groupName][mdName].push(rawLayer);
    sortObjects(groups[groupName][mdName], "name");
}

/**
 * Sets unique random ids at folders and recursive at all subfolders.
 * @param {Array} folders folders to set ids at
 * @returns {void}
 */
function setIdsAtFolders (folders) {
    folders.forEach(folder => {
        folder.id = getId();
        setIdsAtSubFolders(folder);
    });
}
/**
 * Sets unique random ids at folders and recursive at all subfolders.
 * Sets parentId at each element under a folder.
 * @param {Object} folder folder containes elements
 * @returns {void}
 */
function setIdsAtSubFolders (folder) {
    folder.elements?.forEach(element => {
        if (element.type === "folder") {
            element.id = getId();
            setIdsAtSubFolders(element);
        }
        element.parentId = folder.id;
    });
}
/**
 * Returns a unique id with prefix 'folder-'.
 * @returns {String} unique id
 */
function getId () {
    return uniqueId("folder-");
}
/**
 * Returns true, if all layers are 3D-layer.
 * @param {Array} layers containing layer configurations
 * @returns {Boolean} true, if all layers are 3D-layer.
 */
function containsOnly3DLayer (layers) {
    return get3DLayersWithGrouped(layers).every(conf => layerTypes.getLayerTypes3d().includes(rawLayerList.getLayerWhere({id: conf.id})?.typ?.toUpperCase()));
}
/**
 * Returns all 3D-layers with typ contained in layerTypes.getLayerTypes3d().
 * @param {Array} layers containing layer configurations
 * @returns {Array} all 3D-layers
 */
function get3DLayers (layers) {
    return get3DLayersWithGrouped(layers).filter(conf => layerTypes.getLayerTypes3d().includes(rawLayerList.getLayerWhere({id: conf.id})?.typ?.toUpperCase()));
}

/**
 * Returns all 3D layers inculding children of grouped layers.
 * @param {Array} layers containing layer configurations
 * @returns {Array} all 3D layers
 */
function get3DLayersWithGrouped (layers) {
    const grouped = layers.filter(conf => conf.typ === "GROUP3D"),
        notGrouped = layers.filter(conf => conf.typ !== "GROUP3D");

    grouped.forEach(group => {
        notGrouped.concat(group.children);
    });

    return notGrouped;
}

/**
 * Moves the first layer with given mdName to subfolder.
 * @param {Object} subFolder sub Folder
 * @param {Object} groups layers by groupname and netatdata-name
 * @param {Object} layersByMdName contains lists of layers grouped by matadata-name
 * @param {String} groupName name of the group (category) in layers first dataset
 * @param {String} mdName metadata-name of the layer
 * @returns {void}
 */
function moveFirstLayerToFolder (subFolder, groups, layersByMdName, groupName, mdName) {
    const firstLayer = layersByMdName[mdName][0],
        subToAdd = {};

    groups[groupName][mdName] = [];
    removeLayerById(subFolder.elements, firstLayer.id);
    subToAdd.elements = groups[groupName][mdName];
    subToAdd.name = mdName;
    subToAdd.type = "folder";
    subToAdd.id = getId();
    subToAdd.parentId = subFolder.id;
    subFolder.elements.push(subToAdd);
    sortObjects(subFolder.elements, "name");
    firstLayer.parentId = subToAdd.id;
    groups[groupName][mdName].push(firstLayer);
    return subToAdd.id;
}

/**
 * Adds a single layer to sub folder and assigns the metadata-name to the name.
 * @param {Object} subFolder sub Folder
 * @param {Object} layer the raw layer
 * @param {String} mdName metadata-name of the layer
 * @returns {void}
 */
function addSingleLayer (subFolder, layer, mdName) {
    if (!Array.isArray(subFolder.elements)) {
        subFolder.elements = [];
    }
    layer.parentId = subFolder.id;
    subFolder.elements.push(Object.assign({}, layer, {name: mdName}));
    sortObjects(subFolder.elements, "name");
}

/**
 * Adds layers from groups to subfolder.
 * @param {Object} subFolder sub Folder
 * @param {Object} groups layers by groupname and netatdata-name
 * @param {String} groupName name of the group (category) in layers first dataset
 * @param {String} mdName metadata-name of the layer
 * @returns {void}
 */
function addSubGroup (subFolder, groups, groupName, mdName) {
    const subToAdd = {};

    subToAdd.elements = groups[groupName][mdName];
    subToAdd.name = mdName;
    subToAdd.type = "folder";
    subToAdd.id = getId();
    subToAdd.parentId = subFolder.id;
    subFolder.elements.push(subToAdd);
    sortObjects(subFolder.elements, "name");
}

/**
 * Adds group to folder.
 * @param {Object} folder the folder
 * @param {Object} groups layers by groupname and netatdata-name
 * @param {String} groupName name of the group (category) in layers first dataset
 * @returns {void}
 */
function addGroup (folder, groups, groupName) {
    const toAdd = {};

    toAdd.elements = [];
    toAdd.name = groupName;
    toAdd.type = "folder";
    toAdd.id = getId();
    toAdd.parentId = folder.id;
    folder.elements.push(toAdd);
    sortObjects(folder.elements, "name");
    groups[groupName] = {};
    // return toAdd.id;
}

/**
 * Removes the object with the given id from list.
 * @param {Array} list to delete an entry from
 * @param {String} idToDelete id of object to delete
 * @returns {void}
 */
function removeLayerById (list, idToDelete) {
    const toRemoveIndex = list.findIndex((layer) => layer.id === idToDelete);

    if (toRemoveIndex > -1) {
        list.splice(toRemoveIndex, 1);
    }
}

/**
 * Returns the ids of the layers in an array.
 * @param {Array} layers list of layers
 * @returns {Array} the ids of the layers
 */
function getIdsOfLayers (layers) {
    let ids = [];

    layers.forEach(layer => {
        if (Array.isArray(layer.id)) {
            ids = ids.concat(layer.id);
        }
        else {
            ids.push(layer.id);
        }
    });
    return ids;
}

/**
 * Returns the names of the categories for the given categoryKey in layers first dataset.
 * @param {Object} layer the layer, must have attribute datasets with one entry with key 'md_name'
 * @param {String} categoryKey key of the category to read the name of
 * @returns {Array} the names of the categories for the given categoryKey
 */
function getGroupNames (layer, categoryKey) {
    if (Array.isArray(layer.datasets[0][categoryKey])) {
        return layer.datasets[0][categoryKey];
    }
    return [layer.datasets[0][categoryKey]];
}

/**
 * Returns true, if no other layer with the given metadata-name is contained in layersByMdName.
 * @param {Object} layersByMdName contains lists of layers grouped by matadata-name
 * @param {Object} layer the raw layer
 * @param {String} mdName metadata-name of the layer
 * @returns {Boolean} true, if no other layer with the given metadata-name is contained in layersByMdName
 */
function isFirstLayerWithMdName (layersByMdName, layer, mdName) {
    if (Object.keys(layersByMdName).find((key) => key === mdName)) {

        if (!layersByMdName[mdName].find(aLayer => aLayer.id === layer.id)) {
            layersByMdName[mdName].push(layer);
        }
        return false;
    }
    layersByMdName[mdName] = [layer];
    return true;
}

export default {
    build,
    setIdsAtFolders
};

