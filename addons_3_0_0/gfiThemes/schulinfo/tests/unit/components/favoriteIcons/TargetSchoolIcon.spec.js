import Vuex from "vuex";
import {config, mount, shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import TargetSchoolIconComponent from "../../../../components/favoriteIcons/TargetSchoolIcon.vue";

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("addons/gfiThemes/schulinfo/components/favoriteIcons/TargetSchoolIcon.vue", () => {
    const GrandParentVm = mount({
            name: "GrandParent",
            methods: {
                close: () => sinon.stub()
            },
            template: "<div/>"
        }).vm,

        Parent = {
            name: "Parent",
            created () {
                this.$parent = GrandParentVm;
            },
            template: "<span />"
        };
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(TargetSchoolIconComponent, {
            propsData: {
                feature: {
                    getId: () => "feature1",
                    getProperties: () => {
                        return {
                            schul_id: "Pikachu"
                        };
                    }
                }
            },
            methods: {
                componentExists: () => true
            },
            localVue,
            mocks: {
                $t: (msg) => msg
            },
            parentComponent: Parent,
            store: new Vuex.Store({
                namespaced: true,
                modules: {
                    Tools: {
                        namespaced: true,
                        actions: {
                            setToolActive: () => sinon.stub()
                        },
                        modules: {
                            SchoolRoutePlanning: {
                                namespaced: true,
                                actions: {
                                    selectInitializeSchoolNumber: () => sinon.stub()
                                }
                            }
                        }
                    }
                }
            })
        });
    });

    it("renders the TargetSchoolIcon", () => {
        const span = wrapper.find("span"),
            i = wrapper.find("i");

        expect(span.exists()).to.be.true;
        expect(span.classes()).to.include("bootstrap-icon");
        expect(i.exists()).to.be.true;
        expect(i.classes()).to.include("bi-geo-alt-fill");
    });
});
