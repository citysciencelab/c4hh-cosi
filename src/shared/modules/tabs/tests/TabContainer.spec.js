import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import TabContainer, {TAB_SET_CURRENT} from "@shared/modules/tabs/components/TabContainer.vue";

config.global.mocks.$t = key => key;

describe("src/shared/modules/tabs/components/TabContainer.vue", () => {
    let wrapper;

    const MockTabA = {
            name: "MockTabA",
            template: "<div class='mock-tab-a'>Tab A Content</div>"
        },
        MockTabB = {
            name: "MockTabB",
            template: "<div class='mock-tab-b'>Tab B Content</div>"
        },
        MockTabC = {
            name: "MockTabC",
            template: "<div class='mock-tab-c'>Tab C Content</div>"
        },
        tabsAsProp = [
            {
                id: "tabA",
                contentId: "tabAContent",
                ref: "tabARef",
                label: "Tab A",
                component: MockTabA,
                propsForTabContent: {},
                renderComponent: true
            },
            {
                id: "tabB",
                contentId: "tabBContent",
                ref: "tabBRef",
                label: "Tab B",
                component: MockTabB,
                propsForTabContent: {},
                renderComponent: true
            },
            {
                id: "tabC",
                contentId: "tabCContent",
                ref: "tabCRef",
                label: "Tab C",
                component: MockTabC,
                propsForTabContent: {},
                renderComponent: true
            }
        ];

    /**
     *
     */
    function createWrapper (props = {}) {
        return shallowMount(TabContainer, {
            props: {
                tabs: tabsAsProp,
                ...props
            }
        });
    }

    it("should exist", () => {
        wrapper = createWrapper();

        expect(wrapper.exists()).to.be.true;
    });

    describe("DOM", () => {
        it("should render a nav tab for each tab", () => {
            wrapper = createWrapper();

            expect(wrapper.findAll("nav-tab-stub").length).to.equal(tabsAsProp.length);
        });

        it("should render a tab content pane for each tab", () => {
            wrapper = createWrapper();

            tabsAsProp.forEach(tab => {
                expect(wrapper.find(`#${tab.contentId}`).exists()).to.be.true;
            });
        });

        it("should render a nav tab with the correct id for each tab", () => {
            wrapper = createWrapper();

            tabsAsProp.forEach(tab => {
                expect(wrapper.find(`nav-tab-stub[id="${tab.id}"]`).exists()).to.be.true;
            });
        });

        it("should mark the first tab pane as active when no initialActiveTabId is given", () => {
            wrapper = createWrapper();

            expect(wrapper.find("#tabAContent").classes()).to.include("show").and.include("active");
            expect(wrapper.find("#tabBContent").classes()).to.not.include("active");
        });

        it("should mark the given initialActiveTabId tab pane as active", () => {
            wrapper = createWrapper({initialActiveTabId: "tabB"});

            expect(wrapper.find("#tabBContent").classes()).to.include("show").and.include("active");
            expect(wrapper.find("#tabAContent").classes()).to.not.include("active");
        });

        it("should not render the component when renderComponent is false", () => {
            const tabs = [
                {
                    id: "tabA",
                    contentId: "tabAContent",
                    ref: "tabARef",
                    label: "Tab A",
                    component: MockTabA,
                    propsForTabContent: {},
                    renderComponent: false
                }
            ];

            wrapper = createWrapper({tabs});

            expect(wrapper.findComponent(MockTabA).exists()).to.be.false;
        });
    });

    describe("methods", () => {
        describe("setCurrentTab", () => {
            it("should update activeTabIdLocal to the given tabId", () => {
                wrapper = createWrapper();

                wrapper.vm.setCurrentTab("tabB");

                expect(wrapper.vm.activeTabIdLocal).to.equal("tabB");
            });

            it("should update the active class on the tab panes accordingly", async () => {
                wrapper = createWrapper();

                wrapper.vm.setCurrentTab("tabC");
                await wrapper.vm.$nextTick();

                expect(wrapper.find("#tabCContent").classes()).to.include("show").and.include("active");
                expect(wrapper.find("#tabAContent").classes()).to.not.include("active");
            });
        });
    });

    describe("provide", () => {
        it("should provide setCurrentTab via TAB_SET_CURRENT symbol", () => {
            wrapper = createWrapper();

            const provided = wrapper.vm.$.provides[TAB_SET_CURRENT];

            expect(provided).to.be.a("function");
        });

        it("provided setCurrentTab should update activeTabIdLocal", () => {
            wrapper = createWrapper();

            const provided = wrapper.vm.$.provides[TAB_SET_CURRENT];

            provided("tabB");

            expect(wrapper.vm.activeTabIdLocal).to.equal("tabB");
        });
    });

    describe("user interaction", () => {
        it("should update activeTabIdLocal when a nav tab is clicked", async () => {
            wrapper = createWrapper();

            const tabBNav = wrapper.find("nav-tab-stub[id='tabB']");

            await tabBNav.trigger("click");

            expect(wrapper.vm.activeTabIdLocal).to.equal("tabB");
        });

        it("should switch active pane when tabs are clicked sequentially", async () => {
            wrapper = createWrapper();

            const tabBNav = wrapper.find("nav-tab-stub[id='tabB']"),
                tabCNav = wrapper.find("nav-tab-stub[id='tabC']"),
                tabANav = wrapper.find("nav-tab-stub[id='tabA']");

            await tabBNav.trigger("click");
            expect(wrapper.vm.activeTabIdLocal).to.equal("tabB");

            await tabCNav.trigger("click");
            expect(wrapper.vm.activeTabIdLocal).to.equal("tabC");

            await tabANav.trigger("click");
            expect(wrapper.vm.activeTabIdLocal).to.equal("tabA");
        });
    });
});
