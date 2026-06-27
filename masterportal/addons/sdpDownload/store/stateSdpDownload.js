/**
 * User type definition
 * @typedef {Object} SdpDownloadState
 * @property {String} type Type of the SdpDownload component.
 * @property {Boolean} active= false state of the tool
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} name= SDP Download module name, // must be here although it is in the config.json, else it is lost
 * @property {String} icon= icon name string that represents the tool icon // must be here although it is in the config.json, else it is lost
 * @property {Boolean} hasMouseMapInteractions If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
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
 * @property {Boolean} transactionProcessing Flag if a download is currently active
 * @property {String} selectFormat= additional:modules.sdpDownload.selectFormat" contains the translated text
 * @property {String} howToChooseTiles= additional:modules.sdpDownload.howToChooseTiles" contains the translated text
 * @property {String} downloadDataPackage= additional:modules.sdpDownload.downloadDataPackage" contains the translated text
 * @property {String} specialDownloads= additional:modules.sdpDownload.specialDownloads" contains the translated text
 * @property {String} neuwerkDataPackage= additional:modules.sdpDownload.neuwerkDataPackage" contains the translated text
 * @property {String} scharhoernDataPackage= additional:modules.sdpDownload.scharhoernDataPackage" contains the translated text
 * @property {String} tileOverview310= additional:modules.sdpDownload.tileOverview310" contains the translated text
 * @property {String} tileOverview320= additional:modules.sdpDownload.tileOverview320" contains the translated text
 * @property {String} pleaseSelectTiles= additional:modules.sdpDownload.pleaseSelectTiles" contains the translated text
 * @property {String} failedToDownload= additional:modules.sdpDownload.failedToDownload" contains the translated text
 * @property {String} details= additional:modules.sdpDownload.details" contains the translated text
 * @property {String} serviceNotResponding= additional:modules.sdpDownload.serviceNotResponding
 * @property {String} error= additional:modules.sdpDownload.alerts.error" contains the translated text
 * @property {String} info= additional:modules.sdpDownload.alerts.info" contains the translated text
 * @property {String} tooManyTilesSelected= additional:modules.sdpDownload.tooManyTilesSelected" contains the translated text
 */

const state = {
    type: "SdpAddon",
    active: false,
    // defaults for config.json parameters
    description: "additional:modules.sdpDownload.description",
    name: "additional:modules.sdpDownload.name",
    icon: "bi-download",
    hasMouseMapInteractions: true,
    wmsRasterLayerId: "4707",
    formats: [
        {id: "NAS", label: "additional:modules.sdpDownload.nasLabel", isSelected: true, desc: "additional:modules.sdpDownload.nasDescription", fileId: "nas"},
        {id: "DWG_310", label: "additional:modules.sdpDownload.dwg310Label", isSelected: false, desc: "additional:modules.sdpDownload.dwg310Description", fileId: "dwg310"},
        {id: "DWG_320", label: "additional:modules.sdpDownload.dwg320Label", isSelected: false, desc: "additional:modules.sdpDownload.dwg320Description", fileId: "dwg320"},
        {id: "JPG", label: "additional:modules.sdpDownload.jpgLabel", isSelected: false, desc: "additional:modules.sdpDownload.jpgDescription", fileId: "jpg"}],
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
    transactionProcessing: false,
    selectFormat: "additional:modules.sdpDownload.selectFormat",
    howToChooseTiles: "additional:modules.sdpDownload.howToChooseTiles",
    downloadDataPackage: "additional:modules.sdpDownload.downloadDataPackage",
    specialDownloads: "additional:modules.sdpDownload.specialDownloads",
    neuwerkDataPackage: "additional:modules.sdpDownload.neuwerkDataPackage",
    scharhoernDataPackage: "additional:modules.sdpDownload.scharhoernDataPackage",
    tileOverview310: "additional:modules.sdpDownload.tileOverview310",
    tileOverview320: "additional:modules.sdpDownload.tileOverview320",
    pleaseSelectTiles: "additional:modules.sdpDownload.pleaseSelectTiles",
    failedToDownload: "additional:modules.sdpDownload.failedToDownload",
    details: "additional:modules.sdpDownload.details",
    serviceNotResponding: "additional:modules.sdpDownload.serviceNotResponding",
    error: "additional:modules.sdpDownload.alerts.error",
    info: "additional:modules.sdpDownload.alerts.info",
    tooManyTilesSelected: "additional:modules.sdpDownload.tooManyTilesSelected"
};

export default state;
