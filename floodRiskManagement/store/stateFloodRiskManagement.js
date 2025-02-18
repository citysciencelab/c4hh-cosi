/**
 * User type definition
 * @typedef {Object} floodRiskManagement
 * @property {String} description - the description of floodRiskManagement.
 * @property {Object} cycles - the cycles objects.
 * @property {String} cycleId - the current cycle id.
 * @property {String} events - events of the flood.
 * @property {String} icon - Icon next to title.
 * @property {String} id - id of the WaterRiskCheck component.
 * @property {Boolean} isPrinting - if it is printing.
 * @property {Object} mappedLayerGroup - the mapped layer groups for printing.
 * @property {String} name - Displayed as title.
 * @property {Boolean} printDisabled - if the print button is disabled.
 * @property {String} printHwsId - the printHwsId for print.
 * @property {String} selectedCycleName - the selected cycle name.
 * @property {String} selectedEvent - the selected flood event.
 * @property {String} selectedFrequency - the selected frequeny of flood events.
 * @property {String} selectedType - the selected map type.
 * @property {String} type - type of the floodRiskManagement component.
 * @property {String} types - types of the flood card.
 * @property {Boolean} autoAdjustScale - if it is automatic adjusting the scale.
 * @property {String} currentFormat - the current printed format.
 * @property {String} currentLayout - the current layout.
 * @property {String} currentLayoutName - the current layout name.
 * @property {String} currentScale - the current scale.
 * @property {Number} DOTS_PER_INCH - the DOTS_PER_INCH parameter.
 * @property {String} dpiForPdf - the dpi for pdf.
 * @property {Event} eventListener the event listener for postrender.
 * @property {String} filename - the printed file name.
 * @property {String} hintInfo - the hint information.
 * @property {Number} INCHES_PER_METER - the INCHES_PER_METER parameter.
 * @property {ol/layer[]} invisibleLayer contains layers that are not displayed in the current scale.
 * @property {Boolean} isMapAvailable true if the Map is available.
 * @property {Boolean} isScaleAvailable true if the current layout supports scale.
 * @property {Boolean} isScaleSelectedManually is scale selected by the user over the view.
 * @property {String[]} layoutList the identifier of one of the available mapfish print configurations.
 * @property {Number[]} layoutMapInfo width and height of the map.
 * @property {Object} mapAttribute Attributes from the Map set from the layout.
 * @property {Boolean} maskStarted - true if the print mask is started.
 * @property {Array} optimalScale the optimal scale for the print.
 * @property {String} optimalResolution - the optional resolution.
 * @property {String} outputFormat the ending of the generated file.
 * @property {String} printAppCapabilities URL for the page in the print service where the information of layouts etc are.
 * @property {String} printAppId the identifier of one of the available mapfish print configurations.
 * @property {ol/layer[]} printLayerList the printed layer list.
 * @property {Boolean} printMapMarker - true if it is print map marker.
 * @property {String} printServiceId the id from the rest services json for the print app.
 * @property {String} printService the type of print service, mapfish and plotservice currently possible.
 * @property {Boolean} printStarted - true if the print process is started.
 * @property {Object} scaleAttribute - the scale attribute.
 * @property {Number[]} scaleList available scales of the specified print configuration.
 * @property {String} serviceUrl the service url.
 * @property {String} title title for the report.
 * @property {ol/layer[]} visibleLayer the visible layer.
 * @property {ol/layer[]} visibleLayerList the visible layer list.
 */
const state = {
    description: "additional:modules.floodRiskManagement.description",
    cycles: {},
    cycleId: "",
    events: {
        "Flusshochwasser": {
            "häufig": "10-jährliches Ereignis (H für High)",
            "mittel": "100-jährliches Ereignis (M für Middle)",
            "selten": "200-jährliches Ereignis (L für Low)"
        },
        "Küstenhochwasser": {
            "häufig": "20-jährliches Ereignis (H für High)",
            "mittel": "100-jährliches Ereignis (M für Middle)",
            "extremes": "Extremereignis (L für Low)"
        }
    },
    icon: "bi-water",
    id: "floodRiskManagement",
    isPrinting: false,
    mappedLayerGroup: {
        "gbh": {
            "event": "Flusshochwasser",
            "frequency": "häufig",
            "type": "Hochwassergefahrenkarte"
        },
        "gbm": {
            "event": "Flusshochwasser",
            "frequency": "mittel",
            "type": "Hochwassergefahrenkarte"
        },
        "gbs": {
            "event": "Flusshochwasser",
            "frequency": "selten",
            "type": "Hochwassergefahrenkarte"
        },
        "gsh": {
            "event": "Küstenhochwasser",
            "frequency": "häufig",
            "type": "Hochwassergefahrenkarte"
        },
        "gsm": {
            "event": "Küstenhochwasser",
            "frequency": "mittel",
            "type": "Hochwassergefahrenkarte"
        },
        "gss": {
            "event": "Küstenhochwasser",
            "frequency": "extremes",
            "type": "Hochwassergefahrenkarte"
        },
        "rbh": {
            "event": "Flusshochwasser",
            "frequency": "häufig",
            "type": "Hochwasserrisikokarte"
        },
        "rbm": {
            "event": "Flusshochwasser",
            "frequency": "mittel",
            "type": "Hochwasserrisikokarte"
        },
        "rbs": {
            "event": "Flusshochwasser",
            "frequency": "selten",
            "type": "Hochwasserrisikokarte"
        },
        "rsh": {
            "event": "Küstenhochwasser",
            "frequency": "häufig",
            "type": "Hochwasserrisikokarte"
        },
        "rsm": {
            "event": "Küstenhochwasser",
            "frequency": "mittel",
            "type": "Hochwasserrisikokarte"
        },
        "rss": {
            "event": "Küstenhochwasser",
            "frequency": "extremes",
            "type": "Hochwasserrisikokarte"
        }
    },
    name: "additional:modules.floodRiskManagement.title",
    printDisabled: true,
    printHwsId: "gbm",
    selectedCycleName: "",
    selectedEvent: "",
    selectedFrequency: "",
    selectedType: "",
    type: "floodRiskManagement",
    types: [
        {
            type: "Hochwassergefahrenkarte",
            text: "Die Gefahrenkarten stellen das Ausmaß der Hochwasserereignisse in Form der Ausdehnung und der sich einstellenden Wassertiefen dar.",
            icon: "bi bi-water"
        },
        {
            type: "Hochwasserrisikokarte",
            text: "Die Risikokarten zeigen, wie die betroffenen Flächen genutzt werden, die Lage von Industrieanlagen und Schutzgütern sowie die Anzahl der potenziell betroffenen Einwohner.",
            icon: "bi bi-buildings"
        }
    ],
    // Print Parameter
    autoAdjustScale: true,
    currentFormat: "pdf",
    currentLayout: undefined,
    currentLayoutName: "A3 Hochformat",
    currentScale: undefined,
    DOTS_PER_INCH: 72,
    dpiForPdf: 200,
    eventListener: undefined,
    filename: "report",
    hintInfo: "",
    INCHES_PER_METER: 39.37,
    invisibleLayer: [],
    isMapAvailable: true,
    isScaleAvailable: false,
    isScaleSelectedManually: false,
    layoutList: [],
    layoutMapInfo: [],
    mapAttribute: null,
    maskStarted: false,
    optimalScale: null,
    optimalResolution: "",
    outputFormat: "pdf",
    printAppCapabilities: "capabilities.json",
    printAppId: "hochwasserschutz",
    printLayerList: [],
    printMapMarker: false,
    printServiceId: "mapfish",
    printService: "mapfish",
    printStarted: false,
    scaleAttribute: null,
    scaleList: [],
    serviceUrl: "",
    title: "Report",
    visibleLayer: [],
    visibleLayerList: []
};

export default state;
