import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import VerkehrsstaerkenTheme from "../../../components/VerkehrsstaerkenTheme.vue";


config.global.mocks.$t = key => key;

describe("addons_3_0_0/gfiThemes/verkehrsstaerken/components/VerkehrsstaerkenTheme.vue", () => {

    const mappedProps = {"Zählstelle": "2693", "Bezeichnung": "Beim Schlump NO Schäferkampsallee T179", "Art": "Kurzpegel", "DTV 2008": "17000", "DTVw 2008": "19000", "Schwerverkehrsanteil am DTVw 2008": "5 %", "DTV 2009": "17000", "DTVw 2009": "19000", "Schwerverkehrsanteil am DTVw 2009": "6 %", "DTV 2010": "17000", "DTVw 2010": "18000", "Schwerverkehrsanteil am DTVw 2010": "6 %", "DTV 2011": "17000", "DTVw 2011": "19000", "Schwerverkehrsanteil am DTVw 2011": "5 %", "DTV 2012": "16000", "DTVw 2012": "18000", "Schwerverkehrsanteil am DTVw 2012": "5 %", "DTV 2013": "16000", "DTVw 2013": "18000", "Schwerverkehrsanteil am DTVw 2013": "5 %", "DTV 2014": "16000", "DTVw 2014": "18000", "Schwerverkehrsanteil am DTVw 2014": "5 %", "DTV 2015": "16000", "DTVw 2015": "18000", "Schwerverkehrsanteil am DTVw 2015": "5 %", "DTV 2016": "18000", "DTVw 2016": "20000", "Schwerverkehrsanteil am DTVw 2016": "6 %", "Baustelleneinfluss 2016": "*", "DTV 2017": "16000", "DTVw 2017": "18000", "Schwerverkehrsanteil am DTVw 2017": "5 %", "DTV 2018": "16000", "DTVw 2018": "17000", "Schwerverkehrsanteil am DTVw 2018": "5 %"};
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(VerkehrsstaerkenTheme, {
            props: {
                feature: {
                    getMappedProperties: () => mappedProps
                }
            },
            computed: {
                currentLocale: () => "de"
            }
        });
    });

    it("should exist", () => {
        expect(wrapper.find("div").exists()).to.be.true;
    });

    it("should show tabs", async () => {
        expect(wrapper.findAll("ul")[0].exists()).to.be.true;
        expect(wrapper.findAll("li").length).to.equal(2);
        expect(wrapper.findAll("li")[0].text()).to.equal("additional:modules.tools.gfi.themes.verkehrsstaerken.table");
        expect(wrapper.findAll("li")[1].text()).to.equal("additional:modules.tools.gfi.themes.verkehrsstaerken.diagram");
        expect(wrapper.find(".tab-content").exists()).to.be.true;
    });

    it("should contain download button", () => {
        expect(wrapper.find("flat-button-stub").exists()).to.be.true;
    });

    it("change tabs should change className", async () => {
        const tab = wrapper.findAll("a")[1];

        expect(wrapper.find("#verkehrsstaerken-table-tab").attributes().class).to.contain("active");

        expect(wrapper.find("#verkehrsstaerken-diagram-tab").attributes().class).not.to.contain("active");

        tab.trigger("click");
        await wrapper.vm.$nextTick();

        expect(wrapper.find("#verkehrsstaerken-table-tab").attributes().class).not.to.contain("active");

        expect(wrapper.find("#verkehrsstaerken-diagram-tab").attributes().class).to.contain("active");
    });

});
