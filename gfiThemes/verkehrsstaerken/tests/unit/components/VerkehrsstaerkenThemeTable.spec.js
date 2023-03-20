import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import VerkehrsstaerkenThemeTable from "../../../components/VerkehrsstaerkenThemeTable.vue";

const localVue = createLocalVue();

config.mocks.$t = key => key;

localVue.use(Vuex);
describe("src/modules/tools/gfi/components/themes/verkehrsstaerken/components/VerkehrsstaerkenThemeTable.vue", () => {

    const years = [2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018],
        rowNames = ["DTV", "DTVw", "Schwerverkehrsanteil am DTVw", "Baustelleneinfluss"],
        dataset = [{"class": "dot", "style": "circle", "year": 2008, "DTV": 17000, "DTVw": 19000, "Schwerverkehrsanteil am DTVw": 5}, {"class": "dot", "style": "circle", "year": 2009, "DTV": 17000, "DTVw": 19000, "Schwerverkehrsanteil am DTVw": 6}, {"class": "dot", "style": "circle", "year": 2010, "DTV": 17000, "DTVw": 18000, "Schwerverkehrsanteil am DTVw": 6}, {"class": "dot", "style": "circle", "year": 2011, "DTV": 17000, "DTVw": 19000, "Schwerverkehrsanteil am DTVw": 5}, {"class": "dot", "style": "circle", "year": 2012, "DTV": 16000, "DTVw": 18000, "Schwerverkehrsanteil am DTVw": 5}, {"class": "dot", "style": "circle", "year": 2013, "DTV": 16000, "DTVw": 18000, "Schwerverkehrsanteil am DTVw": 5}, {"class": "dot", "style": "circle", "year": 2014, "DTV": 16000, "DTVw": 18000, "Schwerverkehrsanteil am DTVw": 5}, {"class": "dot", "style": "circle", "year": 2015, "DTV": 16000, "DTVw": 18000, "Schwerverkehrsanteil am DTVw": 5}, {"class": "dot_visible", "style": "rect", "year": 2016, "DTV": 18000, "DTVw": 20000, "Schwerverkehrsanteil am DTVw": 6, "Baustelleneinfluss": "Ja"}, {"class": "dot", "style": "circle", "year": 2017, "DTV": 16000, "DTVw": 18000, "Schwerverkehrsanteil am DTVw": 5}, {"class": "dot", "style": "circle", "year": 2018, "DTV": 16000, "DTVw": 17000, "Schwerverkehrsanteil am DTVw": 5}];
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(VerkehrsstaerkenThemeTable, {
            propsData: {
                rowNames: rowNames,
                years: years,
                dataset: dataset
            },
            localVue
        });
    });


    it("should exist", () => {
        expect(wrapper.find(".verkehrsstaerken-table").exists()).to.be.true;
    });

    it("table cells should exist", async () => {
        expect(wrapper.findAll("th").length).to.equals(years.length + 1);
        expect(wrapper.findAll("td").length).to.equals(rowNames.length * (years.length + 1));
    });
});
