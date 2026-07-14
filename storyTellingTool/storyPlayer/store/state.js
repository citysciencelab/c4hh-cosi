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
 * @property {String} currentStoryName the name of the currently loaded story file (without extension).
 * @property {Number} duration Duration used for StoryPlayer animations.
 * @property {String} fixedStoryName the fixed story file name.
 * @property {String} fixedStoryPath the relative path in portalconfigs to contain fixed stories.
 * @property {ol/layer[]} originalLayerConfig the original layer configs.
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
    currentStoryName: null,
    duration: 1000,
    fixedStoryName: null,
    fixedStoryPath: null,
    imageAssetsById: {},
    mode: null,
    originalLayerConfig: undefined,
    storyConf: {}
};

export default state;


