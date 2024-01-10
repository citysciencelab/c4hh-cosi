import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ParcelinfoTheme from "../../../components/ParcelinfoTheme.vue";
import FlatButton from "../../../../../../../src_3_0_0/shared/modules/buttons/components/FlatButton.vue";
config.global.mocks.$t = key => key;

describe("addons/parcelinfo/components/ParcelinfoTheme.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(ParcelinfoTheme, {
            props: {
                feature: {
                    getMappedProperties () {
                        return {
                            "Fläche": "10",
                            "Land": "Hamburg",
                            "Gemarkung": "bValue",
                            "Flurstück": "aValue",
                            "Straße": "Hamburger Straße"
                        };
                    }
                }
            }
        });
    });

    describe("DOM", () => {
        it("should exist", () => {
            expect(wrapper.find("table").exists()).to.be.true;
        });

        it("should contain gfi attributes", () => {
            expect(wrapper.findAll("td").at(0).text()).to.equal("Fläche");
            expect(wrapper.findAll("td").at(1).text()).to.equal("10");
            expect(wrapper.findAll("td").at(2).text()).to.equal("Land");
            expect(wrapper.findAll("td").at(3).text()).to.equal("Hamburg");
            expect(wrapper.findAll("td").at(4).text()).to.equal("Gemarkung");
            expect(wrapper.findAll("td").at(5).text()).to.equal("bValue");
            expect(wrapper.findAll("td").at(6).text()).to.equal("Flurstück");
            expect(wrapper.findAll("td").at(7).text()).to.equal("aValue");
            expect(wrapper.findAll("td").at(8).text()).to.equal("Straße");
            expect(wrapper.findAll("td").at(9).text()).to.equal("Hamburger Straße");
        });

        it("should contain button", () => {
            expect(wrapper.findComponent(FlatButton).exists()).to.be.true;
        });
    });
});
