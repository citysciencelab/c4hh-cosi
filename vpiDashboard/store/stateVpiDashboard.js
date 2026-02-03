import tabOriginsState from "./tab/origins/state.js";
import tabAgeGroupsState from "./tab/age-groups/state.js";
import tabGendersState from "./tab/gender/state.js";
import {Style, Fill, Stroke} from "ol/style.js";

const state = {
    id: "vpiDashboard",
    active: false,
    name: "additional:modules.tools.vpidashboard.name",
    icon: "bi-graph-up",
    type: "vpiDashboard",
    renderToWindow: false,
    resizableWindow: true,
    isVisibleInMenu: true,
    deactivateGFI: false,
    hasMouseMapInteractions: true,
    currentLocale: "de-DE",
    initialSelectedGeoId: 0,
    heatmapLayers: [],
    gridLayerId: "",
    currentTabIndex: 0,
    chartData: "overview",
    sumVisitorsPerMonth: [],
    averageVisitorsPerDay: [],
    visitorsPerYear: "",
    allLocationsArray: [],
    barChartDailyData: [],
    lineChartDailyData: [],
    barChartMonthlyData: [],
    lineChartMonthlyData: [],
    showLoader: false,
    selectedLocationId: "",
    selectedLocationBId: "",
    activityData: {},
    selectInteraction: null,
    sliderData: [],
    sliderSelectedValues: [],
    sliderTitle: "",
    dailyOverviewXLabels: [],
    monthlyXLabels: [],
    yearList: [],
    currentMonthIndex: 0,
    currentDayIndex: 0,
    currentIndex: 0,
    layerConfigs: [],
    selectedFeatures: [],
    selectCount: 1,
    geoIdToNameMapping: {},
    uniqueGeoIdsWithNames: [],
    selectStyle: new Style({
        stroke: new Stroke({color: "#fa0505", width: 1}),
        fill: new Fill({color: [255, 0, 0, 0.2]})
    }),
    ...tabOriginsState,
    ...tabAgeGroupsState,
    ...tabGendersState
};

export default state;
