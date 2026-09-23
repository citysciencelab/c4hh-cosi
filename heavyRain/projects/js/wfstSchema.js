/**
 * Names of the attributes of the feature type "starkregenprojekte".
 * The keys are the fields of the project form, the values are the attribute names of the service.
 *
 * The order is the order of the schema of the service. An insert transaction has to send the
 * properties in exactly this order, otherwise the service rejects them as not allowed at this location.
 */
const wfstAttributes = {
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

    /**
     * Name of the geometry attribute. It is written after all other attributes,
     * as it is the last element of the schema.
     */
    wfstGeometryName = "geom",

    /**
     * Format in which date attributes are sent to the service.
     */
    wfstDateFormat = "YYYY-MM-DD";

export {wfstAttributes, wfstDateFormat, wfstGeometryName};
