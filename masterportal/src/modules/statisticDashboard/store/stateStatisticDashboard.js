// @ts-check
/** @import { StatisticDashboardLevel } from "../types/typesStatisticDashboard" */
/** @import { ReferenceData } from "../types/internalTypes" */
/** @import {DropdownItem} from "@shared/modules/dropdown/types/typesDropdown.js" */

/**
 * Statistic dashboard tool state definition.
 * @typedef {Object} StatisticDashboardState
 * @property {Boolean} active If true, SaveSelection will be rendered.
 * @property {String} id Id of the Contact component.
 * @property {String} name Displayed as the title. (config-param)
 * @property {String} subtitle Displayed as the subtitle. (config-param)
 * @property {String} icon Icon next to the title. (config-param)
 * @property {Boolean} isVisibleInMenu If true, tool is selectable in menu. (config-param)
 * @property {StatisticDashboardLevel[]} data The configured levels with their data sources. (config-param)
 * @property {Boolean} showAggregatedView If true, only aggregated statistics are offered in the statistics dropdown and their specific statistics can be selected in an accordion. (config-param)
 * @property {Number} specificsChipLimit The number of selected specific statistics shown per aggregated statistic before "show all" is offered. Values below 1 show all. (config-param)
 * @property {Record<string, string[]>} selectedSpecificsTags - The selected tags per aggregated statistic key.
 * @property {ReferenceData} referenceData - The reference data used in the statistic dashboard.
 * @property {Object|undefined} selectedReferenceData the selected reference data
 * @property {string|undefined} selectedLevelName - The levelName of the selected level (district, county, ...). The level itself is provided by the getter selectedLevel.
 * @property {string[]} selectedCategories - The selected categories.
 * @property {string[]} selectedStatisticsKeys - The keys of the selected statistics.
 * @property {Object[]} flattenedRegions - An array in which the region hierarchy is flattened.
 * @property {Object[]} selectedRegions - The selected regions.
 * @property {DropdownItem[]} timeStepsFilter - The available time steps for filtering.
 * @property {Object[]} selectedDates - The selected dates.
 * @property {String} classificationMode - Method of dividing values into classes: "quantiles" or "equalIntervals".
 * @property {Boolean} allowPositiveNegativeClasses - If classification may contain classes like "from -1 to 1".
 * @property {Number} minNumberOfClasses - Minimum Number of classes selectable when editing the legend.
 * @property {Number} maxNumberOfClasses - Maximum Number of classes selectable when editing the legend.
 * @property {Number} numberOfClasses - Current number of classes selected in range.
 * @property {Object[]} selectableColorPalettes - Available options for color palettes.
 * @property {String} selectableColorPalettes[].label - The label of the color palette option. If not set, key is used.
 * @property {String} selectableColorPalettes[].key - The key of the colorbrewer scheme.
 * @property {Number} selectedColorPaletteIndex - Index of chosen color palette option.
 * @property {Number[]} stepValues - The values defining the thresolds for classification.
 * @property {Number[][]} colorPalette - The current set of colors used for classification.
 * @property {Number} opacity - Opacity/alpha-channel of the colors.
 * @property {Object} legendData the legendValues with colors and value
 * @property {Boolean} addTotalCount If true, a row with total count will be inserted in table.
 * @property {Number|null} lineLimit The number of lines from which the line diagram is limited.
 * @property {Number|null} barLimit The number of bars from which the line diagram is limited.
 * @property {String} downloadFilename the exported file name.
 * @property {String} chosenStatisticName the clicked chosen statistic name.
 * @property {Boolean} isFeatureLoaded If true, the features of layer will be loaded.
 */

/**  @type {StatisticDashboardState} */
const state = {
    id: "statisticDashboard",
    name: "common:modules.statisticDashboard.name",
    subtitle: "common:modules.statisticDashboard.headings.mrhstatistics",
    levelTitle: undefined,
    description: "common:modules.statisticDashboard.description",
    icon: "bi-bar-chart-line-fill",
    isVisibleInMenu: true,
    colorScheme: {},
    data: [],
    showAggregatedView: false,
    specificsChipLimit: 5,
    selectedSpecificsTags: {},
    referenceData: {},
    selectedReferenceData: undefined,
    selectedCategories: [],
    selectedReferenceValueTag: undefined,
    selectedRegions: [],
    selectedLevelName: undefined,
    flattenedRegions: [],
    timeStepsFilter: [],
    selectedDates: [],
    selectedStatisticsKeys: [],
    classificationMode: "quantiles",
    allowPositiveNegativeClasses: false,
    decimalPlaces: 1,
    minNumberOfClasses: 3,
    maxNumberOfClasses: 9,
    numberOfClasses: 5,
    selectableColorPalettes: [
        {key: "YlGn", label: "Gelb-Grün"},
        {key: "YlOrRd", label: "Gelb-Rot"},
        {key: "Blues", label: "Blau"},
        {key: "Greys", label: "Grau"},
        {key: "Greens", label: "Grün"},
        {key: "Reds", label: "Rot"},
        {key: "Oranges", label: "Orange"},
        {key: "Purples", label: "Violett"}
    ],
    selectedColorPaletteIndex: 0,
    stepValues: [],
    colorPalette: [],
    opacity: 0.9,
    chartTableToggle: "table",
    legendData: [],
    addTotalCount: false,
    lineLimit: null,
    downloadFilename: "Statistic Dashboard Download",
    barLimit: null,
    chosenStatisticName: "",
    isFeatureLoaded: true
};

export default state;
