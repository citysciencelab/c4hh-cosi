/**
 * User type definition
 * @typedef {Object} StoryManager state
 * @property {String} id - id of the component.
 * @property {String} type - type of the component.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 * @property {Boolean} [enableCreator=true] - If false, the creation, editing, and downloading of stories is disabled.
 * @property {Boolean} [enableImport=true] - Defines if importing stories from ZIP files is allowed.
 * @property {Number} currentStoryIndex - The current stroy index in the story list.
 * @property {String} fixedStoryPath the relative path in portalconfigs to contain fixed stories.
 * @property {String[]} fixedStoryFiles the fixed story files name.
 * @property {Boolean} fixedStoryLoaded check if fixed story is load.
 * @property {Object[]} [gfiFeatures=[]] temporary array for features at click to be moved to gfi module.
 * @property {Boolean} [enableVideo=false] - Defines if video is enabled in chapter creator.
* @property {ol/layer[]} originalLayerConfig the original layer configs.
 * @property {Object[]} storyList List entries with story and image assets.
 * @property {Object} subjectLayerCategory - The subject layer category for layer selection.
 * @property {String[]} [toolStoryWhitelist=[]] - List of tool type IDs to show in the StoryCreator tool selector. Empty array means all configured tools are shown.
 */
const state = {
    id: "storyManager",
    type: "storyManager",
    name: "additional:modules.storyManager.title",
    icon: "bi-file-plus",
    currentStoryIndex: undefined,
    enableCreator: true,
    enableImport: true,
    enableVideo: false,
    fixedStoryPath: "./assets",
    fixedStoryFiles: [],
    fixedStoryLoaded: false,
    gfiFeatures: null,
    hasMouseMapInteractions: true,
    originalLayerConfig: undefined,
    storyList: [],
    subjectLayerCategory: {
        "key": "kategorie_opendata",
        "name": "common:modules.layerTree.categoryOpendata",
        "active": true
    },
    toolStoryWhitelist: ["measure", "coordToolkit", "legend", "scaleSwitcher", "shareView", "draw_old"]
};

export default state;
