/**
 * Names of the attributes of the feature type "ortskenntnisse_aktualisierungsbedarfe".
 * The keys are the fields of the report form, the values are the attribute names of the service.
 *
 * The order is the order of the schema of the service. An insert transaction has to send the
 * properties in exactly this order, otherwise the service rejects them as not allowed at this location.
 */
const wfstAttributes = {
        comment: "beschreibung",
        name: "name",
        initiator: "initiator",
        informationType: "art_der_angabe",
        contactPerson: "ansprechpartner",
        infoLink: "infolink",
        creationDate: "eingabedatum"
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
