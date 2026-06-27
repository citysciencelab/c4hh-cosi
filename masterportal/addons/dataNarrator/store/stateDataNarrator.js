/**
 * Masterportal state
 * @typedef {Object} dataNarrator State
 * @property {String[]} supportedDevices list of devices supported
 * @property {String[]} supportedMapModes list of map modes supported
 * @property {String} type type of the component
 * @property {String} id - id of component
 * @property {String} name - displayed as the title
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} icon - icon next to the title
 * @property {Boolean} isVisibleInMenu - if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI - flag if tool should deactivate gfi (config-param)
 * Addon state
 * @property {Boolean} showLoadingSpinner - Show loading spinner or not
 */

const state = {
    // Masterportal state
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D", "3D"],
    type: "dataNarrator",
    id: "dataNarrator",
    name: "additional:modules.dataNarrator.name",
    description: "additional:modules.dataNarrator.description",
    icon: "bi-book",

    // Addon state
    storyConf: {},
    storyConfJson: null,
    autoplay: false,
    mode: null
};

export default state;


