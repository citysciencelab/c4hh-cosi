import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import BaseCard from "@shared/modules/cards/components/BaseCard.vue";


describe("src/shared/modules/cards/components/BaseCard.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(BaseCard);

            expect(wrapper.exists()).to.be.true;
        });

        it("should have an active class", () => {
            const wrapper = shallowMount(BaseCard, {
                propsData: {
                    hoverable: true,
                    status: "active"
                }
            });

            expect(wrapper.find(".card").classes("card-active")).to.be.true;
        });

        it("should have a selected class", () => {
            const wrapper = shallowMount(BaseCard, {
                propsData: {
                    selected: true
                }
            });

            expect(wrapper.find(".card").classes("card-selected")).to.be.true;
        });

        it("should have an element i", () => {
            const wrapper = shallowMount(BaseCard, {
                propsData: {
                    icon: "i i-test"
                }
            });

            expect(wrapper.find("i").exists()).to.be.true;
        });

        it("should have a button", () => {
            const wrapper = shallowMount(BaseCard, {
                propsData: {
                    closeable: true
                }
            });

            expect(wrapper.find("button").exists()).to.be.true;
        });
    });
});
