/**
 * User type definition
 * @typedef {Object} StoryCreator state
 * @property {String} id - id of the component.
 * @property {String} type - type of the component.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 * @property {String} currentView - The current view tab.
 * @property {Object} currentChapter - The current chapter object.
 * @property {Object} objectURLById - Object URLs for images, indexed by image ID.
 * @property {Object} story - The story data.
 */
const state = {
    id: "storyCreator",
    type: "storyCreator",
    name: "additional:modules.storyCreator.title",
    icon: "bi-file-plus",
    currentView: "story",
    objectURLById: {},
    story: {
        chapters: []
    },
    currentChapter: {
        "title": "",
        "content": [],
        "map": {
            "center": null,
            "zoomLevel": null,
            "layers": null,
            "tool": null
        }
    }
};

export default state;
