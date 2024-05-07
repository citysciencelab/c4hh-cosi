import {expect} from "chai";
import sinon from "sinon";
import store from "../../../../../../../src_3_0_0/app-store";
import SearchInterface from "../../../../../../../src_3_0_0/modules/searchBar/searchInterfaces/searchInterface.js";
import SearchInterfaceGfiOnAddressGaz from "../../../js/searchInterfaceGfiOnAddressGaz.js";

describe("ADDONS: addons_3_0_0/searchInterfaces/exampleSearch/searchInterfaceGfiOnAddressGaz.js", () => {
    let searchInterface = null;

    before(() => {
        store.getters = {
            restServiceById: () => sinon.stub()
        };
        searchInterface = new SearchInterfaceGfiOnAddressGaz();
    });

    afterEach(() => {
        searchInterface.clearSearchResults();
    });

    describe("prototype", () => {
        it("searchInterfaceGfiOnAddressGaz should have the prototype SearchInterface", () => {
            expect(searchInterface).to.be.an.instanceof(SearchInterface);
        });
    });

    describe("createPossibleActions", () => {
        it("should create possible events from search result", () => {
            const searchResult = {
                    name: "Result Name1",
                    geometry: {
                        coordinates: [566601.20, 5928101.43]
                    },
                    properties: {
                        ObjectType: "Street"
                    },
                    gfiAttributes: {}
                },
                feature = {getProperties: () => searchResult.properties},
                layer = {
                    get: (key) => {
                        const data = {
                            name: searchResult.name,
                            gfiAttributes: searchResult.gfiAttributes
                        };

                        return data[key];
                    }
                };

            expect(searchInterface.createPossibleActions(searchResult)).to.deep.equal(
                {
                    openGetFeatureInfo: {
                        feature: feature,
                        layer: layer
                    },
                    zoomToResult: {
                        coordinates: [566601.20, 5928101.43]
                    },
                    setMarker: {
                        coordinates: [566601.20, 5928101.43]
                    },
                    startRouting: {
                        coordinates: [566601.20, 5928101.43],
                        name: "Result Name1"
                    }
                }
            );
        });
    });
});
