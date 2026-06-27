/**
 * User type definition
 * @typedef {Object} ExampleControlState
 * @property {String} icon Icon of the control.
 * @property {String[]} supportedDevices Devices on which the module is displayed.
 * @property {String[]} supportedMapModes Map mode in which this module can be used.
 */
const state = {
    icon: "bi-alarm",
    supportedDevices: ["Desktop"],
    supportedMapModes: ["2D"]
};

export default state;
