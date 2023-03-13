/**
 * User type definition
 * @typedef {Object} VueAddonState
 * @property {Boolean} active= false state of the tool
 * @property {String} name= SDP Download module name, // must be here although it is in the config.json, else it is lost
 * @property {String} icon= icon name string that represents the tool icon // must be here although it is in the config.json, else it is lost
 * @property {String} wmsRasterLayerId= "4707" id of the Layer utm_dk5_1km (WMS Uebersicht Kachelbezeichnungen)
 * @property {String[]} formats= [] provided formats of data to download
 * @property {String} selectedFormat= "NAS" is the preselected format
 * @property {String} compressDataId= "compressData" name of the  data service configured in the rest-service.json that delivers dwg and zips
 * @property {Object} wfsRasterParams= connection parameters
 * @property {String} wfsRasterParams.url= "https://geodienste.hamburg.de/HH_WFS_Uebersicht_Kachelbezeichnungen"
 * @property {String} wfsRasterParams.request= "GetFeature" Request type
 * @property {String} wfsRasterParams.service= "WFS" Service type
 * @property {String} wfsRasterParams.version= "1.1.0" Version from services
 * @property {String} wfsRasterParams.typename= "app:lgv_kachel_dk5_1km_utm" Type in service
 * @property {Object} wfsRaster= {} contains wfs raster features after loading them
 * @property {Object} graphicalSelectModel= {} model for graphical selection
 * @property {Boolean} graphicalSelectStatus= {} status for graphical selection
 * @property {Object} selectedRasterLimit= 9 limit og raster images for download
 * @property {String[]} rasterNames=[] stores the names of the tiles in the raster
 * @property {String} selectFormat= "additional:modules.tools.sdpdownload.selectFormat" contains the translated text
 * @property {String} howToChooseTiles= "additional:modules.tools.sdpdownload.howToChooseTiles" contains the translated text
 * @property {String} downloadDataPackage= "additional:modules.tools.sdpdownload.downloadDataPackage" contains the translated text
 * @property {String} specialDownloads= "additional:modules.tools.sdpdownload.specialDownloads" contains the translated text
 * @property {String} neuwerkDataPackage= "additional:modules.tools.sdpdownload.neuwerkDataPackage" contains the translated text
 * @property {String} scharhoernDataPackage= "additional:modules.tools.sdpdownload.scharhoernDataPackage" contains the translated text
 * @property {String} tileOverview310= "additional:modules.tools.sdpdownload.tileOverview310" contains the translated text
 * @property {String} tileOverview320= "additional:modules.tools.sdpdownload.tileOverview320" contains the translated text
 * @property {String} pleaseSelectTiles= "additional:modules.tools.sdpdownload.pleaseSelectTiles" contains the translated text
 * @property {String} failedToDownload= "additional:modules.tools.sdpdownload.failedToDownload" contains the translated text
 * @property {String} details= "additional:modules.tools.sdpdownload.details" contains the translated text
 * @property {String} error= "additional:modules.tools.sdpdownload.alerts.error" contains the translated text
 * @property {String} info= "additional:modules.tools.sdpdownload.alerts.info" contains the translated text
 * @property {String} tooManyTilesSelected= "additional:modules.tools.sdpdownload.tooManyTilesSelected" contains the translated text
 */

const state = {
    type: "SdpAddon",
    active: false,
    id: "SdpAddon",
    // defaults for config.json parameters
    name: "SDP Download",
    icon: "bi-download",
    hasMouseMapInteractions: true,
    wmsRasterLayerId: "4707",
    formats: [
        {id: "NAS", label: "additional:modules.tools.sdpdownload.nasLabel", isSelected: true, desc: "additional:modules.tools.sdpdownload.nasDescription", fileId: "nas"},
        {id: "DWG_310", label: "additional:modules.tools.sdpdownload.dwg310Label", isSelected: false, desc: "additional:modules.tools.sdpdownload.dwg310Description", fileId: "dwg310"},
        {id: "DWG_320", label: "additional:modules.tools.sdpdownload.dwg320Label", isSelected: false, desc: "additional:modules.tools.sdpdownload.dwg320Description", fileId: "dwg320"},
        {id: "JPG", label: "additional:modules.tools.sdpdownload.jpgLabel", isSelected: false, desc: "additional:modules.tools.sdpdownload.jpgDescription", fileId: "jpg"}],
    selectedFormat: "NAS", // is preselected
    compressDataId: "compressData_nodejs",
    wfsRasterParams: {
        url: "https://geodienste.hamburg.de/HH_WFS_Uebersicht_Kachelbezeichnungen",
        request: "GetFeature",
        service: "WFS",
        version: "1.1.0",
        typename: "app:lgv_kachel_dk5_1km_utm"
    },
    wfsRaster: {},
    graphicalSelectModel: {},
    graphicalSelectStatus: true,
    selectedRasterLimit: 9,
    rasterNames: [],
    selectFormat: "additional:modules.tools.sdpdownload.selectFormat",
    howToChooseTiles: "additional:modules.tools.sdpdownload.howToChooseTiles",
    downloadDataPackage: "additional:modules.tools.sdpdownload.downloadDataPackage",
    specialDownloads: "additional:modules.tools.sdpdownload.specialDownloads",
    neuwerkDataPackage: "additional:modules.tools.sdpdownload.neuwerkDataPackage",
    scharhoernDataPackage: "additional:modules.tools.sdpdownload.scharhoernDataPackage",
    tileOverview310: "additional:modules.tools.sdpdownload.tileOverview310",
    tileOverview320: "additional:modules.tools.sdpdownload.tileOverview320",
    pleaseSelectTiles: "additional:modules.tools.sdpdownload.pleaseSelectTiles",
    failedToDownload: "additional:modules.tools.sdpdownload.failedToDownload",
    details: "additional:modules.tools.sdpdownload.details",
    serviceNotResponding: "additional:modules.tools.sdpdownload.serviceNotResponding",
    error: "additional:modules.tools.sdpdownload.alerts.error",
    info: "additional:modules.tools.sdpdownload.alerts.info",
    tooManyTilesSelected: "additional:modules.tools.sdpdownload.tooManyTilesSelected"
};

export default state;
