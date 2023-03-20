import testAction from "../../../../../../test/unittests/VueTestUtils";
import actions from "../../../../store/actions/actionsSchoolRoutePlanningAddresses";
import {expect} from "chai";
import sinon from "sinon";

const {
    processInput,
    processStreetNames,
    searchHousenumbers,
    filterHouseNumbers,
    findHouseNumber
} = actions;


describe("addons/schoolRoutePlanning/store/actions/actionsSchoolRoutePlanningAddresses.js", () => {
    describe("processInput", () => {
        it("processInput start search streets", done => {
            const payload = {
                evt: {
                    target: {
                        value: "Mickey-Mouse-Street"
                    }
                },
                layer: "The layer"
            };

            testAction(processInput, payload, {}, {}, [
                {type: "searchStreets", payload: {
                    input: "Mickey-Mouse-Street",
                    layer: "The layer"
                }, dispatch: true}
            ], {}, done);
        });

        it("processInput start searchStreets for streetname with housenumber", done => {
            const payload = {
                evt: {
                    target: {
                        value: "Mickey-Mouse-Street 1"
                    }
                },
                layer: "The layer"
            };

            testAction(processInput, payload, {}, {}, [
                {type: "searchStreets", payload: {
                    input: "Mickey-Mouse-Street 1",
                    layer: "The layer"
                }, dispatch: true}
            ], {}, done);
        });
    });

    describe("searchStreets", () => {
        it("searchHousenumbers id sortedStreetNames length === 1", done => {
            const payload = {
                input: "Mickey-Mouse-Street",
                layer: "The layer",
                sortedStreetNames: ["StreetA"]
            };

            testAction(processStreetNames, payload, {}, {}, [
                {type: "setStreetNames", payload: ["StreetA"]},
                {type: "searchHousenumbers", payload: {
                    streetName: "StreetA",
                    eventType: "input"
                }, dispatch: true}
            ], {}, done);
        });

        it("searchHousenumbers id sortedStreetNames length > 1", done => {
            const payload = {
                input: "Mickey-Mouse-Street",
                layer: "The layer",
                sortedStreetNames: ["StreetA", "StreetB", "StreetC"]
            };

            testAction(processStreetNames, payload, {}, {}, [
                {type: "setStreetNames", payload: ["StreetA", "StreetB", "StreetC"]},
                {type: "setHouseNumbers", payload: []},
                {type: "setFilteredHouseNumbers", payload: []}
            ], {}, done);
        });

        it("searchHousenumbers id sortedStreetNames length === 0", done => {
            const payload = {
                input: "Mickey-Mouse-Street",
                layer: "The layer",
                sortedStreetNames: []
            };

            testAction(processStreetNames, payload, {}, {}, [
                {type: "filterHouseNumbers", payload: {
                    input: "Mickey-Mouse-Street",
                    layer: "The layer"}, dispatch: true}
            ], {}, done);
        });
    });

    describe("searchHousenumbers", () => {
        it("searchHousenumbers with click event", () => {
            const payload = {
                    streetName: "Mickey-Mouse-Street",
                    eventType: "click"
                },
                commit = sinon.spy(),
                rootGetters = sinon.spy();

            searchHousenumbers({rootGetters, commit}, payload);

            expect(commit.calledTwice).to.be.true;
            expect(commit.args[0]).to.deep.equal([
                "setStreetNames", ["Mickey-Mouse-Street"]
            ]);
            expect(commit.args[1]).to.deep.equal([
                "setInputAddress", "Mickey-Mouse-Street"
            ]);
        });
    });

    describe("filterHouseNumbers", () => {
        it("filterHouseNumbers set filtered housenumbers for more than one found housenumbers", done => {
            const state = {
                    houseNumbers: [
                        {
                            name: "Mickey-Mouse-Street 1",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        },
                        {
                            name: "Mickey-Mouse-Street 2",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        },
                        {
                            name: "Mickey-Mouse-Street 3",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        },
                        {
                            name: "Mickey-Mouse-Street 3a",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        },
                        {
                            name: "Mickey-Mouse-Street 100",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        },
                        {
                            name: "Mickey-Mouse-Street 110",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        },
                        {
                            name: "Mickey-Mouse-Street 111",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        }
                    ]
                },
                payload = {
                    input: "Mickey-Mouse-Street 1",
                    layer: {
                        getSource: () => "The layer"
                    }
                };

            testAction(filterHouseNumbers, payload, state, {}, [
                {type: "setInputAddress", payload: "Mickey-Mouse-Street 1"},
                {type: "setFilteredHouseNumbers", payload: [
                    {
                        name: "Mickey-Mouse-Street 1",
                        geometry: {
                            coordinates: ["100", "200"]
                        }
                    },
                    {
                        name: "Mickey-Mouse-Street 100",
                        geometry: {
                            coordinates: ["100", "200"]
                        }
                    },
                    {
                        name: "Mickey-Mouse-Street 110",
                        geometry: {
                            coordinates: ["100", "200"]
                        }
                    },
                    {
                        name: "Mickey-Mouse-Street 111",
                        geometry: {
                            coordinates: ["100", "200"]
                        }
                    }
                ]}
            ], {}, done);
        });
        it("filterHouseNumbers setGeometryByFeatureId for found exactyl one housenumber", () => {
            const state = {
                    houseNumbers: [
                        {
                            name: "Mickey-Mouse-Street 1",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        },
                        {
                            name: "Mickey-Mouse-Street 2",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        },
                        {
                            name: "Mickey-Mouse-Street 3",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        },
                        {
                            name: "Mickey-Mouse-Street 3a",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        }
                    ]
                },
                payload = {
                    input: "Mickey-Mouse-Street 1",
                    layer: {
                        getSource: () => "The layer"
                    }
                },
                commit = sinon.spy(),
                dispatch = sinon.spy();

            filterHouseNumbers({state, commit, dispatch}, payload);
            expect(commit.calledOnce).to.be.true;
            expect(commit.args[0]).to.deep.equal([
                "setInputAddress", "Mickey-Mouse-Street 1"
            ]);
            expect(dispatch.calledTwice).to.be.true;
            expect(dispatch.args[1]).to.deep.equal([
                "searchRegionalPrimarySchool", "Mickey-Mouse-Street 1"
            ]);
        });
    });

    describe("findHouseNumber", () => {
        it("findHouseNumber", () => {
            const state = {
                    houseNumbers: [
                        {
                            name: "Mickey-Mouse-Street 1",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        },
                        {
                            name: "Mickey-Mouse-Street 2",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        },
                        {
                            name: "Mickey-Mouse-Street 3",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        },
                        {
                            name: "Mickey-Mouse-Street 3a",
                            geometry: {
                                coordinates: ["100", "200"]
                            }
                        }
                    ]
                },
                payload = {
                    input: "Mickey-Mouse-Street 1",
                    layer: {
                        getSource: () => "The layer"
                    }
                },
                commit = sinon.spy(),
                dispatch = sinon.spy();

            findHouseNumber({state, commit, dispatch}, payload);
            expect(commit.calledOnce).to.be.true;
            expect(commit.args[0]).to.deep.equal([
                "setInputAddress", "Mickey-Mouse-Street 1"
            ]);
            expect(dispatch.calledThrice).to.be.true;
            expect(dispatch.args[1]).to.deep.equal([
                "searchRegionalPrimarySchool", "Mickey-Mouse-Street 1"
            ]);
            expect(dispatch.args[1]).to.deep.equal([
                "searchRegionalPrimarySchool", "Mickey-Mouse-Street 1"
            ]);
        });
    });
});
