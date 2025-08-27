import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import GeoMarker from "../../../components/GeoMarker.vue";

config.global.mocks.$t = key => key;

describe("addons/geoMarker/components/GeoMarker.vue", () => {
    it("should exist and have the correct id", async () => {
        const wrapper = shallowMount(GeoMarker);

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes("id")).to.be.equal("geoMarker");
    });
});
