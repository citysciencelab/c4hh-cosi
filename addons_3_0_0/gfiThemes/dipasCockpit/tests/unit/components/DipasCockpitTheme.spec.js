import {shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import DipasCockpitTheme from "../../../components/DipasCockpitTheme.vue";

const localVue = createLocalVue();

describe("addons/dipasCockpit/components/DipasCockpitTheme.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(DipasCockpitTheme, {
            propsData: {
                feature: {
                    getMappedProperties: function () {
                        return {
                            "proceeding": "test1",
                            "themes": "Kategorie 1, Kategorie 2, Kategorie 3",
                            "status": "aktiv",
                            "status_icon": "http://localhost:8080/drupal/modules/custom/dipas/assets/location_on_white_24dp.svg",
                            "responsible": "Behörde für Stadtentwicklung und Wohnen",
                            "link": "http://test1.localhost:8080/#",
                            "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                            "numberContributions": 25,
                            "numberComments": 43,
                            "documentation": [{
                                "name": "Download1",
                                "url": "http://test1.localhost:8080/drupal/sites/default/files/2022-04/test_2.docx",
                                "icon": "http://localhost:8080/drupal/modules/custom/dipas/assets/picture_as_pdf_white_24dp.svg"
                            },
                            {
                                "name": "Download2",
                                "url": "http://test1.localhost:8080/drupal/sites/default/files/2022-04/test_3.docx",
                                "icon": "http://localhost:8080/drupal/modules/custom/dipas/assets/picture_as_pdf_white_24dp.svg"
                            }]
                        };
                    }
                }
            },
            localVue,
            mocks: {
                $t: (msg) => msg
            }
        });
    });

    it("should render 13 individual html elements", () => {
        expect(wrapper.find(".dipas-cockpit-theme").exists()).to.be.true;
        expect(wrapper.find(".dipas-cockpit-proceeding-status").exists()).to.be.true;
        expect(wrapper.find(".dipas-cockpit-location-icon").exists()).to.be.true;
        expect(wrapper.find(".dipas-cockpit-title").exists()).to.be.true;
        expect(wrapper.find(".dipas-cockpit-themes").exists()).to.be.true;
        expect(wrapper.find(".dipas-cockpit-themes-key").exists()).to.be.true;
        expect(wrapper.find(".dipas-cockpit-description").exists()).to.be.true;
        expect(wrapper.find(".dipas-cockpit-initiators").exists()).to.be.true;
        expect(wrapper.find(".dipas-cockpit-proceedingLink").exists()).to.be.true;
        expect(wrapper.find(".dipas-cockpit-proceedingNumbers").exists()).to.be.true;
        expect(wrapper.find(".dipas-cockpit-documentation").exists()).to.be.true;
        expect(wrapper.find(".dipas-cockpit-document").exists()).to.be.true;
        expect(wrapper.find(".dipas-cockpit-document-icon").exists()).to.be.true;
    });

    it("should render .dipas-cockpit-document twice", () => {
        expect(wrapper.findAll(".dipas-cockpit-document").length).to.equal(2);
    });

    it("should render the div with class .dipas-cockpit-proceeding-status with content aktiv", () => {
        expect(wrapper.find(".dipas-cockpit-proceeding-status").text()).to.equals("aktiv");
    });


    it("should render the div with class .dipas-cockpit-themes with content Kategorie 1, Kategorie 2, Kategorie 3", () => {
        expect(wrapper.find(".dipas-cockpit-themes").text()).to.contain("Kategorie 1, Kategorie 2, Kategorie 3");
    });

    it("should render the div with class .dipas-cockpit-description with right content", () => {
        expect(wrapper.find(".dipas-cockpit-description").text()).to.equals("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.");
    });

    it("should render the div with class .dipas-cockpit-initiators with right content", () => {
        expect(wrapper.find(".dipas-cockpit-initiators").text()).to.contain("Behörde für Stadtentwicklung und Wohnen");
    });

    it("should render the div with class .dipas-cockpit-proceedingLink with right content", () => {
        expect(wrapper.find(".dipas-cockpit-proceedingLink").text()).to.equals("http://test1.localhost:8080/#");
    });

    it("should render the div with class .dipas-cockpit-proceedingNumbers with right content", () => {
        expect(wrapper.find(".dipas-cockpit-proceedingNumbers").text()).to.contain("25");
    });

    it("should render the div with class .dipas-cockpit-document with right content", () => {
        expect(wrapper.find(".dipas-cockpit-document").text()).to.contain("Download1");
    });

});
