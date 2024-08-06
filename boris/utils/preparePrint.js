import borisState from "../store/stateBoris";
import store from "../../../src/app-store/index";
import SpecModel from "../../../src/modules/print/js/buildSpec.js";

/**
 * Helper Function to prepare the Pdf file from currently selected layer and its features on the comparison list.
 * @param {function} getResponse function that will get axios response
 * @returns {void}
 */
export async function preparePrint (getResponse) {
    const visibleLayerList = mapCollection.getMap("2D").getLayers().getArray().filter(function (layer) {
            return layer.getVisible() === true;
        }),
        scale = store.state.Maps.scale,
        feature = borisState.selectedBrwFeature,
        selectedOption = borisState.selectedOption,
        defaultString = "",
        date = new Date(),
        month = date.getMonth() + 1,
        attributes = {
            "layout": "A4 Hochformat",
            "outputFormat": "pdf",
            "outputFilename": "Auszug_aus_BORIS_HH-" + date.getDate() + "-" + month + "-" + date.getFullYear(),
            "attributes": {
                "richtwertnummer": "Bodenrichtwertnummer: " + feature.values_.richtwertnummer,
                "scale": "Maßstab 1:" + scale,
                "entwicklungszustand": feature.values_.entwicklungszustand || defaultString,
                "sanierungszusatz": feature.values_.sanierungszusatz || defaultString,
                "beitragszustand": feature.values_.beitragszustand || defaultString,
                "nutzungsart": feature.values_.nutzung_kombiniert || defaultString,
                "anbauart": feature.values_.anbauart || defaultString,
                "geschossfl_zahl": feature.values_.geschossfl_zahl || defaultString,
                "grdstk_flaeche": feature.values_.grdstk_flaeche || defaultString,
                "gruenlandzahl": feature.values_.gruenlandzahl || defaultString,
                "bemerkung": feature.values_.bemerkung || defaultString,
                "stichtag": feature.values_.stichtag,
                "richtwert_euro": feature.values_.richtwert_euro || defaultString,
                "richtwert_dm": feature.values_.richtwert_dm || defaultString,
                "strasse_hausnr": createAddressString(feature),
                "weitere_lage": feature.values_.lagebezeichnung || defaultString,
                "plz_gemeinde": createPostalCodeCityString(feature),
                "bezirk": feature.values_.bezirk || defaultString,
                "stadtteil": feature.values_.stadtteil || defaultString,
                "sge": feature.values_.statistisches_gebiet || defaultString,
                "baublock": feature.values_.baublock || defaultString,
                "convertedBrw": feature.values_.convertedBrw && feature.values_.convertedBrw !== feature.values_.richtwert_euro ? feature.values_.convertedBrw : defaultString,
                "convertedBrwDM": feature.values_.convertedBrwDM || defaultString,
                "zBauweise": selectedOption ? selectedOption : feature.values_.zBauweise || defaultString,
                "zStrassenlage": feature.values_.zStrassenlage || defaultString,
                "zGeschossfl_zahl": feature.values_.zGeschossfl_zahl || defaultString,
                "zGrdstk_flaeche": feature.values_.zGrdstk_flaeche || defaultString,
                "show_schichtwerte": printFloorValues(feature.values_.schichtwerte),
                "normschichtwert_wohnen_text": feature.values_.schichtwert && feature.values_.schichtwert.normschichtwert_wohnen ? "normierter Bodenrichtwert für Mehrfamilienhäuser" : defaultString,
                "normschichtwert_wohnen": feature.values_.schichtwert && feature.values_.schichtwert.normschichtwert_wohnen ? feature.values_.schichtwert.normschichtwert_wohnen : defaultString,
                "normschichtwert_wohnenDM": feature.values_.schichtwert && feature.values_.schichtwert.normschichtwert_wohnenDM ? feature.values_.schichtwert.normschichtwert_wohnenDM : defaultString,
                "normschichtwert_buero_text": feature.values_.schichtwert && feature.values_.schichtwert.normschichtwert_buero ? "normierter Bodenrichtwert für Bürohäuser" : defaultString,
                "normschichtwert_buero": feature.values_.schichtwert && feature.values_.schichtwert.normschichtwert_buero ? feature.values_.schichtwert.normschichtwert_buero : defaultString,
                "normschichtwert_bueroDM": feature.values_.schichtwert && feature.values_.schichtwert.normschichtwert_bueroDM ? feature.values_.schichtwert.normschichtwert_bueroDM : defaultString,
                "normschichtwert_laden_text": feature.values_.schichtwert && feature.values_.schichtwert.normschichtwert_laden ? "normierter Bodenrichtwert für Geschäftshäuser (Erdgesch.-anteil)" : defaultString,
                "normschichtwert_laden": feature.values_.schichtwert && feature.values_.schichtwert.normschichtwert_laden ? feature.values_.schichtwert.normschichtwert_laden : defaultString,
                "normschichtwert_ladenDM": feature.values_.schichtwert && feature.values_.schichtwert.normschichtwert_ladenDM ? feature.values_.schichtwert.normschichtwert_ladenDM : defaultString,
                "schichtwerte": {
                    "rows": feature.values_.schichtwert && feature.values_.schichtwert.schichtwerte ? feature.values_.schichtwert.schichtwerte : []
                },
                "map": {
                    "dpi": 200,
                    "projection": store.state.Maps.projection.getCode(),
                    "center": store.state.Maps.center,
                    "scale": scale
                }
            }
        },
        spec = SpecModel;

    let printJob = {};

    store.dispatch("Modules/Print/retrieveCapabilites", true, {root: true});
    store.dispatch("Modules/Print/activatePrintStarted", true, {root: true});

    spec.setAttributes(attributes);
    await spec.buildLayers(visibleLayerList);

    printJob = {
        payload: encodeURIComponent(JSON.stringify(spec.defaults)),
        printAppId: "boris",
        currentFormat: "pdf",
        getResponse: getResponse
    };

    store.dispatch("Modules/Print/createPrintJob", printJob, {root: true});
}

/**
 * Helpers function for preparePrint that creates an address string based on the ol.feature\"s attributes strassenname, hausnummer and hausnummerzusatz
 * @param  {ol.feature} feature The ol-Feature
 * @return {String} The result string
 */
export function createAddressString (feature) {
    let addressString = "";

    addressString += feature.get("strassenname") || "";
    addressString += " ";
    addressString += feature.get("hausnummer") || "";
    addressString += feature.get("hausnummerzusatz") || "";

    return addressString.trim();
}
/**
 * Helpers function for preparePrint that creates a string based on the ol.feature\"s attributes postal code and municipality
 * @param  {ol.feature} feature The ol-Feature
 * @return {String} The result String
 */
export function createPostalCodeCityString (feature) {
    let postalCodeCityString = "";

    postalCodeCityString += feature.get("postleitzahl") || "";
    postalCodeCityString += " ";
    postalCodeCityString += feature.get("gemeinde") || "";

    return postalCodeCityString.trim();
}
/**
 * Helpers function for preparePrint that checks if 'schichtwerte' should be printed
 * @param   {object} floorvalue 'schichtwerte'-Object of feature
 * @returns {boolean} true when 'schichtwerte' should be printed
 */
export function printFloorValues (floorvalue) {
    if (floorvalue && floorvalue.schichtwerte && floorvalue.schichtwerte.length > 0) {
        return true;
    }
    return false;
}

