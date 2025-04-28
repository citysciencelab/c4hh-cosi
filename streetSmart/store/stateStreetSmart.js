/**
 * User type definition
 * @typedef {Object} StreetSmartState
 * @property {String} description description of tool (config-param)
 * @property {Boolean} hasMouseMapInteractions If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
 * @property {String} icon icon next to title (config-param)
 * @property {String} name displayed as title (config-param)
 * @property {String} reactVersion version of react to load
 * @property {String} serviceId id of the rest-service that provides the panorama pictures
 * @property {String} streetsmartAPIVersion version of the streetsmartAPI to load
 * @property {String} styleId The styleId for the map marker.
 * @property {String[]} supportedDevices Devices on which the module is displayed.
 * @property {String[]} supportedMapModes Map mode in which this module can be used.
 * @property {String} type type of the viewer component
 * @property {String} streetSmartSRS The Spatial Reference System (SRS) used for panorama positioning, e.g., "EPSG:25832". If null, the default SRS is used.
 * @property {Number[]} lastCoordinates the last clicked coordinates
 * @property {Number} lastYaw the last recorded yaw/rotation
 * @property {Boolean} packagesLoaded represents if packages are loaded.
 * @property {Boolean} timeTravelVisible enables timeTravel in panoramaViewer
 * @property {Boolean} toggle3DCursor toggles the visibility of the 3D cursor in the PanoramaViewer
 * @property {Boolean} toggleAddressesVisible toggles the visibility of addresses
 */

const state = {
    description: "additional:modules.streetsmart.description",
    hasMouseMapInteractions: true,
    icon: "bi-camera",
    name: "additional:modules.streetsmart.name",
    reactVersion: "18.3.1",
    serviceId: "streetsmart",
    streetsmartAPIVersion: "24.14",
    styleId: "defaultMapMarkerPoint",
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D", "3D"],
    type: "streetSmart",
    streetSmartSRS: null,
    lastCoordinates: [],
    lastYaw: 0,
    packagesLoaded: false,
    timeTravelVisible: false,
    toggle3DCursor: false,
    toggleAddressesVisible: false
};

export default state;
