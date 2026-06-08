/**
 * User type definition
 * @typedef {Object} StoryCreator state
 * @property {String} id - id of the component.
 * @property {String} type - type of the component.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 * @property {Object} currentChapter - The current chapter object.
 * @property {String} currentView - The current view tab.
 * @property {Object} imageAssetsById - Image assets indexed by image ID. Each entry holds { blob, objectURL, mimeType, originalName, archivePath }.
 * @property {Object} story - The story data.
 * @property {Object} subjectLayerCategory - The subject layer category.
 */
const state = {
    id: "storyCreator",
    type: "storyCreator",
    name: "additional:modules.storyCreator.title",
    icon: "bi-file-plus",
    currentChapter: {
        "title": "",
        "content": [],
        "map": {
            "center": null,
            "zoomLevel": null,
            "layers": null,
            "tool": null
        }
    },
    currentView: "story",
    imageAssetsById: {},
    story: {
        chapters: []
    },
    subjectLayerCategory: {
        "key": "kategorie_opendata",
        "name": "common:modules.layerTree.categoryOpendata",
        "active": true
    }
};

export default state;
