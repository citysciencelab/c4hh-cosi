/**
 * User type definition
 * @typedef {Object} StoryManager state
 * @property {String} id - id of the component.
 * @property {String} type - type of the component.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 * @property {Object[]} storyList the story object list in array.
 */
const state = {
    id: "storyManager",
    type: "storyManager",
    name: "additional:modules.storyManager.title",
    icon: "bi-file-plus",
    storyList: [
        {
            title: "Story 1",
            text: "Lorem ipsum dolor sit amet...",
            photoCredit: "Max Mustermann / Getty Images",
            altText: "Blick über die Hamburger Elbphilharmonie",
            image: "https://www.hamburg.de/resource/image/1173902/landscape_ratio16x9/1300/731/59436f59c7c0b46a07676bff0913e36d/D4C3C6D304E3E543EF78A67BE4C173EF/eine-visualisierung-eines-radrennens-in-der-hafen-city.png",
            created: "11.03.2026",
            author: "Max Mustermann",
            chapters: []
        },
        {
            title: "Story 2",
            text: "Lorem ipsum dolor sit amet...",
            photoCredit: "Max Mustermann / Getty Images",
            altText: "Blick über die Hamburger Elbphilharmonie",
            image: "https://www.hamburg.de/resource/image/1173902/landscape_ratio16x9/1300/731/59436f59c7c0b46a07676bff0913e36d/D4C3C6D304E3E543EF78A67BE4C173EF/eine-visualisierung-eines-radrennens-in-der-hafen-city.png",
            created: "12.03.2025",
            author: "Max Mustermann",
            chapters: [{}]
        }
    ]
};

export default state;
