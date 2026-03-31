import {createStore} from "vuex";
import {shallowMount, config} from "@vue/test-utils";
import {expect} from "chai";
import DipasTheme from "../../../components/DipasTheme.vue";

config.global.mocks.$t = key => key;

describe("addons/dipas/components/DipasTheme.vue", () => {
    const iconPath = "https://geoportal-hamburg.de/lgv-beteiligung/icons/einzelmarker_dunkel.png",
        theme = {
            "name": "dipas",
            "params": {
                "gfiIconPath": iconPath
            }
        },
        getters = {
            uiStyle: () => "DEFAULT",
            layerUrlParams: () => [{"id": "2431", "visibility": true}, {"id": "8712", "visibility": false}]
        },
        gettersTable = {
            uiStyle: () => "TABLE",
            layerUrlParams: () => [{"id": "2431", "visibility": true}, {"id": "8712", "visibility": false}]
        },
        testLocation = "https://localhost:9001/portalconfigs/dipas/#/projektinfo",
        jsdom = new URL(testLocation),
        originalLocation = global.location;

    let wrapper,
        valueStyle = [],
        store;

    beforeAll(() => {
        global.location = {
            origin: jsdom.origin,
            pathname: jsdom.pathname,
            search: jsdom.search
        };
    });

    afterAll(() => {
        global.location = originalLocation;
    });

    /**
     * Creates the wrapper
     * @param {boolean} isTable true, if it is table UI
     * @returns {void}
     */
    function createWrapper (isTable) {
        store = createStore({
            modules: {
                DipasTheme,
                Maps: {
                    namespaced: true,
                    getters: {
                        urlParams: () => "MAPS={'center':[565874,5934140], 'zoom':4}"
                    }
                }
            },
            getters: isTable ? gettersTable : getters
        });
        wrapper = shallowMount(DipasTheme, {
            global: {
                plugins: [store]
            },
            props: {
                feature: {
                    getTheme: () => theme,
                    getTitle: () => "Dipas Title",
                    getMimeType: () => "text/xml",
                    getMappedProperties () {
                        return {
                            Kategorie: "Value Kategorie",
                            link: "/drupal/de/node/5",
                            name: "Value name",
                            description: "Value description",
                            nid: "5"
                        };
                    }
                }
            }
        });
    }

    describe("template", () => {
        it("uiStyle table, should place the values", () => {
            createWrapper(true);
            wrapper.vm.$nextTick();
            expect(wrapper.findAll(".dipas-gfi-thema")[0].element.textContent.trim()).to.equal("Value Kategorie");
            expect(wrapper.findAll(".dipas-gfi-name")[0].element.textContent.trim()).to.equal("Value name");
            expect(wrapper.findAll(".dipas-gfi-description")[0].element.textContent.trim()).to.equal("Value description");
            expect(wrapper.findAll("a").length).to.equal(0);
        });
        it("uiStyle NOT table, should place the values", () => {
            createWrapper(false);
            expect(wrapper.findAll(".dipas-gfi-thema")[0].element.textContent.trim()).to.equal("Value Kategorie");
            expect(wrapper.findAll(".dipas-gfi-name")[0].element.textContent.trim()).to.equal("Value name");
            expect(wrapper.findAll(".dipas-gfi-description")[0].element.textContent.trim()).to.equal("Value description");
            expect(wrapper.findAll("a").length).to.equal(2);
        });
    });

    describe("method: fetchIconPath -> the iconPath should show the right name with path", function () {
        it("should show the default name with path", function () {
            createWrapper(true);
            valueStyle = [];

            const ret = wrapper.vm.fetchIconPath(valueStyle);

            expect(ret).to.equal(iconPath);
        });

        it("should show the parsed name with path", function () {
            createWrapper(true);
            valueStyle = [{
                "conditions": {
                    "properties": {
                        "Thema": "Wohnen"
                    }
                },
                "style": {
                    "imageName": "https://geoportal-hamburg.de/lgv-beteiligung/icons/40px-wohnen.png"
                }
            }];
            const icon = "https://geoportal-hamburg.de/lgv-beteiligung/icons/40px-wohnen.png",

                ret = wrapper.vm.fetchIconPath(valueStyle);

            expect(ret).to.equal(icon);
        });
    });

    describe("method: calculateIconPath -> the iconPath should show the right name with path", function () {
        it("should show the default name with path", function () {
            createWrapper(true, false);
            valueStyle = [];

            const ret = wrapper.vm.calculateIconPath(valueStyle);

            expect(ret).to.equal(iconPath);
        });

        it("should show the parsed name with path", function () {
            const icon = "https://geoportal-hamburg.de/lgv-beteiligung/icons/40px-wohnen.png";

            createWrapper(true, false);
            valueStyle = [{
                "conditions": {
                    "properties": {
                        "Thema": "Wohnen"
                    }
                },
                "style": {
                    "styleFieldValue": "Wohnen",
                    "color": "#E20613",
                    "imageName": icon,
                    "imageScale": "0.5"
                }
            }];

            expect(wrapper.vm.calculateIconPath(valueStyle)).to.equal(iconPath);
        });
    });

    describe("method: modifyContributionLink -> the contribution link should show the right path", function () {
        it("should show path of property 'link' when table = true", function () {
            createWrapper(true);

            const ret = wrapper.vm.modifyContributionLink(wrapper.vm.feature.getMappedProperties().link, wrapper.vm.feature.getMappedProperties().nid);

            expect(ret).to.equal("/drupal/de/node/5");
        });

        it("should show path to dipas frontend contribution when table = false", function () {
            Object.defineProperty(document, "referrer", {value: "https://localhost:9001/portalconfigs/dipas/#/projektinfo", configurable: true});

            createWrapper(false);

            const path = "https://localhost:9001/portalconfigs/dipas/#/contribution/5?MAP/LAYERIDS=2431,8712&VISIBILITY=true,false&MAPS={'center':[565874,5934140], 'zoom':4}",

                ret = wrapper.vm.modifyContributionLink(wrapper.vm.feature.getMappedProperties().link, wrapper.vm.feature.getMappedProperties().nid);

            expect(ret).to.equal(path);
        });

        it("should show path to dipas frontend contribution when table = false and filter = visible", function () {
            Object.defineProperty(document, "referrer", {value: "https://localhost:9001/portalconfigs/dipas/#/projektinfo?filter=open&test=true", configurable: true});

            createWrapper(false);

            const path = "https://localhost:9001/portalconfigs/dipas/#/contribution/5?MAP/LAYERIDS=2431,8712&VISIBILITY=true,false&MAPS={'center':[565874,5934140], 'zoom':4}",
                ret = wrapper.vm.modifyContributionLink(wrapper.vm.feature.getMappedProperties().link, wrapper.vm.feature.getMappedProperties().nid);

            expect(ret).to.equal(path);
        });
    });
});
