/**
 * StorySelector tool state definition.
 * @typedef {Object} StorySelectorState
 * @property {String} id Id of the StorySelector tool.
 * @property {String} type If true, StorySelector will be rendered.
 * @property {String} name Displayed as the title.
 * @property {String} icon Icon next to the title.
 * @property {String} storyIndexURL URL to fetch the stories from.
 */
const state = {
    id: "storySelector",
    type: "storySelector",
    name: "additional:modules.storySelector.title",
    icon: "bi-collection",
    storyIndexURL: null
};

export default state;
