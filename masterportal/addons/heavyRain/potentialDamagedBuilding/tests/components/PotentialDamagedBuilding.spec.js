import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import PotentialDamagedBuilding from "../../components/PotentialDamagedBuilding.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/potentialDamagedBuilding/components/PotentialDamagedBuilding.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(PotentialDamagedBuilding, {});

            expect(wrapper.exists()).to.be.true;
        });
        it("should find a buttongroup", () => {
            const wrapper = shallowMount(PotentialDamagedBuilding, {});

            expect(wrapper.findComponent({name: "ButtonGroup"}).exists()).to.be.true;
        });
        it("should find overview cards", () => {
            const wrapper = shallowMount(PotentialDamagedBuilding, {});

            expect(wrapper.findAll(".overview-card")).lengthOf(2);
        });
        it("should find cards", () => {
            const wrapper = shallowMount(PotentialDamagedBuilding, {});

            expect(wrapper.findAll(".card")).lengthOf(2);
        });
        it("should find reset button", () => {
            const wrapper = shallowMount(PotentialDamagedBuilding, {});

            expect(wrapper.find("#reset").exists()).to.be.true;
        });
        it("should find save button", () => {
            const wrapper = shallowMount(PotentialDamagedBuilding, {});

            expect(wrapper.find("#save").exists()).to.be.true;
        });
    });
});
