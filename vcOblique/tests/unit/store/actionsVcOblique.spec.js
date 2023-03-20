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
            expect(dispatch.args[0][0]).to.equal("MapMarker/removePointMarker");
            expect(commit.calledOnce).to.be.true;
            expect(commit.args[0][0]).to.equal("MapMarker/setPointStyleId");
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
});
