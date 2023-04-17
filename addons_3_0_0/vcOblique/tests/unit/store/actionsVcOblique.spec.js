import {expect} from "chai";
import sinon from "sinon";
import actions from "../../../store/actionsVcOblique";
import crs from "@masterportal/masterportalapi/src/crs";


describe("ADDONS: addons/vcOblique/store/actionsVcOblique", () => {
    const namedProjections = [
        ["EPSG:31467", "+title=Bessel/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs"],
        ["EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
        ["EPSG:8395", "+title=ETRS89/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=GRS80 +datum=GRS80 +units=m +no_defs"],
        ["EPSG:4326", "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"]
    ];
    let commit, dispatch, rootGetters, getters;

    before(() => {
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
                            set: () => sinon.stub()
                        }];
                    }
                }
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
        commit = sinon.spy();
        dispatch = sinon.spy();
        getters = sinon.spy();
        rootGetters = {
            getRestServiceById: () => {
                return {
                    url: "https://this.could.be.your.url/examplePortal"
                };
            }
        };
    });
    afterEach(() => {
        sinon.restore();
    });

    describe("resetObliqueViewer", () => {
        it("resetObliqueViewer shall reset the mapMarker style and remove the mapMarker", () => {
            actions.resetObliqueViewer({commit, dispatch, getters});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args[0][0]).to.equal("Maps/removePointMarker");
        });
    });
    describe("setObliqueView", () => {
        it("setObliqueView shall do nothing, if coordinates are null", () => {
            const centerCoordinate = null;

            actions.setObliqueView({commit, dispatch, getters}, centerCoordinate);

            expect(commit.calledOnce).to.be.false;
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args[0][0]).to.equal("Alerting/addSingleAlert");

        });
        it("setObliqueView shall do nothing, if coordinates are undefined", () => {
            const centerCoordinate = undefined;

            actions.setObliqueView({commit, dispatch, getters}, centerCoordinate);

            expect(commit.calledOnce).to.be.false;
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args[0][0]).to.equal("Alerting/addSingleAlert");

        });
        it("setObliqueView shall do nothing, if coordinates are no array", () => {
            const centerCoordinate = "";

            actions.setObliqueView({commit, dispatch, getters}, centerCoordinate);

            expect(commit.calledOnce).to.be.false;
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args[0][0]).to.equal("Alerting/addSingleAlert");

        });
        it("setObliqueView shall do nothing, if coordinates array length is smaller two", () => {
            const centerCoordinate = [565874];

            actions.setObliqueView({commit, dispatch, getters}, centerCoordinate);

            expect(commit.calledOnce).to.be.false;
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args[0][0]).to.equal("Alerting/addSingleAlert");

        });
    });
    describe("setObliqueViewerURL", () => {
        it("setObliqueViewerURL shall do nothing, if coordinates are null", () => {
            const initialCenter = null;

            actions.setObliqueViewerURL({commit, dispatch, getters, rootGetters}, initialCenter);

            expect(commit.notCalled).to.be.true;
            expect(dispatch.notCalled).to.be.true;

        });
        it("setObliqueViewerURL shall do nothing, if coordinates are undefined", () => {
            const initialCenter = undefined;

            actions.setObliqueViewerURL({commit, dispatch, getters, rootGetters}, initialCenter);

            expect(commit.notCalled).to.be.true;
            expect(dispatch.notCalled).to.be.true;

        });
        it("setObliqueViewerURL shall do nothing, if coordinates are no array", () => {
            const initialCenter = "";

            actions.setObliqueViewerURL({commit, dispatch, getters, rootGetters}, initialCenter);

            expect(commit.notCalled).to.be.true;
            expect(dispatch.notCalled).to.be.true;

        });
        it("setObliqueViewerURL shall do nothing, if coordinates array length is smaller two", async () => {
            const initialCenter = [565874];

            actions.setObliqueViewerURL({commit, dispatch, getters, rootGetters}, initialCenter);

            expect(commit.notCalled).to.be.true;
            expect(dispatch.notCalled).to.be.true;

        });
        it("setObliqueViewerURL shall commit the oblique url", () => {
            const initialCenter = [565874, 5934140];

            actions.setObliqueViewerURL({commit, dispatch, getters, rootGetters}, initialCenter);

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("setObliqueViewerURLWithSameHostname");
            expect(dispatch.firstCall.args[1]).to.equal("9.99431966511419, 53.55201216725377");
        });
    });

    describe("setObliqueViewerURLWithSameHostname", () => {
        it("should print an alerting if url hostnames are different", () => {
            const startCoordinates = "9.99431966511419, 53.55201216725377";

            actions.setObliqueViewerURLWithSameHostname({commit, dispatch, getters, rootGetters}, startCoordinates);

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Alerting/addSingleAlert");
            expect(dispatch.firstCall.args[1]).to.equal("modules.tools.vcOblique.sameOrigin");
        });
    });

    describe("setObliqueViewerURLWithReplacedHostname", () => {
        it("should replace the ", () => {
            const urlParts = ["geoportal-example.de", "examplePortal"],
                startCoordinates = "9.99431966511419, 53.55201216725377";

            actions.setObliqueViewerURLWithReplacedHostname({commit}, {urlParts, startCoordinates});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equals("setObliqueViewerURL");
            expect(commit.firstCall.args[1]).to.equals("https:///examplePortal?groundPosition=9.99431966511419, 53.55201216725377");
        });
    });
    describe("rotatePointMarkerIn3D", () => {
        const map3D = {
            id: "1",
            mode: "3D",
            getCesiumScene: () => {
                return {
                    drillPick: () => {
                        return [{
                            primitive: primitive
                        }];
                    }
                };
            },
            getOlMap: () => {
                return {
                    getSize: () => {
                        return [
                            100,
                            200
                        ];
                    }
                };
            }
        },
        primitive = {
            olFeature: {
                getStyle: () => {
                    return {
                        getImage: () => {
                            return {
                                getAnchor: () => {
                                    return [
                                        100,
                                        100
                                    ];
                                }
                            };
                        }
                    };
                }
            },
            olLayer: {
                get: () => {
                    return "marker_point_layer";
                }
            },
            width: 100,
            height: 100,
            scale: 0.5,
            pixelOffset: "",
            rotation: ""
        };

        it("rotatePointMarkerIn3D with angle 0", () => {
            const getters = {
                    "clickCartesianCoordinate": [0, 0]
                },
                angle = 0,
                rotation = -0,
                pixelOffset = {
                    x: 25,
                    y: -25
                };

            mapCollection.addMap(map3D, "3D");
            actions.rotatePointMarkerIn3D({getters}, angle);
            expect(mapCollection.getMap("3D").getCesiumScene().drillPick()[0].primitive.rotation).to.equal(rotation);
            expect(mapCollection.getMap("3D").getCesiumScene().drillPick()[0].primitive.pixelOffset).to.deep.equal(pixelOffset);
        });
        it("rotatePointMarkerIn3D with angle 90", () => {
            const getters = {
                    "clickCartesianCoordinate": [0, 0]
                },
                angle = 90,
                rotation = -1.5707963267948966,
                pixelOffset = {
                    x: 25,
                    y: 25
                };

            mapCollection.addMap(map3D, "3D");
            actions.rotatePointMarkerIn3D({getters}, angle);
            expect(mapCollection.getMap("3D").getCesiumScene().drillPick()[0].primitive.rotation).to.equal(rotation);
            expect(mapCollection.getMap("3D").getCesiumScene().drillPick()[0].primitive.pixelOffset).to.deep.equal(pixelOffset);
        });
        it("rotatePointMarkerIn3D with angle 180", () => {
            const getters = {
                    "clickCartesianCoordinate": [0, 0]
                },
                angle = 180,
                rotation = -3.141592653589793,
                pixelOffset = {
                    x: 25,
                    y: 25
                };

            mapCollection.addMap(map3D, "3D");
            actions.rotatePointMarkerIn3D({getters}, angle);
            expect(mapCollection.getMap("3D").getCesiumScene().drillPick()[0].primitive.rotation).to.equal(rotation);
            expect(mapCollection.getMap("3D").getCesiumScene().drillPick()[0].primitive.pixelOffset).to.deep.equal(pixelOffset);
        });
        it("rotatePointMarkerIn3D with angle 270", () => {
            const getters = {
                    "clickCartesianCoordinate": [0, 0]
                },
                angle = 270,
                rotation = -4.71238898038469,
                pixelOffset = {
                    x: -25,
                    y: 25
                };

            mapCollection.addMap(map3D, "3D");
            actions.rotatePointMarkerIn3D({getters}, angle);
            expect(mapCollection.getMap("3D").getCesiumScene().drillPick()[0].primitive.rotation).to.equal(rotation);
            expect(mapCollection.getMap("3D").getCesiumScene().drillPick()[0].primitive.pixelOffset).to.deep.equal(pixelOffset);
        });
    });
});
