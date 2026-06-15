/**
 * User type definition
 * @typedef {Object} StoryManager state
 * @property {String} id - id of the component.
 * @property {String} type - type of the component.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 * @property {Number} currentStoryIndex - The current stroy index in the story list.
 * @property {String} fixedStoryPath the relative path in portalconfigs to contain fixed stories.
 * @property {String[]} fixedStoryFiles the fixed story files name.
 * @property {Boolean} fixedStoryLoaded check if fixed story is load.
 * @property {Object[]} storyList List entries with story and image assets.
 * @property {Object} subjectLayerCategory - The subject layer category for layer selection.
 */
const state = {
    id: "storyManager",
    type: "storyManager",
    name: "additional:modules.storyManager.title",
    icon: "bi-file-plus",
    currentStoryIndex: undefined,
    fixedStoryPath: "./assets",
    fixedStoryFiles: [],
    fixedStoryLoaded: false,
    storyList: [],
    subjectLayerCategory: {
        "key": "kategorie_opendata",
        "name": "common:modules.layerTree.categoryOpendata",
        "active": true
    }
};

export default state;
