import {config, mount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import ToggleMouseHover from "../../../components/ToggleMouseHover.vue";

config.global.mocks.$t = key => key;

describe("addons/controls/toggleMouseHover/components/ToggleMouseHover.vue", () => {
    const spySetMouseHover = sinon.spy();

    let store,
        gettterMouseHover;

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Controls: {
                    namespaced: true,
                    modules: {
                        ToggleMouseHover: {
                            namespaced: true,
                            getters: {
                                icon: () => "bi-mouse2",
                                iconFill: () => "bi-mouse2-fill"
                            }
                        }
                    }
                }
            },
            getters: {
                mouseHover: () => gettterMouseHover
            },
            mutations: {
                setMouseHover: spySetMouseHover
            }
        });
    });


    it("should render the button with mouse2 icon", async () => {
        gettterMouseHover = {};
        const wrapper = mount(ToggleMouseHover, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#toggle-mousehover-button > button > i").attributes("class")).to.equal("bi-mouse2");
    });

    it("should renders the button with mouse2-fill icon", () => {
        gettterMouseHover = {numFeaturesToShow: 2};
        const wrapper = mount(ToggleMouseHover, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#toggle-mousehover-button > button").exists()).to.be.true;
        expect(wrapper.find("#toggle-mousehover-button > button > i").attributes("class")).to.equal("bi-mouse2-fill");
    });

    it("should call setMouseHover with false when clicking while mouseHover is active", async () => {
        const wrapper = mount(ToggleMouseHover, {
            global: {
                plugins: [store]
            }});

        await wrapper.find("#toggle-mousehover-button > button").trigger("click");
        expect(spySetMouseHover.called).to.be.true;
        expect(spySetMouseHover.lastCall.args[1]).to.equal(false);
    });
});
