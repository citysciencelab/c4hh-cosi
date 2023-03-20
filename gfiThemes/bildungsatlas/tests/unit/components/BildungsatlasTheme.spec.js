import Vuex from "vuex";
import {shallowMount, createLocalVue, config} from "@vue/test-utils";
import {expect} from "chai";
import BildungsatlasTheme from "../../../components/BildungsatlasTheme.vue";

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

describe("addons/bildungsatlas/components/BildungsatlasTheme.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(BildungsatlasTheme, {
            propsData: {
                feature: {
                    getProperties () {
                        return {};
                    },
                    getTitle () {
                        return "title";
                    },
                    getTheme () {
                        return {
                            params: {
                                subTheme: "",
                                featureType: "someFeatureType"
                            }
                        };
                    }
                }
            },
            localVue
        });
    });
    describe("created", () => {
        it("should set the internal value of subTheme to the value found in the feature", () => {
            expect(wrapper.vm.subTheme).to.equal("");
            expect(wrapper.vm.featureType).to.equal("someFeatureType");
        });
    });
    describe("setActiveTab", () => {
        it("should set the internal value for activeTab", () => {
            wrapper.vm.activeTab = "nothing";
            wrapper.vm.setActiveTab("activeTab");
            expect(wrapper.vm.activeTab).to.equal("activeTab");
        });
    });
    describe("isActiveTab", () => {
        it("should check the internal value of activeTab", () => {
            wrapper.vm.setActiveTab("activeTab");

            expect(wrapper.vm.isActiveTab("activeTab")).to.be.true;
            expect(wrapper.vm.isActiveTab("something else")).to.be.false;
        });
    });
    describe("nav-pills", () => {
        it("should initialize with a nav pill for data", () => {
            const dataTab = wrapper.find(".nav-pills").findAll("li").at(0).find("a");

            expect(dataTab.text()).to.equal("additional:addons.gfiThemes.bildungsatlas.general.tabData");
        });
        it("should initialize with a nav pill for info", () => {
            const dataTab = wrapper.find(".nav-pills").findAll("li").at(1).find("a");

            expect(dataTab.text()).to.equal("additional:addons.gfiThemes.bildungsatlas.general.tabInfo");
        });
        it("should initialize active tab with value 'data'", () => {
            expect(wrapper.vm.activeTab).to.equal("data");
        });
        it("should switch the active tab if the info nav button is clicked", async () => {
            const infoTab = wrapper.find(".nav-pills").findAll("li").at(1).find("a");

            await infoTab.trigger("click");
            expect(wrapper.vm.activeTab).to.equal("info");
        });
        it("should switch back to 'data' if the data nav button is clicked", async () => {
            const infoTab = wrapper.find(".nav-pills").findAll("li").at(0).find("a");

            wrapper.vm.activeTab = "something";
            await infoTab.trigger("click");
            expect(wrapper.vm.activeTab).to.equal("data");
        });
    });
    describe("components", () => {
        it("should find the child component BildungsatlasThemeThemeBalkendiagramm", () => {
            const singleTestWrapper = shallowMount(BildungsatlasTheme, {
                propsData: {
                    feature: {
                        getProperties () {
                            return {};
                        },
                        getTheme () {
                            return {
                                params: {
                                    subTheme: "BildungsatlasThemeBalkendiagramm",
                                    featureType: "someFeatureType"
                                }
                            };
                        }
                    }
                },
                localVue
            });

            expect(singleTestWrapper.findComponent({name: "BildungsatlasThemeBalkendiagramm"}).exists()).to.be.true;
        });
        it("should find the child component BildungsatlasThemeSchulentlassene", () => {
            const singleTestWrapper = shallowMount(BildungsatlasTheme, {
                propsData: {
                    feature: {
                        getProperties () {
                            return {};
                        },
                        getTheme () {
                            return {
                                params: {
                                    subTheme: "BildungsatlasThemeSchulentlassene",
                                    featureType: "someFeatureType"
                                }
                            };
                        }
                    }
                },
                localVue
            });

            expect(singleTestWrapper.findComponent({name: "BildungsatlasThemeSchulentlassene"}).exists()).to.be.true;
        });
        it("should find the child component BildungsatlasThemeOKJA", () => {
            const singleTestWrapper = shallowMount(BildungsatlasTheme, {
                propsData: {
                    feature: {
                        getProperties () {
                            return {};
                        },
                        getTheme () {
                            return {
                                params: {
                                    subTheme: "BildungsatlasThemeOKJA",
                                    featureType: "someFeatureType"
                                }
                            };
                        }
                    }
                },
                localVue
            });

            expect(singleTestWrapper.findComponent({name: "BildungsatlasThemeOKJA"}).exists()).to.be.true;
        });
        it("should find the child component BildungsatlasThemeFluechtlinge", () => {
            const singleTestWrapper = shallowMount(BildungsatlasTheme, {
                propsData: {
                    feature: {
                        getProperties () {
                            return {};
                        },
                        getTheme () {
                            return {
                                params: {
                                    subTheme: "BildungsatlasThemeFluechtlinge",
                                    featureType: "someFeatureType"
                                }
                            };
                        }
                    }
                },
                localVue
            });

            expect(singleTestWrapper.findComponent({name: "BildungsatlasThemeFluechtlinge"}).exists()).to.be.true;
        });
        it("should find the child component BildungsatlasThemeBalkendiagrammWanderungen", () => {
            const singleTestWrapper = shallowMount(BildungsatlasTheme, {
                propsData: {
                    feature: {
                        getProperties () {
                            return {};
                        },
                        getTheme () {
                            return {
                                params: {
                                    subTheme: "BildungsatlasThemeBalkendiagrammWanderungen",
                                    featureType: "someFeatureType"
                                }
                            };
                        }
                    }
                },
                localVue
            });

            expect(singleTestWrapper.findComponent({name: "BildungsatlasThemeBalkendiagrammWanderungen"}).exists()).to.be.true;
        });
        it("should find the child component BildungsatlasThemeSchulenWohnort", () => {
            const singleTestWrapper = shallowMount(BildungsatlasTheme, {
                propsData: {
                    feature: {
                        getProperties () {
                            return {};
                        },
                        getTheme () {
                            return {
                                params: {
                                    subTheme: "BildungsatlasThemeSchulenWohnort",
                                    featureType: "someFeatureType"
                                }
                            };
                        }
                    }
                },
                localVue
            });

            expect(singleTestWrapper.findComponent({name: "BildungsatlasThemeSchulenWohnort"}).exists()).to.be.true;
        });
        it("should find the child component BildungsatlasThemeSchulenEinzugsgebiete", () => {
            const singleTestWrapper = shallowMount(BildungsatlasTheme, {
                propsData: {
                    feature: {
                        getProperties () {
                            return {};
                        },
                        getTheme () {
                            return {
                                params: {
                                    subTheme: "BildungsatlasThemeSchulenEinzugsgebiete",
                                    featureType: "someFeatureType"
                                }
                            };
                        }
                    }
                },
                localVue
            });

            expect(singleTestWrapper.findComponent({name: "BildungsatlasThemeSchulenEinzugsgebiete"}).exists()).to.be.true;
        });
    });
});
