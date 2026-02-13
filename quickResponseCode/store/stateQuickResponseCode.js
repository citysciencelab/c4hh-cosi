/**
 * User type definition
 * @typedef {Object} QuickResponseCodeState
 * @property {String} icon Icon of the control.
 * @property {String[]} supportedDevices Devices on which the module is displayed.
 * @property {String[]} supportedMapModes Map mode in which this module can be used.
 * @property {String} urlSchema The url schema.
 * @property {String} text Specifies the text that will be displayed in the toolwindow.
 * @property {String} urlSchemaTargetProjection Specifies the projection in which the coordinates are inserted into the URL.
 * @property {Number} evtCoordinate The event click coordinate.
 */
const state = {
    icon: "bi-qr-code",
    name: "additional:modules.quickResponseCode.name",
    description: "additional:modules.quickResponseCode.description",
    supportedDevices: ["Desktop", "Table"],
    supportedMapModes: ["2D"],
    hasMouseMapInteractions: true,
    urlSchema: "https://www.google.de/maps/@{{LAT}},{{LON}}",
    text: "additional:modules.quickResponseCode.text",
    urlSchemaTargetProjection: "EPSG:25832",
    evtCoordinate: null
};

export default state;
