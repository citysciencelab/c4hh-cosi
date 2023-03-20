import {shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import Vuex from "vuex";
import GeoAnalyzeResultGeometry from "../../../components/GeoAnalyzeResultBuilding.vue";

const localVue = createLocalVue();

localVue.use(Vuex);

describe("addons/geoAnalyze/components/GeoAnalyzeResultBuilding.vue", () => {
    const results = [{
            "adresse": "Felix-Dahn-Straße 2",
            "ew_haupt": 38,
            "ew_neben": 3,
            "identifikator": "DEHHALKAV0000XuM",
            "anzahlobergeschosse": 5,
            "anzahluntergeschosse": 1,
            "bauweise": "Gebäudeblock in geschlossener Bauweise",
            "gebaeudefunktion": "Wohnhaus",
            "dachform": "Mansardendach",
            "geom": {
                "type": "Polygon",
                "coordinates": [[[564082.195, 5936181.13], [564073.565, 5936188.12], [564073.112, 5936187.562], [564053.038, 5936203.84], [564053.491, 5936204.399], [564045.033, 5936211.263], [564052.976, 5936221.246], [564059.823, 5936215.761], [564059.982, 5936215.958], [564080.664, 5936199.413], [564081.423, 5936200.367], [564091.258, 5936192.586], [564092.309, 5936191.753], [564090.949, 5936190.033], [564089.896, 5936190.866], [564082.195, 5936181.13]]]
            }
        },
        {
            "adresse": "Felix-Dahn-Straße 4",
            "ew_haupt": 27,
            "ew_neben": 0,
            "identifikator": "DEHHALKAV0000XuM",
            "anzahlobergeschosse": 5,
            "anzahluntergeschosse": 1,
            "bauweise": "Gebäudeblock in geschlossener Bauweise",
            "gebaeudefunktion": "Wohnhaus",
            "dachform": "Mansardendach",
            "geom": {
                "type": "Polygon",
                "coordinates": [[[564082.195, 5936181.13], [564073.565, 5936188.12], [564073.112, 5936187.562], [564053.038, 5936203.84], [564053.491, 5936204.399], [564045.033, 5936211.263], [564052.976, 5936221.246], [564059.823, 5936215.761], [564059.982, 5936215.958], [564080.664, 5936199.413], [564081.423, 5936200.367], [564091.258, 5936192.586], [564092.309, 5936191.753], [564090.949, 5936190.033], [564089.896, 5936190.866], [564082.195, 5936181.13]]]
            }
        }],
        mockMapActions = {
            zoomTo: sinon.stub()
        },
        mockMapMarkerActions = {
            placingPolygonMarkerByGeom: sinon.stub(),
            removePolygonMarker: sinon.stub
        },
        store = new Vuex.Store({
            modules: {
                Maps: {
                    namespaced: true,
                    actions: mockMapActions
                },
                MapMarker: {
                    namespaced: true,
                    actions: mockMapMarkerActions
                }
            }
        });
    let spy,
        spyDestroy,
        wrapper;

    before(() => {
        spy = sinon.spy(GeoAnalyzeResultGeometry.methods, "markAndZoomToBuilding");
        spyDestroy = sinon.spy(GeoAnalyzeResultGeometry.methods, "removePolygonMarker");
        wrapper = shallowMount(GeoAnalyzeResultGeometry, {
            propsData: {
                results
            },
            store,
            localVue
        });
    });

    it("should call the function 'markAndZoomToBuilding if component mounted", () => {
        expect(spy.calledOnce).to.be.true;
    });

    it("should call the function 'markAndZoomToBuilding if component updated", async () => {
        await wrapper.setProps({buildingCoordinates: []});
        expect(spy.calledTwice).to.be.true;
    });

    it("should render the correct values of the population", () => {
        const spanElements = wrapper.findAll("span");

        expect(spanElements.at(0).text()).to.equal("Einwohnerzahl Hauptsitz gesamt: 65");
        expect(spanElements.at(1).text()).to.equal("Einwohnerzahl Nebensitz gesamt: 3");
    });

    it("should render a table", () => {
        expect(wrapper.find("table").exists()).to.be.true;
    });

    it("should render a table with the bootstrap css classes table and table-borderd", () => {
        expect(wrapper.find("table").classes("table")).to.be.true;
        expect(wrapper.find("table").classes("table-bordered")).to.be.true;
    });

    it("should render the correct table header values", () => {
        const thElements = wrapper.findAll("th");

        expect(thElements.at(0).text()).to.equal("Adresse");
        expect(thElements.at(1).text()).to.equal("Einwohnerzahl Hauptsitz");
        expect(thElements.at(2).text()).to.equal("Einwohnerahl Nebensitz");
        expect(thElements.at(3).text()).to.equal("Obergeschosse");
        expect(thElements.at(4).text()).to.equal("Erdgeschosse");
        expect(thElements.at(5).text()).to.equal("Bauweise");
        expect(thElements.at(6).text()).to.equal("Gebäudefunktion");
        expect(thElements.at(7).text()).to.equal("Dachform");
    });

    it("should render the correct table cell values", () => {
        const tdElements = wrapper.findAll("td");

        expect(tdElements.at(0).text()).to.equal(results[0].adresse);
        expect(tdElements.at(1).text()).to.equal(results[1].adresse);
        expect(tdElements.at(2).text()).to.equal(results[0].ew_haupt.toString());
        expect(tdElements.at(3).text()).to.equal(results[1].ew_haupt.toString());
        expect(tdElements.at(4).text()).to.equal(results[0].ew_neben.toString());
        expect(tdElements.at(5).text()).to.equal(results[1].ew_neben.toString());
        expect(tdElements.at(6).text()).to.equal(results[0].anzahlobergeschosse.toString());
        expect(tdElements.at(7).text()).to.equal(results[1].anzahlobergeschosse.toString());
        expect(tdElements.at(8).text()).to.equal(results[0].anzahluntergeschosse.toString());
        expect(tdElements.at(9).text()).to.equal(results[1].anzahluntergeschosse.toString());
        expect(tdElements.at(10).text()).to.equal(results[1].bauweise);
        expect(tdElements.at(11).text()).to.equal(results[0].bauweise);
        expect(tdElements.at(12).text()).to.equal(results[1].gebaeudefunktion);
        expect(tdElements.at(13).text()).to.equal(results[0].gebaeudefunktion);
        expect(tdElements.at(14).text()).to.equal(results[1].dachform);
        expect(tdElements.at(15).text()).to.equal(results[0].dachform);
    });

    it("should call the function 'removePolygonMarker before component destroyed", async () => {
        wrapper.destroy();
        expect(spyDestroy.calledOnce).to.be.true;
    });
});
