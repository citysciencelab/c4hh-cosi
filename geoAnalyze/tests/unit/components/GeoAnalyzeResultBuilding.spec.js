import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import {createStore} from "vuex";
import GeoAnalyzeResultGeometry from "../../../components/GeoAnalyzeResultBuilding.vue";

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
            placingPolygonMarker: sinon.stub(),
            removePolygonMarker: sinon.stub(),
            zoomToExtent: sinon.stub()
        },
        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    actions: mockMapActions
                }
            }
        });
    let spy,
        spyDestroy,
        wrapper;

    beforeAll(() => {
        spy = sinon.spy(GeoAnalyzeResultGeometry.methods, "markAndZoomToBuilding");
        spyDestroy = sinon.spy(GeoAnalyzeResultGeometry.methods, "removePolygonMarker");
        wrapper = shallowMount(GeoAnalyzeResultGeometry, {
            propsData: {
                results
            },
            global: {
                plugins: [store]
            }
        });
    });

    it("should call the function 'markAndZoomToBuilding if component mounted", () => {
        expect(spy.calledOnce).to.be.true;
    });

    it("should call the function 'markAndZoomToBuilding if component updated", async () => {
        await wrapper.setProps({buildingCoordinates: []});
        expect(spy.called).to.be.true;
    });

    it("should render the correct values of the population", () => {
        const population = wrapper.findAll(".population dd");

        expect(population.at(0).text().trim()).to.equal("65");
        expect(population.at(1).text().trim()).to.equal("3");
    });

    it("should render the results-grid with cards", () => {
        expect(wrapper.find(".results-grid").exists()).to.be.true;
        expect(wrapper.findAll(".card").length).to.equal(results.length);
    });

    it("should render the correct labels in the info rows", () => {
        const firstCardLabels = wrapper.findAll(".card").at(0).findAll("dt");

        expect(firstCardLabels.at(0).text().trim()).to.equal("Einwohnerzahl Hauptsitz");
        expect(firstCardLabels.at(1).text().trim()).to.equal("Einwohnerahl Nebensitz");
        expect(firstCardLabels.at(2).text().trim()).to.equal("Obergeschosse");
        expect(firstCardLabels.at(3).text().trim()).to.equal("Erdgeschosse");
        expect(firstCardLabels.at(4).text().trim()).to.equal("Bauweise");
        expect(firstCardLabels.at(5).text().trim()).to.equal("Gebäudefunktion");
        expect(firstCardLabels.at(6).text().trim()).to.equal("Dachform");
    });

    it("should render the correct values in the first card", () => {
        const firstCard = wrapper.findAll(".card").at(0),
            values = firstCard.findAll("dd");

        expect(firstCard.find(".card-title").text().trim()).to.equal(results[0].adresse);
        expect(values.at(0).text().trim()).to.equal(results[0].ew_haupt.toString());
        expect(values.at(1).text().trim()).to.equal(results[0].ew_neben.toString());
        expect(values.at(2).text().trim()).to.equal(results[0].anzahlobergeschosse.toString());
        expect(values.at(3).text().trim()).to.equal(results[0].anzahluntergeschosse.toString());
        expect(values.at(4).text().trim()).to.equal(results[0].bauweise);
        expect(values.at(5).text().trim()).to.equal(results[0].gebaeudefunktion);
        expect(values.at(6).text().trim()).to.equal(results[0].dachform);
    });

    it("should render the correct values in the second card", () => {
        const secondCard = wrapper.findAll(".card").at(1),
            values = secondCard.findAll("dd");

        expect(secondCard.find(".card-title").text().trim()).to.equal(results[1].adresse);
        expect(values.at(0).text().trim()).to.equal(results[1].ew_haupt.toString());
        expect(values.at(1).text().trim()).to.equal(results[1].ew_neben.toString());
        expect(values.at(2).text().trim()).to.equal(results[1].anzahlobergeschosse.toString());
        expect(values.at(3).text().trim()).to.equal(results[1].anzahluntergeschosse.toString());
        expect(values.at(4).text().trim()).to.equal(results[1].bauweise);
        expect(values.at(5).text().trim()).to.equal(results[1].gebaeudefunktion);
        expect(values.at(6).text().trim()).to.equal(results[1].dachform);
    });

    it("should call the function 'removePolygonMarker before component destroyed", async () => {
        wrapper.unmount();
        expect(spyDestroy.calledOnce).to.be.true;
    });
});
