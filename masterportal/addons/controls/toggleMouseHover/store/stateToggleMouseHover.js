/**
 * User type definition
 * @typedef {Object} ToggleMouseHoverState
 * @property {String} icon Icon of the control.
 * @property {String} iconFill Icon when the control is active.
 * @property {String[]} supportedDevices Devices on which the module is displayed.
 * @property {String[]} supportedMapModes Map mode in which this module can be used.
 */
const state = {
    icon: "bi-mouse2",
    iconFill: "bi-mouse2-fill",
    supportedDevices: ["Desktop"],
    supportedMapModes: ["2D"]
};

export default state;
