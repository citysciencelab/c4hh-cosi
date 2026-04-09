import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import HrCard from "../../components/HrCard.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/shared/components/HrCard.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(HrCard, {});

            expect(wrapper.exists()).to.be.true;
        });

        it("should render a heading with the given title", () => {
            const wrapper = shallowMount(HrCard, {
                props: {
                    title: "Projektname"
                }
            });

            expect(wrapper.find("h5.card-title").text()).to.equal("Projektname");
        });

        it("should render the edit button", () => {
            const wrapper = shallowMount(HrCard, {}),
                iconButton = wrapper.findComponent({name: "IconButton"});

            expect(iconButton.exists()).to.be.true;
        });

        it("should emit click:edit when edit interaction is called", () => {
            const wrapper = shallowMount(HrCard, {}),
                iconButton = wrapper.findComponent({name: "IconButton"});

            iconButton.props("interaction")();

            expect(wrapper.emitted("click:edit")).to.have.lengthOf(1);
        });
    });
});
