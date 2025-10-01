/**
 * Unlistens the map events to draw / pick a geometry and toggles the button in the geomPicker off
 * @param {Vue} geomPicker - the geomPicker component
 * @returns {void}
 */
export function geomPickerUnlisten (geomPicker) {
    if (geomPicker) {
        geomPicker.locationPickerActive = false;
        geomPicker.unlisten();
    }
}

/**
 * Resets the currently picked location in the geomPicker
 * @param {Vue} geomPicker - the geomPicker component
 * @returns {void}
 */
export function geomPickerResetLocation (geomPicker) {
    if (geomPicker) {
        geomPicker.resetLocation();
    }
}

/**
 * Clears the drawing source of the geomPicker
 * Does not remove any picked geometry
 * @param {Vue} geomPicker - the geomPicker component
 * @returns {void}
 */
export function geomPickerClearDrawPolygon (geomPicker) {
    geomPicker.clearDrawPolygon();
}

/**
 * Sets the visible geom on the drawLayer by geom
 * @param {Vue} geomPicker - the geomPicker component
 * @param {module:ol/Geometry} geom - the geom
 * @returns {void}
 */
export function geomPickerSetGeometry (geomPicker, geom) {
    geomPicker.setGeometry(geom);
}

/**
 * Returns the currently set geometry feature from the geomPicker
 * @param {Vue} geomPicker - the geomPicker component
 * @param {Boolean} clone - clone the feature or return original?
 * @returns {module:ol/Feature} the current feature or undefined
 */
export function geomPickerGetFeature (geomPicker, clone = true) {
    const feature = geomPicker?.drawLayer?.getSource().getFeatures()[0];

    return clone ? feature?.clone() : feature;
}
