/**
 * User type definition
 * @typedef {Object} updateRequirements
 * @property {String} id - Id of the component.
 * @property {String} type type of the component.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 * @property {Object} currentRequirement - The current requirement.
 * @property {Object} currentView - The current tab.
 * @property {Object[]} informationType - The information type with the color in lists.
 * @property {String} wfstAttributes - Names of the attributes of the feature type "ortskenntnisse_aktualisierungsbedarfe".
 * @property {String} wfstGeometryName - Name of the geometry attribute. It is written after all other attributes, as it is the last element of the schema..
 * @property {String} wfstDateFormat - Format in which date attributes are sent to the service..
 * @property {String} wfstLayerId - Id of the WFS-T layer the reports are written to. It is shown on the map when the module is opened.
 */
const state = {
    id: "updateRequirements",
    type: "updateRequirements",
    name: "additional:modules.updateRequirements.title",
    icon: "bi-building",
    currentRequirement: undefined,
    currentView: "main",
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
    ],
    wfstAttributes: {
        comment: "beschreibung",
        name: "name",
        initiator: "initiator",
        informationType: "art_der_angabe",
        contactPerson: "ansprechpartner",
        infoLink: "infolink",
        creationDate: "eingabedatum",
        lastUpdate: "aktualisierung"
    },
    wfstGeometryName: "geom",
    wfstDateFormat: "YYYY-MM-DD",
    wfstLayerId: "36013"
};

export default state;
