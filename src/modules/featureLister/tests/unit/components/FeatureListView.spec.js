import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import FeatureListView from "@modules/featureLister/components/FeatureListView.vue";
import sinon from "sinon";
import {expect} from "chai";

/**
 * Creates a mock feature object with properties and attributesToShow.
 * @param {Object} props - The properties of the feature.
 * @param {string|Object} attrsToShow - The attributes to show, can be "showAll" or an object with specific attributes.
 * @param {string} id - The ID of the feature.
 */
function createFeatureMock (props, attrsToShow = "showAll", id = "f1") {
    return {
        getProperties: () => props,
        getAttributesToShow: () => attrsToShow,
        id
    };
}

describe("src/modules/featureLister/components/FeatureListView.vue", () => {
    let store, getters, actions, mocks;

    beforeEach(() => {
        getters = {
            maxFeatures: () => 2,
            featureCount: () => 3,
            shownFeatures: () => 2,
            headers: () => [{text: "Name", value: "name"}, {text: "Value", value: "value"}],
            gfiFeaturesOfLayer: () => [
                createFeatureMock({name: "A", value: 1, OBJECTID: "x"}, "showAll", "f1"),
                createFeatureMock({name: "B", value: 2, OBJECTID: "y"}, {name: "Name", value: "Value"}, "f2"),
                createFeatureMock({name: "C", value: 3}, "showAll", "f3")
            ]
        };
        actions = {
            clickOnFeature: sinon.stub(),
            hoverOverFeature: sinon.stub(),
            showMore: sinon.stub()
        };
        store = createStore({
            getters: {
                ignoredKeys: () => ["OBJECTID"]
            },
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        FeatureLister: {
                            namespaced: true,
                            getters,
                            actions
                        }
                    }
                }
            }
        });
        mocks = {
            $t: msg => msg
        };
    });

    it("renders the TableComponent with correct data", () => {
        const wrapper = shallowMount(FeatureListView, {global: {plugins: [store], mocks}}),
            table = wrapper.findComponent({name: "TableComponent"});

        expect(table.exists()).to.be.true;
        expect(table.props("data").headers).to.deep.equal(getters.headers());
        expect(table.props("data").items.length).to.equal(getters.shownFeatures());
    });

    it("filters out ignoredKeys in featureProperties", () => {
        const wrapper = shallowMount(FeatureListView, {global: {plugins: [store], mocks}}),
            items = wrapper.vm.featureProperties;

        expect(items[0]).to.not.have.property("OBJECTID");
    });

    it("maps attributesToShow if not 'showAll'", () => {
        const wrapper = shallowMount(FeatureListView, {global: {plugins: [store], mocks}}),
            items = wrapper.vm.featureProperties;

        expect(items[1]).to.have.property("Name", "B");
        expect(items[1]).to.have.property("Value", 2);
    });

    it("calls clickOnFeature when a row is selected", async () => {
        const wrapper = shallowMount(FeatureListView, {global: {plugins: [store], mocks}}),
            row = {id: "f1"};

        await wrapper.findComponent({name: "TableComponent"}).vm.$emit("rowSelected", row);
        expect(actions.clickOnFeature.called).to.be.true;
    });

    it("calls hoverOverFeature when a row is hovered", async () => {
        const wrapper = shallowMount(FeatureListView, {global: {plugins: [store], mocks}}),
            row = {id: "f1"};

        await wrapper.findComponent({name: "TableComponent"}).vm.$emit("rowOnHover", row);
        expect(actions.hoverOverFeature.called).to.be.true;
    });

    it("calls showMore when FlatButton is clicked", async () => {
        const wrapper = shallowMount(FeatureListView, {global: {plugins: [store], mocks}}),
            flatButton = wrapper.findComponent({name: "FlatButton"});

        flatButton.vm.interaction();

        expect(actions.showMore.called).to.be.true;
    });

    it("disables FlatButton if all features are shown", () => {
        getters.featureCount = () => 2;
        getters.shownFeatures = () => 2;
        const storeAllShown = createStore({
                getters: {
                    ignoredKeys: () => ["OBJECTID"]
                },
                modules: {
                    Modules: {
                        namespaced: true,
                        modules: {
                            FeatureLister: {
                                namespaced: true,
                                getters,
                                actions
                            }
                        }
                    }
                }
            }),
            wrapper = shallowMount(FeatureListView, {global: {plugins: [storeAllShown], mocks}});

        expect(wrapper.findComponent({name: "FlatButton"}).props("disabled")).to.be.true;
    });
});
