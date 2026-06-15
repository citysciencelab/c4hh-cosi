/**
 * Masterportal state
 * @typedef {Object} storyPlayer State
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
 * @property {String} fixedStoryName the fixed story file name.
 * @property {String} fixedStoryPath the relative path in portalconfigs to contain fixed stories.
 */

const state = {
    // Masterportal state
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D", "3D"],
    type: "storyPlayer",
    id: "storyPlayer",
    name: "additional:modules.storyPlayer.name",
    description: "additional:modules.storyPlayer.description",
    icon: "bi-book",

    // Addon state
    autoplay: false,
    fixedStoryName: null,
    fixedStoryPath: null,
    mode: null,
    storyConf: {},
    storyConfJson: null
};

export default state;


