/**
 * User type definition
 * @typedef {Object} sessionTool
 * @property {String}   description - the discription to show in the menu
 * @property {String}   icon - icon next to title
 * @property {String}   id - internal id of component
 * @property {String}   name - Module name
 * @property {Object[]} observer - array of observers
 * @property {String[]} supportedDevices - devices in which this tool is supported
 * @property {String[]} supportedMapModes - map modes in which this tool is supported
 * @property {String}   type - type
 */
const state = {
    description: "additional:modules.sessionTool.description",
    icon: "bi-floppy",
    id: "sessionTool",
    name: "additional:modules.sessionTool.title",
    observer: [],
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D", "3D"],
    type: "sessionTool"
};

export default state;
