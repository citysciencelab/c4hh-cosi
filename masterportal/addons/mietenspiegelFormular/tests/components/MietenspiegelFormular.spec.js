import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import MietenspiegelFormular from "../../components/MietenspiegelFormular.vue";
import MietenspiegelFormularStore from "../../store/indexMietenspiegelFormular.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import sinon from "sinon";
import wfsRequest from "../../../../src/shared/js/api/wfs/getFeature.js";

config.global.mocks.$t = key => key;

describe("addons/mietenspiegelFormular/components/MietenspiegelFormular.vue", () => {
    let store;

    const factory = {
        getShallowMount: (values = {}) => {
            return shallowMount(MietenspiegelFormular, {
                store,
                data () {
                    return {
                        ...values
                    };
                },
                computed: {
                    name: () => "Hallo",
                    icon: () => "small",
                    layerIdMetadata: () => "2731",
                    layerIdCalculation: () => "2730",
                    collectionStatus: () => "01.04.2023"
                }
            });
        }
    };

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        MietenspiegelFormular: MietenspiegelFormularStore
                    }
                }
            },
            Maps: {
                namespaced: true,
                getters: {
                    projectionCode: () => sinon.stub(),
                    resolution: 0
                }
            }
        });

        sinon.spy(MietenspiegelFormular.methods, "getCalculationData");
        sinon.spy(MietenspiegelFormular.methods, "modifyMietenspiegelData");
        sinon.spy(MietenspiegelFormular.methods, "getFeatureProperties");
        sinon.spy(MietenspiegelFormular.methods, "getFormKeys");
        sinon.stub(rawLayerList, "getLayerWhere").returns({version: "", url: "", featureType: ""});
        sinon.stub(wfsRequest, "getFeatureGET").returns(`<?xml version='1.0' encoding='UTF-8'?>
        <wfs:FeatureCollection xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs https://geodienste.hamburg.de/HH_WFS_Mietenspiegel?SERVICE=WFS&amp;VERSION=1.1.0&amp;REQUEST=DescribeFeatureType&amp;OUTPUTFORMAT=text%2Fxml%3B+subtype%3Dgml%2F3.1.1&amp;TYPENAME=app:mietenspiegel_metadaten&amp;NAMESPACE=xmlns(app=http%3A%2F%2Fwww.deegree.org%2Fapp)" xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml">
          <gml:featureMember>
            <app:mietenspiegel_metadaten xmlns:app="http://www.deegree.org/app" gml:id="APP_MIETENSPIEGEL_METADATEN_0">
              <app:erhebungsstand>2021-04-01</app:erhebungsstand>
              <app:herausgeber>Behörde für Stadtentwicklung und Wohnen - Amt für Wohnen, Stadterneuerung und Bodenordnung</app:herausgeber>
              <app:hinweis>Diese Tabelle lässt sich nur richtig anwenden, wenn die Erläuterungen in der Broschüre "Hamburger Mietenspiegel 2021" genau beachtet werden.</app:hinweis>
              <app:titel>Nettokaltmiete ohne Heizung und ohne Betriebskosten (in EUR/m²)</app:titel>
              <app:merkmaletext>Baualtersklasse/Bezugsfertigkeit|Ausstattung|Wohnlage|Wohnfläche</app:merkmaletext>
            </app:mietenspiegel_metadaten>
          </gml:featureMember>
        </wfs:FeatureCollection>`);
    });


    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should find a select component for Baualtersklasse", () => {
            const wrapper = factory.getShallowMount({}, true);

            expect(wrapper.find(".select-baualtersklasse").exists()).to.be.true;
        });
        it("should find a select component for Wohnfläche", () => {
            const wrapper = factory.getShallowMount({}, true);

            expect(wrapper.find(".select-wohnflaeche").exists()).to.be.true;
        });
        it("should find notes", () => {
            const wrapper = factory.getShallowMount({}, true);

            expect(wrapper.find(".notes").exists()).to.be.true;
        });
        it("should render an error message", async () => {
            const wrapper = factory.getShallowMount({});

            wrapper.vm.errorMessage = "foo";
            await wrapper.vm.$nextTick();
            expect(wrapper.find(".alert-warning").exists()).to.be.true;
        });

        it("should not render an error message", () => {
            const wrapper = factory.getShallowMount({addressInformation: {strasse: "foo"}});

            expect(wrapper.find(".alert-warning").exists()).to.be.false;
        });
    });

    describe("Lifecycle Hooks", () => {
        it("should call 'getCalculationData' in the mounted hook", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            expect(MietenspiegelFormular.methods.getCalculationData.calledOnce).to.be.true;
        });

        it("should call 'getFeatureProperties' in the mounted hook", async () => {
            await factory.getShallowMount();

            expect(MietenspiegelFormular.methods.getFeatureProperties.calledOnce).to.be.true;
        });

        it("should set 'METADATA' in the mounted hook", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.METADATA).to.have.all.keys("erhebungsstand", "hinweis", "herausgeber", "titel", "merkmaletext");
        });
    });

    describe("Watchers", () => {
        describe("clickCoordinate", () => {
            it("should call 'residentialInformationByCoordinate' after clickCoordinate was changed", async () => {
                const spyResidentialInformationByCoordinate = sinon.stub(MietenspiegelFormular.methods, "residentialInformationByCoordinate"),
                    wrapper = factory.getShallowMount();

                await wrapper.vm.$options.watch.clickCoordinate.call(wrapper.vm);

                expect(spyResidentialInformationByCoordinate.calledOnce).to.be.true;
                spyResidentialInformationByCoordinate.restore();
            });
        });
    });

    describe("Methods", () => {
        describe("getFeaturesByLayerId", () => {
            it("should return false if param is not a string", async () => {
                const wrapper = factory.getShallowMount({});

                expect(await wrapper.vm.getFeaturesByLayerId(undefined)).to.be.false;
                expect(await wrapper.vm.getFeaturesByLayerId(null)).to.be.false;
                expect(await wrapper.vm.getFeaturesByLayerId(true)).to.be.false;
                expect(await wrapper.vm.getFeaturesByLayerId(false)).to.be.false;
                expect(await wrapper.vm.getFeaturesByLayerId(1234)).to.be.false;
                expect(await wrapper.vm.getFeaturesByLayerId([])).to.be.false;
                expect(await wrapper.vm.getFeaturesByLayerId({})).to.be.false;
            });
        });
        describe("getFeatureInfoUrlByLayer", () => {
            it("should return null if first param is not an array", () => {
                const wrapper = factory.getShallowMount({});

                expect(wrapper.vm.getFeatureInfoUrlByLayer()).to.be.null;
            });
            it("should return null if first param is an array but has no length", () => {
                const wrapper = factory.getShallowMount({});

                expect(wrapper.vm.getFeatureInfoUrlByLayer([])).to.be.null;
            });
            it("should return null if the second param is not a object", () => {
                const wrapper = factory.getShallowMount({});

                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], undefined)).to.be.null;
                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], null)).to.be.null;
                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], [])).to.be.null;
                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], "string")).to.be.null;
                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], 1234)).to.be.null;
                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], true)).to.be.null;
                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], false)).to.be.null;
            });
            it("should return null if the last param is not a string", () => {
                const wrapper = factory.getShallowMount({});

                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], {}, undefined)).to.be.null;
                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], {}, null)).to.be.null;
                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], {}, true)).to.be.null;
                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], {}, false)).to.be.null;
                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], {}, 1234)).to.be.null;
                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], {}, [])).to.be.null;
                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], {}, {})).to.be.null;
            });
            it("should return a string", () => {
                const wrapper = factory.getShallowMount({});

                expect(wrapper.vm.getFeatureInfoUrlByLayer([0, 0], {
                    getSource: () => {
                        return {
                            getFeatureInfoUrl: () => "foo"
                        };
                    }
                }, "2345")).to.be.equal("foo");
            });
        });
        describe("getResidentialInformation", () => {
            it("should return false if first param is not an string", () => {
                const wrapper = factory.getShallowMount({});

                expect(wrapper.vm.getResidentialInformation()).to.be.false;
            });
            it("should return false and call onerror function if first param is not an string", () => {
                const wrapper = factory.getShallowMount({});

                expect(wrapper.vm.getResidentialInformation(undefined, undefined, undefined, error => {
                    expect(error).to.be.equal("additional:modules.tools.mietenspiegelFormular.errorMessages.noUrl");
                })).to.be.false;
            });
            it("should call the requestGfi function to fetch the address informations", () => {
                const requestGfiStub = sinon.stub(MietenspiegelFormular.methods, "requestGfi").resolves(["foo"]),
                    wrapper = factory.getShallowMount({});

                expect(wrapper.vm.getResidentialInformation("foo", {})).to.be.true;
                expect(requestGfiStub.calledOnce).to.be.true;
            });
            it("should call the onsuccess function", () => {
                const resultObject = {foo: "foo"},
                    requestGfiStub = sinon.stub(MietenspiegelFormular.methods, "requestGfi").resolves([{
                        getProperties: () => {
                            return resultObject;
                        }
                    }]),
                    wrapper = factory.getShallowMount({});

                expect(wrapper.vm.getResidentialInformation("foo", {}, response => {
                    expect(response).to.deep.equal(resultObject);
                })).to.be.true;
                expect(requestGfiStub.calledOnce).to.be.true;
            });
            it("should call the onerror function if response from requestGFI is not an array", () => {
                const requestGfiStub = sinon.stub(MietenspiegelFormular.methods, "requestGfi").resolves(undefined),
                    wrapper = factory.getShallowMount({});

                expect(wrapper.vm.getResidentialInformation("foo", {}, undefined, error => {
                    expect(error).to.be.equal("additional:modules.tools.mietenspiegelFormular.errorMessages.noDataFound");
                })).to.be.true;
                expect(requestGfiStub.calledOnce).to.be.true;
            });
        });
        describe("residentialInformationByCoordinate", () => {
            it("should return false if second param is not a string", () => {
                const wrapper = factory.getShallowMount({});

                expect(wrapper.vm.residentialInformationByCoordinate(undefined, undefined)).to.be.false;
                expect(wrapper.vm.residentialInformationByCoordinate(undefined, null)).to.be.false;
                expect(wrapper.vm.residentialInformationByCoordinate(undefined, true)).to.be.false;
                expect(wrapper.vm.residentialInformationByCoordinate(undefined, false)).to.be.false;
                expect(wrapper.vm.residentialInformationByCoordinate(undefined, 1234)).to.be.false;
                expect(wrapper.vm.residentialInformationByCoordinate(undefined, [])).to.be.false;
                expect(wrapper.vm.residentialInformationByCoordinate(undefined, {})).to.be.false;
            });
        });
        describe("getFormKeys", () => {
            it("should return false if param is not a string", () => {
                const wrapper = factory.getShallowMount({}, true);

                expect(wrapper.vm.getFormKeys(undefined)).to.be.false;
                expect(wrapper.vm.getFormKeys(null)).to.be.false;
                expect(wrapper.vm.getFormKeys(true)).to.be.false;
                expect(wrapper.vm.getFormKeys(false)).to.be.false;
                expect(wrapper.vm.getFormKeys(1234)).to.be.false;
                expect(wrapper.vm.getFormKeys([])).to.be.false;
                expect(wrapper.vm.getFormKeys({})).to.be.false;
            });
        });
        describe("modifyMietenspiegelData", () => {
            it("should return false if param is not an array", () => {
                const wrapper = factory.getShallowMount({}, true);

                expect(wrapper.vm.modifyMietenspiegelData(undefined)).to.be.false;
                expect(wrapper.vm.modifyMietenspiegelData(null)).to.be.false;
                expect(wrapper.vm.modifyMietenspiegelData(true)).to.be.false;
                expect(wrapper.vm.modifyMietenspiegelData(false)).to.be.false;
                expect(wrapper.vm.modifyMietenspiegelData(1234)).to.be.false;
                expect(wrapper.vm.modifyMietenspiegelData("string")).to.be.false;
                expect(wrapper.vm.modifyMietenspiegelData({})).to.be.false;
            });
        });
        describe("getUniqueValuesByAttributes", () => {
            it("should return false if param is not a string", () => {
                const wrapper = factory.getShallowMount({}, true),
                    calc = [
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.12.1918"
                        },
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.11.1918"
                        },
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.12.1918"
                        },
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.12.1918"
                        }
                    ];

                expect(wrapper.vm.getUniqueValuesByAttributes(undefined, calc)).to.be.false;
                expect(wrapper.vm.getUniqueValuesByAttributes(null, calc)).to.be.false;
                expect(wrapper.vm.getUniqueValuesByAttributes(true, calc)).to.be.false;
                expect(wrapper.vm.getUniqueValuesByAttributes(false, calc)).to.be.false;
                expect(wrapper.vm.getUniqueValuesByAttributes(1234, calc)).to.be.false;
                expect(wrapper.vm.getUniqueValuesByAttributes([], calc)).to.be.false;
                expect(wrapper.vm.getUniqueValuesByAttributes({}, calc)).to.be.false;
            });
            it("should return an array with unique values for attribute", () => {
                const wrapper = factory.getShallowMount({}, true),
                    calc = [
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.12.1918"
                        },
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.11.1918"
                        },
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.12.1918"
                        },
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.12.1918"
                        }
                    ],
                    item = "Baualtersklasse/Bezugsfertigkeit",
                    expected = ["bis 31.12.1918", "bis 31.11.1918"];

                expect(wrapper.vm.getUniqueValuesByAttributes(item, calc)).to.deep.equal(expected);
            });
            it("should return an empty array, if calculationData is not an array", () => {
                const wrapper = factory.getShallowMount({}, true),
                    item = "Baualtersklasse/Bezugsfertigkeit",
                    expected = [];

                expect(wrapper.vm.getUniqueValuesByAttributes(item, undefined)).to.deep.equal(expected);
                expect(wrapper.vm.getUniqueValuesByAttributes(item, null)).to.deep.equal(expected);
                expect(wrapper.vm.getUniqueValuesByAttributes(item, true)).to.deep.equal(expected);
                expect(wrapper.vm.getUniqueValuesByAttributes(item, false)).to.deep.equal(expected);
                expect(wrapper.vm.getUniqueValuesByAttributes(item, 1234)).to.deep.equal(expected);
                expect(wrapper.vm.getUniqueValuesByAttributes(item, {})).to.deep.equal(expected);
            });
            it("should return an array with a fixed last element", () => {
                const wrapper = factory.getShallowMount({}, true),
                    calc = [
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "2016 bis 2022"
                        },
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.12.1918"
                        },
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.11.1918"
                        },
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.12.1918"
                        },
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.12.1918"
                        }
                    ],
                    item = "Baualtersklasse/Bezugsfertigkeit",
                    expected = ["bis 31.12.1918", "bis 31.11.1918", "2016 bis 2022"];

                expect(wrapper.vm.getUniqueValuesByAttributes(item, calc)).to.deep.equal(expected);
            });
            it("should return an empty array, if calculationData is not an array", () => {
                const wrapper = factory.getShallowMount({}, true),
                    item = "Baualtersklasse/Bezugsfertigkeit",
                    expected = [];

                expect(wrapper.vm.getUniqueValuesByAttributes(item, undefined)).to.deep.equal(expected);
                expect(wrapper.vm.getUniqueValuesByAttributes(item, null)).to.deep.equal(expected);
                expect(wrapper.vm.getUniqueValuesByAttributes(item, true)).to.deep.equal(expected);
                expect(wrapper.vm.getUniqueValuesByAttributes(item, false)).to.deep.equal(expected);
                expect(wrapper.vm.getUniqueValuesByAttributes(item, 1234)).to.deep.equal(expected);
                expect(wrapper.vm.getUniqueValuesByAttributes(item, {})).to.deep.equal(expected);
            });
            it("should return an array with unique values for attribute with category", () => {
                const wrapper = factory.getShallowMount({}, true),
                    calc = [
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.12.1918",
                            "Kategorie": "Normale Wohnlage"
                        },
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.11.1918",
                            "Kategorie": "Gute Wohnlage"
                        },
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.12.1918",
                            "Kategorie": "Normale Wohnlage"
                        },
                        {
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.12.1918",
                            "Kategorie": "Normale Wohnlage"
                        }
                    ],
                    item = "Baualtersklasse/Bezugsfertigkeit",
                    category = "Normale Wohnlage",
                    expected = ["bis 31.12.1918"];

                expect(wrapper.vm.getUniqueValuesByAttributes(item, calc, category)).to.deep.equal(expected);
            });
        });
        describe("convertDateFormat", () => {
            it("should return false if param is not a string", () => {
                const wrapper = factory.getShallowMount({}, true);

                expect(wrapper.vm.convertDateFormat(undefined)).to.be.false;
                expect(wrapper.vm.convertDateFormat(null)).to.be.false;
                expect(wrapper.vm.convertDateFormat(true)).to.be.false;
                expect(wrapper.vm.convertDateFormat(false)).to.be.false;
                expect(wrapper.vm.convertDateFormat(1234)).to.be.false;
                expect(wrapper.vm.convertDateFormat([])).to.be.false;
                expect(wrapper.vm.convertDateFormat({})).to.be.false;
            });
            it("should convert the date format from YYYY-MM-DD to DD.MM.YYYY", () => {
                const wrapper = factory.getShallowMount({}, true),
                    date = "2021-08-11",
                    expected = "11.08.2021";

                expect(wrapper.vm.convertDateFormat(date)).to.deep.equal(expected);
            });
        });
        describe("getRentPrice", () => {
            it("should return empty object if first param is not a string", () => {
                const wrapper = factory.getShallowMount({}, true);

                expect(wrapper.vm.getRentPrice(undefined)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice(null)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice(true)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice(false)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice(1234)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice([])).to.deep.equal({});
                expect(wrapper.vm.getRentPrice({})).to.deep.equal({});
            });
            it("should return empty object if second param is not a string", () => {
                const wrapper = factory.getShallowMount({}, true);

                expect(wrapper.vm.getRentPrice("2011 bis 2015", undefined)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice("2011 bis 2015", null)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice("2011 bis 2015", true)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice("2011 bis 2015", false)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice("2011 bis 2015", 1234)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice("2011 bis 2015", [])).to.deep.equal({});
                expect(wrapper.vm.getRentPrice("2011 bis 2015", {})).to.deep.equal({});
            });
            it("should return empty object if third param is not an array or is an empty array", () => {
                const wrapper = factory.getShallowMount({}, true);

                expect(wrapper.vm.getRentPrice("2011 bis 2015", "25m² bis unter 41m²", undefined)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice("2011 bis 2015", "25m² bis unter 41m²", null)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice("2011 bis 2015", "25m² bis unter 41m²", true)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice("2011 bis 2015", "25m² bis unter 41m²", false)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice("2011 bis 2015", "25m² bis unter 41m²", 1234)).to.deep.equal({});
                expect(wrapper.vm.getRentPrice("2011 bis 2015", "25m² bis unter 41m²", [])).to.deep.equal({});
                expect(wrapper.vm.getRentPrice("2011 bis 2015", "25m² bis unter 41m²", {})).to.deep.equal({});
            });
            it("should return an object with min, max and middle value for the rent price", () => {
                const wrapper = factory.getShallowMount({}, true),
                    calcData = [
                        {
                            "mittelwert": "12.12",
                            "spanne_min": "9.06",
                            "spanne_max": "14.81",
                            "merkmale": "bis 31.12.1918|mit Bad und Sammelheizung|Normale Wohnlage|25m² bis unter 41m²",
                            "Baualtersklasse/Bezugsfertigkeit": "bis 31.12.1918",
                            "Ausstattung": "mit Bad und Sammelheizung",
                            "Kategorie": "Normale Wohnlage",
                            "Wohnfläche": "25m² bis unter 41m²"
                        },
                        {
                            "mittelwert": "9.76",
                            "spanne_min": "8.25",
                            "spanne_max": "11.86",
                            "merkmale": "01.01.1919 bis 20.06.1948|mit Bad und Sammelheizung|Normale Wohnlage|25m² bis unter 41m²",
                            "Baualtersklasse/Bezugsfertigkeit": "2011 bis 2015",
                            "Ausstattung": "mit Bad und Sammelheizung",
                            "Kategorie": "Normale Wohnlage",
                            "Wohnfläche": "ab 131m²"
                        }
                    ],
                    expected = {
                        "rangeMin": "8.25",
                        "rangeMax": "11.86",
                        "averageValue": "9.76"
                    };

                expect(wrapper.vm.getRentPrice("2011 bis 2015", "ab 131m²", "Normale Wohnlage", calcData)).to.deep.equal(expected);
            });
        });
    });
});
