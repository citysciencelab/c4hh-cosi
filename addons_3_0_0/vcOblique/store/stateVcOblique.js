/**
 * User type definition
 * @typedef {Object} vcObliqueState
 * @property {String} type Type of the viewer component
 * @property {Boolean} active if true, viewer will rendered
 * @property {String} name displayed as title (config-param)
 * @property {String} icon icon next to title (config-param)
 * @property {Boolean} hasMouseMapInteractions If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
 * @property {String} styleId style.json id to style the mapMarker (config-param)
 * @property {String} obliqueViewerURL contains the url to the oblique viewer
 * @property {String} lastCoordinates contains the last coordinates of the map click
 * @property {String} defaultMapMarkerStyleId contains the default styleId of the mapMarker
 * @property {String} heading contains the heading of the oblique viewer
 * @property {String} serviceId contains the id of the oblique viewer from the rest-services.json
 * @property {Number[]} clickCartesianCoordinate Current cartesian 2D coordinate.
 * */

const state = {
    type: "vcOblique",
    active: false,
    name: "additional:menu.tools.vcOblique",
    icon: "bi-camera-fill",
    hasMouseMapInteractions: true,
    styleId: "",
    obliqueViewerURL: "",
    lastCoordinates: "",
    defaultMapMarkerStyleId: "",
    heading: 0,
    serviceId: "oblique",
    clickCartesianCoordinate: ""
};

export default state;
