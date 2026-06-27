import {expect} from "chai";
import sinon from "sinon";
import actions from "../../../store/actionsVcOblique.js";
import crs from "@masterportal/masterportalapi/src/crs.js";


describe("addons/vcOblique/store/actionsVcOblique", () => {
    const namedProjections = [
        ["EPSG:31467", "+title=Bessel/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs"],
        ["EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
        ["EPSG:8395", "+title=ETRS89/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=GRS80 +datum=GRS80 +units=m +no_defs"],
        ["EPSG:4326", "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"]
    ];
    let commit, dispatch, rootGetters, getters, originalDocument;

    beforeAll(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            getView: () => {
                return {
                    getProjection: () => {
                        return {
                            getCode: () => "EPSG:25832"
                        };
                    }
                };
            },
            getLayers: () => {
                return {
                    getArray: () => {
                        return [{
                            get: (key) => {
                                if (key === "id") {
                                    return "marker_point_layer";
                                }
                                return {};
                            },
                            set: () => sinon.stub(),
                            changed: () => sinon.stub()
                        }];
                    }
                };
            }
        };

        mapCollection.addMap(map, "2D");
        i18next.init({
            lng: "cimode",
            debug: false
        });

        crs.registerProjections(namedProjections);
    });

    beforeEach(() => {
        originalDocument = global.document;
        commit = sinon.spy();
        dispatch = sinon.spy();
        getters = sinon.spy();
        rootGetters = {
            restServiceById: () => {
                return {
                    url: "https://this.could.be.your.url/examplePortal"
                };
            }
        };
    });
    afterEach(() => {
        global.document = originalDocument;
    });

    describe("resetObliqueViewer", () => {
        it("resetObliqueViewer shall reset the mapMarker style and remove the mapMarker", () => {
            actions.resetObliqueViewer({commit, dispatch, getters});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args[0][0]).to.equal("Maps/removePointMarker");
        });
    });
    describe("obliqueView", () => {
        it("obliqueView shall do nothing, if coordinates are null", () => {
            const centerCoordinate = null;

            actions.obliqueView({commit, dispatch, getters}, centerCoordinate);

            expect(commit.calledOnce).to.be.false;
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args[0][0]).to.equal("Alerting/addSingleAlert");

        });
        it("obliqueView shall do nothing, if coordinates are undefined", () => {
            const centerCoordinate = undefined;

            actions.obliqueView({commit, dispatch, getters}, centerCoordinate);

            expect(commit.calledOnce).to.be.false;
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args[0][0]).to.equal("Alerting/addSingleAlert");

        });
        it("obliqueView shall do nothing, if coordinates are no array", () => {
            const centerCoordinate = "";

            actions.obliqueView({commit, dispatch, getters}, centerCoordinate);

            expect(commit.calledOnce).to.be.false;
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args[0][0]).to.equal("Alerting/addSingleAlert");

        });
        it("obliqueView shall do nothing, if coordinates array length is smaller two", () => {
            const centerCoordinate = [565874];

            actions.obliqueView({commit, dispatch, getters}, centerCoordinate);

            expect(commit.calledOnce).to.be.false;
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args[0][0]).to.equal("Alerting/addSingleAlert");

        });
    });
    describe("createObliqueViewerURL", () => {
        it("createObliqueViewerURL shall do nothing, if coordinates are null", () => {
            const initialCenter = null;

            actions.createObliqueViewerURL({commit, dispatch, getters, rootGetters}, initialCenter);

            expect(commit.notCalled).to.be.true;
            expect(dispatch.notCalled).to.be.true;

        });
        it("createObliqueViewerURL shall do nothing, if coordinates are undefined", () => {
            const initialCenter = undefined;

            actions.createObliqueViewerURL({commit, dispatch, getters, rootGetters}, initialCenter);

            expect(commit.notCalled).to.be.true;
            expect(dispatch.notCalled).to.be.true;

        });
        it("createObliqueViewerURL shall do nothing, if coordinates are no array", () => {
            const initialCenter = "";

            actions.createObliqueViewerURL({commit, dispatch, getters, rootGetters}, initialCenter);

            expect(commit.notCalled).to.be.true;
            expect(dispatch.notCalled).to.be.true;

        });
        it("createObliqueViewerURL shall do nothing, if coordinates array length is smaller two", async () => {
            const initialCenter = [565874];

            actions.createObliqueViewerURL({commit, dispatch, getters, rootGetters}, initialCenter);

            expect(commit.notCalled).to.be.true;
            expect(dispatch.notCalled).to.be.true;

        });
        it("createObliqueViewerURL shall commit the oblique url", () => {
            const initialCenter = [565874, 5934140];

            global.document = {
                location: {
                    hostname: "hostname"
                }
            };
            actions.createObliqueViewerURL({commit, dispatch, getters, rootGetters}, initialCenter);

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("obliqueViewerURLWithSameHostname");
            expect(dispatch.firstCall.args[1]).to.equal("9.99431966511419, 53.55201216725377");
        });
    });

    describe("obliqueViewerURLWithSameHostname", () => {
        it("should print an alerting if url hostnames are different", () => {
            const startCoordinates = "9.99431966511419, 53.55201216725377";

            actions.obliqueViewerURLWithSameHostname({commit, dispatch, getters, rootGetters}, startCoordinates);

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Alerting/addSingleAlert");
            expect(dispatch.firstCall.args[1]).to.equal("modules.vcOblique.sameOrigin");
        });
    });

    describe("obliqueViewerURLWithReplacedHostname", () => {
        it("should replace the ", () => {
            const urlParts = ["geoportal-example.de", "examplePortal"],
                startCoordinates = "9.99431966511419, 53.55201216725377";

            global.document = {
                location: {
                    hostname: ""
                }
            };
            actions.obliqueViewerURLWithReplacedHostname({commit}, {urlParts, startCoordinates});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equals("setObliqueViewerURL");
            expect(commit.firstCall.args[1]).to.equals("https:///examplePortal?groundPosition=9.99431966511419, 53.55201216725377");
        });
    });

    describe("VCMap version branching", () => {
        let vcm4Map, vcm4Vcs, vcm6Map, vcm6Vcs;

        beforeEach(() => {
            const viewpoint = {
                distance: 100,
                heading: 50,
                groundPosition: [10, 20]
            };

            vcm4Map = {
                getViewPointSync: sinon.spy(() => viewpoint),
                gotoViewPoint: sinon.stub().resolves()
            };
            vcm4Vcs = {
                vcs: {
                    vcm: {
                        util: {ViewPoint: sinon.stub().callsFake(x => x)},
                        Framework: {getInstance: () => ({getActiveMap: () => vcm4Map})}
                    }
                }
            };

            vcm6Map = {
                getViewpointSync: sinon.spy(() => viewpoint),
                gotoViewpoint: sinon.stub().resolves()
            };
            vcm6Vcs = {
                vcs: {
                    getFirstApp: () => ({maps: {activeMap: vcm6Map}})
                }
            };
        });


        describe("obliqueView", () => {
            it("should correctly detect vcm@4 and use its methods", async () => {
                sinon.stub(document, "getElementById").returns({contentWindow: vcm4Vcs});

                await actions.obliqueView(
                    {commit: sinon.spy(), dispatch: sinon.spy(), getters: {heading: 50}},
                    [1, 2]
                );

                expect(vcm4Map.getViewPointSync.calledOnce).to.be.true;
                expect(vcm4Map.gotoViewPoint.calledOnce).to.be.true;
            });

            it("should correctly detect vcm@6 and use its methods", async () => {
                sinon.stub(document, "getElementById").returns({contentWindow: vcm6Vcs});

                await actions.obliqueView(
                    {commit: sinon.spy(), dispatch: sinon.spy(), getters: {heading: 50}},
                    [1, 2]
                );

                expect(vcm6Map.getViewpointSync.calledTwice).to.be.true;
                expect(vcm6Map.gotoViewpoint.calledOnce).to.be.true;
            });
        });
    });
});
