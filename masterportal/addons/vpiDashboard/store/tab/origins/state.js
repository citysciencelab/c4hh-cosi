const state = {
    averageVisitorsPerWeek: {
        Hamburger: {},
        Pendler: {},
        Touristen: {}
    },
    allOriginsData: [],
    allOriginsMonthlyData: {},
    allOriginsMonthlyDataLine: {},
    originsMonthlyXLabels: {},
    originsChartLabels: [
        {attrLookup: "Hamburger", color: "#00aa55", text: "additional:modules.tools.vpidashboard.tab.origins.hamburger"},
        {attrLookup: "Pendler", color: "#007ea8", text: "additional:modules.tools.vpidashboard.tab.origins.pendler"},
        {attrLookup: "Touristen", color: "#9784ff", text: "additional:modules.tools.vpidashboard.tab.origins.touristen"}
    ]
};

export default state;
