/**
 * Moves a feature to a given location based on its geometry type
 * Either by replacing its geometry or translating it by the delta vector
 * @param {module:ol/Feature} feature - the give to translate
 * @param {module:ol/Geometry | number[]} geometry - the geometry (as Point, Linestring or polygon). Translates the geometry if coordinates are provided
 * @returns {void}
 */
export default function translateFeature (feature, geometry) {
    const originalGeom = feature.getGeometry();

    if (Array.isArray(geometry) && geometry.length === 2 && typeof geometry[0] === "number" && typeof geometry[1] === "number") {
        const pos = originalGeom.getExtent().getCenter(),
            deltaX = geometry[0] - pos[0],
            deltaY = geometry[1] - pos[1];

        originalGeom.translate(deltaX, deltaY);
    }
    else {
        feature.setGeometry(geometry.clone());
    }
}
