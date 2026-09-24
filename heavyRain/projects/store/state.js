/**
 * User type definition
 * @typedef {Object} projects
 * @property {String} id - Id of the component.
 * @property {String} type type of the component.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 * @property {Object[]} criteria - The criteria with the color in lists.
 * @property {Object} currentProject - The current object.
 * @property {Object} currentView - The current tab.
 * @property {String} wfstAttributes - Names of the attributes of the feature type "starkregenprojekte".
 * @property {String} wfstGeometryName - Name of the geometry attribute. It is written after all other attributes, as it is the last element of the schema..
 * @property {String} wfstDateFormat - Format in which date attributes are sent to the service..
 * @property {String} wfstId - Id of the WFS-T layer the projects are written to.
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
    ],
    currentProject: undefined,
    currentView: "main",
    wfstAttributes: {
        projectName: "projektname",
        creator: "initiator",
        startDate: "baubeginn",
        endDate: "bauende",
        source: "quelle",
        contactPerson: "ansprechpartner",
        lastUpdate: "letzte_aktualisierung",
        description: "art_der_massnahme",
        contactExt: "kontakt_extern",
        infoLink: "info_link",
        criteria: "kriterien",
        history: "historie",
        protectedAreas: "schutzniveau"
    },
    wfstGeometryName: "geom",
    wfstDateFormat: "YYYY-MM-DD",
    wfstId: "36016"
};

export default state;
