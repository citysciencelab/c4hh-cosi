import {shallowMount, config} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import BildungsatlasTheme from "../../../components/BildungsatlasTheme.vue";

config.global.mocks.$t = key => key;

describe("addons/bildungsatlas/components/BildungsatlasTheme.vue", () => {
    let wrapper;

    beforeEach(() => {
        const error = sinon.spy();

        sinon.stub(console, "error").callsFake(error);
        wrapper = shallowMount(BildungsatlasTheme, {
            props: {
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
            }
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
    describe("components", () => {
        it("should find the child component BildungsatlasThemeThemeBalkendiagramm", () => {
            const singleTestWrapper = shallowMount(BildungsatlasTheme, {
                props: {
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
                }
            });

            expect(singleTestWrapper.findComponent({name: "BildungsatlasThemeBalkendiagramm"}).exists()).to.be.true;
        });
        it("should find the child component BildungsatlasThemeSchulentlassene", () => {
            const singleTestWrapper = shallowMount(BildungsatlasTheme, {
                props: {
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
                }
            });

            expect(singleTestWrapper.findComponent({name: "BildungsatlasThemeSchulentlassene"}).exists()).to.be.true;
        });
        it("should find the child component BildungsatlasThemeOKJA", () => {
            const singleTestWrapper = shallowMount(BildungsatlasTheme, {
                props: {
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
                }
            });

            expect(singleTestWrapper.findComponent({name: "BildungsatlasThemeOKJA"}).exists()).to.be.true;
        });
        it("should find the child component BildungsatlasThemeFluechtlinge", () => {
            const singleTestWrapper = shallowMount(BildungsatlasTheme, {
                props: {
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
                }
            });

            expect(singleTestWrapper.findComponent({name: "BildungsatlasThemeFluechtlinge"}).exists()).to.be.true;
        });
        it("should find the child component BildungsatlasThemeBalkendiagrammWanderungen", () => {
            const singleTestWrapper = shallowMount(BildungsatlasTheme, {
                props: {
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
                }
            });

            expect(singleTestWrapper.findComponent({name: "BildungsatlasThemeBalkendiagrammWanderungen"}).exists()).to.be.true;
        });
        it("should find the child component BildungsatlasThemeSchulenWohnort", () => {
            const singleTestWrapper = shallowMount(BildungsatlasTheme, {
                props: {
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
                }
            });

            expect(singleTestWrapper.findComponent({name: "BildungsatlasThemeSchulenWohnort"}).exists()).to.be.true;
        });
        it("should find the child component BildungsatlasThemeSchulenEinzugsgebiete", () => {
            const singleTestWrapper = shallowMount(BildungsatlasTheme, {
                props: {
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
                }
            });

            expect(singleTestWrapper.findComponent({name: "BildungsatlasThemeSchulenEinzugsgebiete"}).exists()).to.be.true;
        });
    });
});
