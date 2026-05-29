import {createStore} from "vuex";
import {shallowMount, config} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import DipasNavigatorTheme from "../../../components/DipasNavigatorTheme.vue";

config.global.mocks.$t = key => key;

describe("addons/dipasNavigator/components/DipaNavigatorTheme.vue", () => {
    let wrapper,
        store,
        setCenterSpy,
        createWrapper;

    const featureStub = {
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
            },
            getProperties: function () {
                return {
                    "geometry": {
                        "getCoordinates": function () {
                            return [0, 0];
                        }
                    }
                };
            }
        },
        mapStub = {
            getPixelFromCoordinate: () => (coord) => {
                return coord;
            },
            getCoordinateFromPixel: () => (pix) => {
                return pix;
            }
        };


    beforeEach(() => {
        // Stub mapCollection.getMap to return our fake map
        sinon.stub(mapCollection, "getMap").returns(mapStub);

        /**
         * Creates the wrapper
         * @param {boolean} isMobile true, if it is mobile device
         * @returns {void}
         */
        createWrapper = function (isMobile) {
            setCenterSpy = sinon.spy();

            store = createStore({
                modules: {
                    DipasNavigatorTheme,
                    Menu: {
                        namespaced: true,
                        getters: {
                            expanded: () => (side) => {
                                return side === "unbekannt";
                            }
                        }
                    },
                    Maps: {
                        namespaced: true,
                        actions: {
                            setCenter: setCenterSpy
                        }
                    }
                },
                getters: {
                    isMobile: () => isMobile
                }
            });

            wrapper = shallowMount(DipasNavigatorTheme, {
                global: {
                    plugins: [store]
                },
                props: {
                    feature: featureStub
                }
            });
        };
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }

        sinon.resetHistory();
    });

    it("should render 13 individual html elements", async () => {
        createWrapper(false);
        expect(wrapper.find(".dipas-navigator-theme").exists()).to.be.true;
        expect(wrapper.find(".dipas-navigator-proceeding-status").exists()).to.be.true;
        expect(wrapper.find(".dipas-navigator-location-icon").exists()).to.be.true;
        expect(wrapper.find(".dipas-navigator-title").exists()).to.be.true;
        expect(wrapper.find(".dipas-navigator-themes").exists()).to.be.true;
        expect(wrapper.find(".dipas-navigator-themes-key").exists()).to.be.true;
        expect(wrapper.find(".dipas-navigator-description").exists()).to.be.true;
        expect(wrapper.find(".dipas-navigator-initiators").exists()).to.be.true;
        expect(wrapper.find(".dipas-navigator-proceedingLink").exists()).to.be.true;
        expect(wrapper.find(".dipas-navigator-proceedingNumbers").exists()).to.be.true;
        expect(wrapper.find(".dipas-navigator-documentation").exists()).to.be.true;
        expect(wrapper.find(".dipas-navigator-document").exists()).to.be.true;
        expect(wrapper.find(".dipas-navigator-document-icon").exists()).to.be.true;
    });

    it("should render .dipas-navigator-document twice", async () => {
        createWrapper(false);
        expect(wrapper.findAll(".dipas-navigator-document").length).to.equal(2);
    });

    it("should render the div with class .dipas-navigator-proceeding-status with content aktiv", async () => {
        createWrapper(false);
        expect(wrapper.find(".dipas-navigator-proceeding-status").text()).to.equals("aktiv");
    });


    it("should render the div with class .dipas-navigator-themes with content Kategorie 1, Kategorie 2, Kategorie 3", async () => {
        createWrapper(false);
        expect(wrapper.find(".dipas-navigator-themes").text()).to.contain("Kategorie 1, Kategorie 2, Kategorie 3");
    });

    it("should render the div with class .dipas-navigator-description with right content", async () => {
        createWrapper(false);
        expect(wrapper.find(".dipas-navigator-description").text()).to.equals("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.");
    });

    it("should render the div with class .dipas-navigator-initiators with right content", async () => {
        createWrapper(false);
        expect(wrapper.find(".dipas-navigator-initiators").text()).to.contain("Behörde für Stadtentwicklung und Wohnen");
    });

    it("should render the div with class .dipas-navigator-proceedingLink with right content", async () => {
        createWrapper(false);
        expect(wrapper.find(".dipas-navigator-proceedingLink").text()).to.equals("http://test1.localhost:8080/#");
    });

    it("should render the div with class .dipas-navigator-proceedingNumbers with right content", async () => {
        createWrapper(false);
        expect(wrapper.find(".dipas-navigator-proceedingNumbers").text()).to.contain("25");
    });

    it("should render the div with class .dipas-navigator-document with right content", async () => {
        createWrapper(false);
        expect(wrapper.find(".dipas-navigator-document").text()).to.contain("Download1");
    });

    it("should not center visible map on mobile mode", async () => {
        createWrapper(true);
        wrapper.vm.centerVisibleMap(featureStub);
        // use calledTwice here because it is called once already in mounted hook and the second time in centerVisibleMap function
        expect(setCenterSpy.calledTwice).to.be.false;
    });

    it("should center visible map on desktop mode", async () => {
        createWrapper(false);
        wrapper.vm.centerVisibleMap(featureStub);
        // use calledTwice here because it is called once already in mounted hook and the second time in centerVisibleMap function
        expect(setCenterSpy.calledTwice).to.be.true;
    });

    it("should not center visible map on mobile mode without valid feature", async () => {
        createWrapper(true);
        wrapper.vm.centerVisibleMap(null);
        // use calledTwice here because it is called once already in mounted hook and the second time in centerVisibleMap function
        expect(setCenterSpy.calledTwice).to.be.false;
    });

    it("should not center visible map on desktop mode without valid feature", async () => {
        createWrapper(false);
        wrapper.vm.centerVisibleMap(null);
        // use calledTwice here because it is called once already in mounted hook and the second time in centerVisibleMap function
        expect(setCenterSpy.calledTwice).to.be.false;
    });

});
