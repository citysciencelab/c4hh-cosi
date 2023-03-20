import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import VerkehrsstaerkenThemeLineChart from "../../../components/VerkehrsstaerkenThemeLineChart.vue";

const localVue = createLocalVue();

config.mocks.$t = key => key;

localVue.use(Vuex);
describe("src/modules/tools/gfi/components/themes/verkehrsstaerken/components/VerkehrsstaerkenThemeLineChart.vue", () => {

    const dataset = [{"class": "dot", "style": "circle", "year": 2008, "DTV": 17000, "DTVw": 19000, "Schwerverkehrsanteil am DTVw": 5}, {"class": "dot", "style": "circle", "year": 2009, "DTV": 17000, "DTVw": 19000, "Schwerverkehrsanteil am DTVw": 6}, {"class": "dot", "style": "circle", "year": 2010, "DTV": 17000, "DTVw": 18000, "Schwerverkehrsanteil am DTVw": 6}, {"class": "dot", "style": "circle", "year": 2011, "DTV": 17000, "DTVw": 19000, "Schwerverkehrsanteil am DTVw": 5}, {"class": "dot", "style": "circle", "year": 2012, "DTV": 16000, "DTVw": 18000, "Schwerverkehrsanteil am DTVw": 5}, {"class": "dot", "style": "circle", "year": 2013, "DTV": 16000, "DTVw": 18000, "Schwerverkehrsanteil am DTVw": 5}, {"class": "dot", "style": "circle", "year": 2014, "DTV": 16000, "DTVw": 18000, "Schwerverkehrsanteil am DTVw": 5}, {"class": "dot", "style": "circle", "year": 2015, "DTV": 16000, "DTVw": 18000, "Schwerverkehrsanteil am DTVw": 5}, {"class": "dot_visible", "style": "rect", "year": 2016, "DTV": 18000, "DTVw": 20000, "Schwerverkehrsanteil am DTVw": 6, "Baustelleneinfluss": "Ja"}, {"class": "dot", "style": "circle", "year": 2017, "DTV": 16000, "DTVw": 18000, "Schwerverkehrsanteil am DTVw": 5}, {"class": "dot", "style": "circle", "year": 2018, "DTV": 16000, "DTVw": 17000, "Schwerverkehrsanteil am DTVw": 5}];
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(VerkehrsstaerkenThemeLineChart, {
            propsData: {
                dataset: dataset
            },
            data () {
                return {
                    category: "DTV"
                };
            },
            localVue
        });
    });


    it("should exist", () => {
        expect(wrapper.find("#verkehrsstaerken-line-chart").exists()).to.be.true;
    });

    it("buttons to change categories should exist", async () => {
        const btns = wrapper.findAll("button");

        expect(btns.length).to.equal(3);
        expect(wrapper.find("#verkehrsstaerken-btn-group").exists()).to.be.true;
        expect(btns.at(0).text()).to.equals("additional:modules.tools.gfi.themes.verkehrsstaerken.DTV");
        expect(btns.at(1).text()).to.equals("additional:modules.tools.gfi.themes.verkehrsstaerken.DTVw");
        expect(btns.at(2).text()).to.equals("additional:modules.tools.gfi.themes.verkehrsstaerken.HGVsPerWeek");
    });

    it("click on button should change category", async () => {
        const buttons = wrapper.findAll("button");

        await buttons.at(0).trigger("click");
        expect(wrapper.vm.category).to.equals("DTV");

        await buttons.at(1).trigger("click");
        expect(wrapper.vm.category).to.equals("DTVw");

        await buttons.at(2).trigger("click");
        expect(wrapper.vm.category).to.equals("Schwerverkehrsanteil am DTVw");
    });

    it("should returns an object with data for the charts", () => {
        expect(wrapper.vm.createChartData(dataset, "DTV")).to.deep.equals(
            {
                labels: [2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018],
                datasets:
                [
                    {
                        borderColor: "rgba(70, 130, 180, 1)",
                        data: [17000, 17000, 17000, 17000, 16000, 16000, 16000, 16000, 18000, 16000, 16000],
                        fill: false,
                        lineTension: 0,
                        label: "additional:modules.tools.gfi.themes.verkehrsstaerken.carsPerDay",
                        pointBackgroundColor: ["rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(255, 0, 0, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)"],
                        pointBorderColor: ["rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(255, 0, 0, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)"],
                        pointRadius: [5, 5, 5, 5, 5, 5, 5, 5, 6, 5, 5],
                        pointStyle: ["circle", "circle", "circle", "circle", "circle", "circle", "circle", "circle", "rect", "circle", "circle"]
                    },
                    {
                        borderColor: "rgba(255, 0, 0, 1)",
                        fill: false,
                        label: "additional:modules.tools.gfi.themes.verkehrsstaerken.withConstructionSiteInfluence",
                        pointBackgroundColor: "rgba(255, 0, 0, 1)",
                        pointBorderColor: "rgba(255, 0, 0, 1)",
                        pointRadius: 6,
                        pointStyle: "rect"
                    }
                ]
            }
        );
    });

    it("should returns prepared data with data for the datasets", () => {
        expect(wrapper.vm.prepareDataset(dataset, "DTV")).to.deep.equals(
            {
                color: ["rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)", "rgba(255, 0, 0, 1)", "rgba(70, 130, 180, 1)", "rgba(70, 130, 180, 1)"],
                labels: [2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018],
                data: [17000, 17000, 17000, 17000, 16000, 16000, 16000, 16000, 18000, 16000, 16000],
                pointStyle: ["circle", "circle", "circle", "circle", "circle", "circle", "circle", "circle", "rect", "circle", "circle"],
                radius: [5, 5, 5, 5, 5, 5, 5, 5, 6, 5, 5]
            }
        );
    });

    it("should returns the label for a category", () => {
        expect(wrapper.vm.createDatasetLabel("DTV")).to.equals("additional:modules.tools.gfi.themes.verkehrsstaerken.carsPerDay");
        expect(wrapper.vm.createDatasetLabel("DTVw")).to.equals("additional:modules.tools.gfi.themes.verkehrsstaerken.carsPerDayWeekly");
        expect(wrapper.vm.createDatasetLabel("Schwerverkehrsanteil am DTVw")).to.equals("additional:modules.tools.gfi.themes.verkehrsstaerken.HGVsPerWeek");
    });

    it("should returns the chart legend configuration", () => {
        expect(wrapper.vm.createChartLegend("DTV")).to.deep.includes({
            display: true,
            position: "top",
            align: "start"
        });
    });

    it("should returns an object with tooltip for the charts", () => {
        const result = wrapper.vm.createChartTooltip();

        expect(result.bodyFontColor).to.equals("rgba(85, 85, 85, 1)");
        expect(result.backgroundColor).to.equals("rgba(240, 240, 240, 1)");

        expect(result.callbacks.label).to.be.a("function");
        expect(result.callbacks.label({value: 17000})).equals("17.000");
        expect(result.callbacks.title).to.be.a("function");
        expect(result.callbacks.title()).to.be.false;
    });

    it("should returns an object with scales for the charts ", () => {
        const result = wrapper.vm.createChartScales();

        expect(result.xAxes[0].scaleLabel).to.deep.equals({
            display: true,
            labelString: "additional:modules.tools.gfi.themes.verkehrsstaerken.year"
        });
        expect(result.xAxes[0].ticks.min).equals(2008);
        expect(result.xAxes[0].ticks.max).equals(2018);
        expect(result.xAxes[0].gridLines).to.deep.equals({
            color: "rgba(0, 0, 0, 1)",
            display: true,
            drawBorder: true,
            drawOnChartArea: false
        });

        expect(result.yAxes[0].scaleLabel).to.deep.equals({
            display: true,
            labelString: "additional:modules.tools.gfi.themes.verkehrsstaerken.carsPerDay"
        });
        expect(result.yAxes[0].ticks.beginAtZero).equals(true);
        expect(result.yAxes[0].ticks.precision).equals(0);
        expect(result.xAxes[0].gridLines).to.deep.equals({
            color: "rgba(0, 0, 0, 1)",
            display: true,
            drawBorder: true,
            drawOnChartArea: false
        });

    });

});
