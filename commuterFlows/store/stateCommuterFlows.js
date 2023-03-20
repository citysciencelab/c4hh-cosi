/**
 * User type definition
 * @typedef {Object} CommuterFlowsState
 * @property {Boolean} active if true, CommuterFlows will rendered
 * @property {String} name displayed as title (config-param)
 * @property {String} icon icon next to title (config-param)
 * @property {Boolean} renderToWindow if true, tool is rendered in a window, else in sidebar (config-param)
 * @property {Boolean} resizableWindow if true, window is resizable (config-param)
 * @property {Boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 * @property {String} metaVerPath the path to find more information about metaVer
 * @property {String[]} blacklistedDistricts districts (or cities) to not show in any case
 * @property {String} serviceURL the url to the commuter service (wfs)
 * @property {Number} listChunk the amount of features to receive for each show more/less call
 * @property {Boolean} setMarkerOnClickInList whether or not the marker should be placed clicking in the feature list
 * @property {Object} onstart the initial settings for start or reset
 * @property {Boolean} onstart.captionsChecked whether or not the captions are set on start or reset
 * @property {Boolean} onstart.numbersChecked whether or not the numbers are set on start or reset
 * @property {Boolean} onstart.beamsChecked whether or not the beams are set on start or reset
 * @property {Boolean} onstart.animationChecked whether or not the animtaion is set on start or reset
 * @property {String} onstart.direction the start direction as String "out" or String "in"
 * @property {String} olFont the font to use for captions as ol/Text.font
 * @property {Object} olFontShadow the shadow for the captions as ol/Stroke options
 * @property {Object} olBeam the style for the lines (beams) as ol/Stroke options
 * @property {String} [olBubbleAlgorithm="area"] the algorithm to calculate the bubble sizes with ("area" or "radius")
 * @property {Number} olBubblePixelMax the maximum radius for bubbles in px
 * @property {Number} olBubblePixelMin the minimum radius for bubbles in px (does only apply for calcRadiusPxByRatio)
 * @property {Object} olBubbleBorder the style of the border of bubbles as ol/Stroke options
 * @property {Number[]} olBubbleColors the colors to use for the bubbles as list of rgby colors
 * @property {Number[]} olBubbleColorShift the highlight/lowlight shifting added to bubbleColors before repeating the colors
 * @property {Object} olZoomOptions the options for the zoom function given to the ol event for zooming
 * @property {Number[]} olAnimationPaces the pace for the animation: even idx for forwards speed in ms, odd idx for backwards speed in ms, leave a zero to jump forwards/backwards
 */
const state = {
    active: false,
    id: "CommuterFlows",
    name: "translate#additional:modules.tools.commuterFlows.title",
    icon: "bi-arrow-left-right",
    renderToWindow: true,
    resizableWindow: true,
    isVisibleInMenu: true,
    deactivateGFI: true,
    metaVerPath: "",
    blacklistedDistricts: [],
    serviceURL: "",
    listChunk: 5,
    setMarkerOnClickInList: true,
    onstart: {
        captionsChecked: true,
        numbersChecked: true,
        beamsChecked: true,
        animationChecked: false,
        direction: "out"
    },
    olFont: "10pt sans-serif",
    olFontShadow: {
        color: [255, 255, 255, 0.8],
        width: 5
    },
    olBeam: {
        color: [192, 9, 9, 0.8],
        width: 3
    },
    olBubbleAlgorithm: "linear",
    olBubblePixelMax: 50,
    olBubblePixelMin: 5,
    olBubbleBorder: {
        color: [255, 255, 255, 1],
        width: 1
    },
    olBubbleColors: [
        [230, 159, 0, 0.75],
        [86, 180, 233, 0.75],
        [0, 158, 115, 0.75],
        [240, 228, 66, 0.75],
        [0, 114, 178, 0.75],
        [213, 94, 0, 0.75],
        [204, 121, 167, 0.75]
    ],
    olBubbleColorShift: [0, -60, 60],
    olZoomOptions: {
        padding: [20, 20, 20, 400]
    },
    olAnimationPaces: [5000, 500]
};

export default state;
