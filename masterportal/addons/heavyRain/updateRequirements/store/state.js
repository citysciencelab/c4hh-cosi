/**
 * User type definition
 * @typedef {Object} updateRequirements
 * @property {String} id - Id of the component.
 * @property {String} type type of the component.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 * @property {Object[]} informationType - The information type with the color in lists.
 */
const state = {
    id: "updateRequirements",
    type: "updateRequirements",
    name: "additional:modules.updateRequirements.title",
    icon: "bi-building",
    informationType: [
        {
            "cat": "Eingabe",
            "name": "Ortskenntnis",
            "color": "#0055A4"
        },
        {
            "cat": "Aktualisierungsbedarf",
            "name": "SRGK",
            "color": "#D55E00"
        },
        {
            "cat": "Aktualisierungsbedarf",
            "name": "Gefährdungsanalyse",
            "color": "#AD1457"
        },
        {
            "cat": "Aktualisierungsbedarf",
            "name": "Risikoanalyse",
            "color": "#006064"
        },
        {
            "cat": "Aktualisierungsbedarf",
            "name": "Zusatzinformationen",
            "color": "#512DA8"
        },
        {
            "cat": "Beobachtung",
            "name": "Starkregenereignis",
            "color": "#512DA8"
        }
    ]
};

export default state;
