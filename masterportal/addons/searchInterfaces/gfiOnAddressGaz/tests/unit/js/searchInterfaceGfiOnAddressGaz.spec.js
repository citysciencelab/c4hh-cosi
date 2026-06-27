import {expect} from "chai";
import sinon from "sinon";
import store from "../../../../../../src/app-store/index.js";
import SearchInterface from "../../../../../../src/modules/searchBar/searchInterfaces/searchInterface.js";
import SearchInterfaceGfiOnAddressGaz from "../../../js/searchInterfaceGfiOnAddressGaz.js";


describe("addons/searchInterfaces/exampleSearch/searchInterfaceGfiOnAddressGaz.js", () => {
    let searchInterface = null;

    beforeAll(() => {
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
        it("should create possible actions from search result", () => {
            // Arrange
            const searchResult = {
                    name: "Result Name1",
                    geometry: {
                        coordinates: [566601.20, 5928101.43]
                    },
                    properties: {
                        attribute1: "value1",
                        attribute2: "value2",
                        attribute3: "value3"
                    }
                },
                searchInterfaces = [
                    {
                        attributesToShow: ["attribute1", "attribute2", "attribute3"],
                        title: "Search Interface 1"
                    }
                ],
                mockStore = {
                    getters: {
                        "Modules/SearchBar/searchInterfaces": searchInterfaces
                    }
                },
                newSearchInterface = new SearchInterfaceGfiOnAddressGaz(mockStore),
                // Act
                actions = newSearchInterface.createPossibleActions(searchResult);

            // Assert
            expect(actions).to.have.property("openGetFeatureInfo");
            expect(actions.openGetFeatureInfo).to.have.property("feature");
            expect(actions.openGetFeatureInfo).to.have.property("layer");
            expect(actions.openGetFeatureInfo.feature.getProperties()).to.deep.equal(searchResult.properties);
            expect(actions).to.have.property("zoomToResult");
            expect(actions.zoomToResult).to.have.property("coordinates");
            expect(actions).to.have.property("setMarker");
            expect(actions.setMarker).to.have.property("coordinates");
            expect(actions.setMarker.coordinates).to.deep.equal(searchResult.geometry.coordinates);
            expect(actions).to.have.property("startRouting");
            expect(actions.startRouting).to.have.property("coordinates");
            expect(actions.startRouting).to.have.property("name");
            expect(actions.startRouting.coordinates).to.deep.equal(searchResult.geometry.coordinates);
            expect(actions.startRouting.name).to.equal(searchResult.name);
        });
    });
});
