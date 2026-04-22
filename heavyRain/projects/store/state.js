/**
 * User type definition
 * @typedef {Object} projects
 * @property {String} id - Id of the component.
 * @property {String} type type of the component.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 * @property {Object[]} criteria - The criteria with the color in lists.
 */
const state = {
    id: "projects",
    type: "projects",
    name: "additional:modules.projects.title",
    icon: "bi-building",
    criteria: [
        {
            "name": "Bauprojekte (Umsetzungsmaßnahmen)",
            "color": "#0055A4"
        },
        {
            "name": "Bekannte Bereiche (z.B. Presse)",
            "color": "#D55E00"
        },
        {
            "name": "Politische Bereiche (z.B. SKA)",
            "color": "#AD1457"
        },
        {
            "name": "Bereiche aus dem Postfach",
            "color": "#006064"
        },
        {
            "name": "Extern: Identifizierte Handlungsbedarfe / Bereiche",
            "color": "#512DA8"
        },
        {
            "name": "Intern: Identifizierte Handlungsbedarfe / Bereiche",
            "color": "#5D6D7E"
        },
        {
            "name": "Machbarkeitsstudien / Vorstudien",
            "color": "#922B21"
        },
        {
            "name": "sonstiges",
            "color": "#007A33"
        }
    ]
};

export default state;
