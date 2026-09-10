import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import CookieBanner from "../../components/CookieBanner.vue";


describe("addons/shared/components/InfoCard.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(CookieBanner);

            expect(wrapper.exists()).to.be.true;
        });

        it("should render FlatButton", () => {
            const wrapper = shallowMount(CookieBanner);

            expect(wrapper.findComponent({"name": "FlatButton"}).exists()).to.be.true;
        });
    });

    describe("Methods", () => {
        it("should emit function setCookie", async () => {
            const wrapper = shallowMount(CookieBanner),
                flatButtonComponent = wrapper.findComponent({"name": "FlatButton"});

            await flatButtonComponent.trigger("click");
            expect(wrapper.emitted()).to.have.property("setCookie");
        });
    });
});
