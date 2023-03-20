import {shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import GeoAnalyzeResultGeometry from "../../../components/GeoAnalyzeResultGeometry.vue";

const localVue = createLocalVue();

describe("addons/geoAnalyze/components/GeoAnalyzeResultGeometry.vue", () => {
    const results = {
        "ew": [{
            "sum_ew_haupt": "871",
            "sum_ew_neben": "55"
        }],
        "kitas": [{
            "sum_kita": "0",
            "sum_kinder": undefined
        }],
        "schools": [{
            "sum_schulen": "0",
            "sum_schueler": null
        }]
    };

    it("should render the correct values in the description list", () => {
        const wrapper = shallowMount(GeoAnalyzeResultGeometry, {
                propsData: {
                    results
                },
                localVue
            }),
            ddTags = wrapper.findAll("dd");

        expect(ddTags.at(0).text()).to.be.equal("871");
        expect(ddTags.at(1).text()).to.be.equal("55");
        expect(ddTags.at(2).text()).to.be.equal("0");
        expect(ddTags.at(3).text()).to.be.equal("keine Daten vorhanden");
        expect(ddTags.at(4).text()).to.be.equal("0");
        expect(ddTags.at(5).text()).to.be.equal("keine Daten vorhanden");
        expect(ddTags.at(6).text()).to.be.equal("keine Daten vorhanden");
        expect(ddTags.at(7).text()).to.be.equal("keine Daten vorhanden");
    });

});
