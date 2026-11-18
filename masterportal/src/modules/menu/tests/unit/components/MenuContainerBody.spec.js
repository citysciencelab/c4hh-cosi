import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import MenuContainerBody from "@modules/menu/components/MenuContainerBody.vue";
import {expect} from "chai";
import MenuNavigation from "@modules/menu/components/MenuNavigation.vue";
import MenuContainerBodyRoot from "@modules/menu/components/MenuContainerBodyRoot.vue";
import sinon from "sinon";
import {defineAsyncComponent} from "vue";


describe("src/modules/menu/MenuContainerBody.vue", () => {
    let store,
        menu,
        menuType,
        wrapper;

    beforeEach(() => {
        menuType = "type";
        menu = {
            navigation: {
                currentComponent: {
                    type: menuType
                }
            }

        };
        store = createStore({
            modules: {
                Menu: {
                    namespaced: true,
                    getters: {
                        defaultComponent: sinon.stub(),
                        mainMenu: () => menu,
                        secondaryMenu: () => menu,
                        mainExpanded: () => sinon.stub,
                        secondaryExpanded: () => sinon.stub

                    },
                    mutations: {
                        addTestMenuSection: (state, section) => {
                            state.menuSections.push(section);
                        },
                        addModuleToMenuSection: sinon.stub()
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        GetFeatureInfo: {
                            namespaced: true,
                            getters: {
                                menuSide: () => "secondaryMenu"
                            }
                        }
                    },
                    getters: {
                        componentMap: () => {
                            return {
                                type: menuType
                            };
                        }
                    }
                }
            }
        });
    });

    afterEach(() => {
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
    });

    it("renders the component in mainMenu and it contains the MenuNavigation and not GetFeatureInfo", () => {
        wrapper = shallowMount(MenuContainerBody, {
            global: {
                plugins: [store]
            },
            propsData: {side: "mainMenu"}
        });
        const bodyWrapper = wrapper.find("#mp-body-mainMenu");

        expect(bodyWrapper.exists()).to.be.true;
        expect(bodyWrapper.findComponent(MenuNavigation).exists()).to.be.true;
        expect(bodyWrapper.findComponent(MenuContainerBodyRoot).exists()).to.be.true;
        expect(bodyWrapper.find("get-feature-info-stub").exists()).to.be.false;
    });

    it("renders the component in secondaryMenu and it contains the MenuNavigation and not displayed GetFeatureInfo", () => {
        wrapper = shallowMount(MenuContainerBody, {
            global: {
                plugins: [store]
            },
            propsData: {side: "secondaryMenu"}
        });
        const bodyWrapper = wrapper.find("#mp-body-secondaryMenu");

        expect(bodyWrapper.exists()).to.be.true;
        expect(bodyWrapper.findComponent(MenuNavigation).exists()).to.be.true;
        expect(bodyWrapper.findComponent(MenuContainerBodyRoot).exists()).to.be.true;
        expect(bodyWrapper.find("get-feature-info-stub").exists()).to.be.true;
        expect(bodyWrapper.find("get-feature-info-stub").attributes("style")).to.be.equals("display: none;");
        expect(bodyWrapper.find("menu-container-body-root-stub").attributes("style")).to.be.equals("display: none;");

    });

    it("renders the component in mainMenu, currentComponent is root", () => {
        menuType = "root";
        wrapper = shallowMount(MenuContainerBody, {
            global: {
                plugins: [store]
            },
            propsData: {side: "mainMenu"}
        });
        const bodyWrapper = wrapper.find("#mp-body-mainMenu");

        expect(bodyWrapper.exists()).to.be.true;
        expect(bodyWrapper.findComponent(MenuNavigation).exists()).to.be.true;
        expect(bodyWrapper.find("menu-container-body-root-stub").exists()).to.be.true;
        expect(bodyWrapper.find("menu-container-body-root-stub").attributes("side")).to.be.equals("mainMenu");
        expect(bodyWrapper.find("menu-container-body-root-stub").attributes("style")).to.be.undefined;
    });

    it("renders the component in mainMenu, currentComponent is not root or getFeatureInfo", () => {
        menuType = "component";
        wrapper = shallowMount(MenuContainerBody, {
            global: {
                plugins: [store],
                stubs: {"keep-alive": false}
            },
            propsData: {side: "mainMenu"}
        });
        const bodyWrapper = wrapper.find("#mp-body-mainMenu");

        expect(bodyWrapper.exists()).to.be.true;
        expect(bodyWrapper.findComponent(MenuNavigation).exists()).to.be.true;
        expect(bodyWrapper.find("component").exists()).to.be.true;
    });

    it("renders the component in secondaryMenu, currentComponent is getFeatureInfo", () => {
        menuType = "getFeatureInfo";
        wrapper = shallowMount(MenuContainerBody, {
            global: {
                plugins: [store]
            },
            propsData: {side: "secondaryMenu"}
        });
        const bodyWrapper = wrapper.find("#mp-body-secondaryMenu");

        expect(bodyWrapper.exists()).to.be.true;
        expect(bodyWrapper.findComponent(MenuNavigation).exists()).to.be.true;
        expect(bodyWrapper.find("menu-container-body-root-stub").exists()).to.be.true;
        expect(bodyWrapper.find("menu-container-body-root-stub").attributes("side")).to.be.equals("secondaryMenu");
        expect(bodyWrapper.find("menu-container-body-root-stub").attributes("style")).to.be.equals("display: none;");
        expect(bodyWrapper.find("get-feature-info-stub").exists()).to.be.true;
        expect(bodyWrapper.find("get-feature-info-stub").attributes("style")).to.be.undefined;
    });

    it("computed property currentComponent", () => {
        menuType = "getFeatureInfo";
        wrapper = shallowMount(MenuContainerBody, {
            global: {
                plugins: [store]
            },
            propsData: {side: "mainMenu"}
        });
        const bodyWrapper = wrapper.find("#mp-body-mainMenu");

        expect(bodyWrapper.exists()).to.be.true;
        expect(wrapper.vm.currentComponent).to.be.equals("getFeatureInfo");
    });

    describe("hasKeepAliveHooks", () => {
        beforeEach(() => {
            wrapper = shallowMount(MenuContainerBody, {
                global: {
                    plugins: [store]
                }
            });
        });

        it("should return true, if activated and deactivated are implemented", () => {
            expect(wrapper.vm.hasKeepAliveHooks({activated: sinon.stub(), deactivated: sinon.stub()})).to.be.true;
        });

        it("should return false, if only one hook is implemented", () => {
            expect(wrapper.vm.hasKeepAliveHooks({activated: sinon.stub()})).to.be.false;
        });

        it("should return false for undefined, null, string and empty object", () => {
            [undefined, null, "", {}].forEach(component => {
                expect(wrapper.vm.hasKeepAliveHooks(component)).to.be.false;
            });
        });
    });

    describe("registerAsyncKeepAliveComponent", () => {
        beforeEach(() => {
            wrapper = shallowMount(MenuContainerBody, {
                global: {
                    plugins: [store]
                }
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it("should add the name of a loaded async component with keep-alive hooks to keepAliveComponents", async () => {
            const asyncComponent = defineAsyncComponent(() => Promise.resolve({
                name: "AsyncModule",
                activated: sinon.stub(),
                deactivated: sinon.stub(),
                render: () => null
            }));

            await wrapper.vm.registerAsyncKeepAliveComponent(asyncComponent);
            await wrapper.vm.registerAsyncKeepAliveComponent(asyncComponent);

            expect(wrapper.vm.asyncKeepAliveComponentNames).to.deep.equal(["AsyncModule"]);
            expect(wrapper.vm.keepAliveComponents).to.include("AsyncModule");
        });

        it("should not add the name of a loaded async component without keep-alive hooks", async () => {
            const asyncComponent = defineAsyncComponent(() => Promise.resolve({
                name: "AsyncModule",
                render: () => null
            }));

            await wrapper.vm.registerAsyncKeepAliveComponent(asyncComponent);

            expect(wrapper.vm.asyncKeepAliveComponentNames).to.be.empty;
        });

        it("should warn and not add a name, if the async component cannot be loaded", async () => {
            const warnStub = sinon.stub(console, "warn");

            await wrapper.vm.registerAsyncKeepAliveComponent({__asyncLoader: () => Promise.reject(new Error("load error"))});

            expect(warnStub.calledOnce).to.be.true;
            expect(wrapper.vm.asyncKeepAliveComponentNames).to.be.empty;
        });

        it("should ignore undefined, null, strings and non async components", async () => {
            for (const component of [undefined, null, "", "root", {}, {name: "SyncModule"}]) {
                await wrapper.vm.registerAsyncKeepAliveComponent(component);
            }

            expect(wrapper.vm.asyncKeepAliveComponentNames).to.be.empty;
        });
    });

});
