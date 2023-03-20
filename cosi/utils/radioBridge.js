/* ******************* Searchbar ******************* */
/**
 * Fires if it hits on searchbar
 * @param {Function} value the function to be used on searchbar
 * @returns {void}
 */
export function onSearchbar (value) {
    Radio.on("Searchbar", "hit", value);
}

/**
 * Fires if it hits off searchbar
 * @returns {void}
 */
export function offSearchbar () {
    Radio.off("Searchbar", "hit");
}

/* ******************* RestReader ******************* */
/**
 * Getting the service url by value
 * @param {String} value the parameter to get url
 * @returns {void}
 */
export function getServiceUrl (value) {
    return Radio.request("RestReader", "getServiceById", value).get("url");
}

/* ******************* ModelList ******************* */
/**
 * Function on showing features by id
 * @param {Function} fuc on showFeaturesById
 * @returns {void}
 */
export function onShowFeaturesById (fuc) {
    Radio.on("ModelList", "showFeaturesById", fuc);
}

/**
 * Function on showing all features by id
 * @param {Function} fuc on showAllFeatures
 * @returns {void}
 */
export function onShowAllFeatures (fuc) {
    Radio.on("ModelList", "showAllFeatures", fuc);
}

/**
 * Getting the model by attributes
 * @param {Object} attributes the attributes to get model
 * @returns {Object} the attributes model
 */
export function getModelByAttributes (attributes) {
    return Radio.request("ModelList", "getModelByAttributes", attributes);
}

/**
 * Rendering the tree
 * @returns {void}
 */
export function renderTree () {
    Radio.trigger("ModelList", "renderTree");
}

/**
 * Closing all the expanded folder
 * @returns {void}
 */
export function closeAllExpandedFolder () {
    Radio.trigger("ModelList", "closeAllExpandedFolder");
}

/**
 * Removing the model by id
 * @param {String} id the model id
 * @returns {void}
 */
export function removeModelsById (id) {
    Radio.trigger("ModelList", "removeModelsById", id);
}

/**
 * Adding models by attributes
 * @param {Object} attributes the attributes to add for model
 * @returns {void}
 */
export function addModelsByAttributes (attributes) {
    Radio.trigger("ModelList", "addModelsByAttributes", attributes);
}

/**
 * Getting collection from model list
 * @returns {Object} the collection from model
 */
export function getCollection () {
    return Radio.request("ModelList", "getCollection");
}

/* ******************* Parser ******************* */
/**
 * Getting item by attributes
 * @param {Object} attributes the attributes to get item
 * @returns {Object} the item object
 */
export function getItemByAttributes (attributes) {
    return Radio.request("Parser", "getItemByAttributes", attributes);
}

/**
 * Getting items by attributes
 * @param {Object} attributes the attributes to get items
 * @returns {Object} the items object
 */
export function getItemsByAttributes (attributes) {
    return Radio.request("Parser", "getItemsByAttributes", attributes);
}

/**
 * Creates a new folder and adds it.
 * @param {String} name - name of the folder
 * @param {String} id - id of the layer
 * @param {String} parentId - id of the parent
 * @param {Number} level - level of the folder
 * @returns {void}
 */
export function addFolder (name, id, parentId, level) {
    Radio.trigger("Parser", "addFolder", name, id, parentId, level);
}

/**
 * Creates the Masterportal Configuration for a Vector Layer.
 * Adds the configuration to be parsed into the Portal.
 * @param {String} name Name of the layer.
 * @param {String} id Unique identifier for the layer.
 * @param {ol.Feature[]} features - all features generated from the imported file
 * @param {String} [parentId] Id for the correct position of the layer in the layertree.
 * @param {String} [styleId] Id for the styling of the features; should correspond to a style from the style.json.
 * @param {(String|Object)} [gfiAttributes="ignore"] Attributes to be shown when clicking on the feature using the GFI tool.
 * @param {Object} [opts] additional options to append to the model on initialization
 * @returns {void}
 */
export function addVectorLayer (name, id, features, parentId, styleId, gfiAttributes, opts) {
    Radio.trigger("Parser", "addVectorLayer", name, id, features, parentId, styleId, gfiAttributes, opts);
}

/**
 * Removing items by parser
 * @param {String} id the model id
 * @returns {void}
 */
export function removeItem (id) {
    Radio.trigger("Parser", "removeItem", id);
}

/* ******************* VectorLayer ******************* */
/**
 * Function on vectorLayer features loaded
 * @param {Function} fuc on featuresLoaded
 * @returns {void}
 */
export function onFeaturesLoaded (fuc) {
    Radio.on("VectorLayer", "featuresLoaded", fuc);
}

/**
 * Function on resetting features
 * @param {Function} fuc on reset features
 * @returns {void}
 */
export function onResetFeatures (fuc) {
    Radio.on("VectorLayer", "resetFeatures", fuc);
}

/* ******************* MouseHover ******************* */
/**
 * Add function by mouseHover
 * @param {Object} attributes the attributes to add by mouseHover
 * @returns {void}
 */
export function addByMouseHover (attributes) {
    Radio.trigger("MouseHover", "add", attributes);
}

/* ******************* Util ******************* */
/**
 * Groups the elements of an array based on the given function.
 * @param {Array} features in an Array list
 * @param {function} func reducer function
 * @returns {Object} the feature by a group function
 */
export function groupBy (features, func) {
    return Radio.request("Util", "groupBy", features, func);
}
