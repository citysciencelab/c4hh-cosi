import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import GeoMarker from "../../../components/GeoMarker.vue";

config.global.mocks.$t = key => key;

describe("addons/geoMarker/components/GeoMarker.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = wrapper = shallowMount(GeoMarker);
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });


    it("should exist and have the correct id", () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes("id")).to.be.equal("geoMarker");
    });

    it("should have all navigation tabs", () => {
        expect(wrapper.find("#newTab").exists()).to.be.true;
        expect(wrapper.find("#listTab").exists()).to.be.true;
        expect(wrapper.find("#filterTab").exists()).to.be.true;
        expect(wrapper.find("#filterTab").attributes("active")).to.equal("true");
    });
});
