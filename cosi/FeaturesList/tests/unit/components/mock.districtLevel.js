import Layer from "ol/layer/Vector.js";
import Source from "ol/source/Vector.js";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";

const feature = new Feature({
        id: "123",
        statgebiet: "Wolkenkuckucksheim",
        geometry: new Polygon([
            [
                [
                    10.051116943359375,
                    53.592504809039376
                ],
                [
                    10.030517578125,
                    53.53214572511981
                ],
                [
                    10.136260986328125,
                    53.528880618043225
                ],
                [
                    10.139007568359375,
                    53.585168439492456
                ],
                [
                    10.051116943359375,
                    53.592504809039376
                ]
            ]
        ])
    }),
    layer = new Layer({
        source: new Source({
            features: [feature]
        })
    }),
    district = {
        "adminFeature": feature,
        "statFeatures": [],
        "originalStatFeatures": [],
        "isSelected": true,
        getId: () => "123",
        getName: () => "Wolkenkuckucksheim",
        getLabel: () => "Wolkenkuckucksheim (Bezirk)"
    };

export default {
    "layerId": "6071",
    "label": "Statistische Gebiete",
    "keyOfAttrName": "statgebiet",
    "stats": {
        "keyOfAttrName": "statgebiet",
        "baseUrl": [
            "https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Statistische_Gebiete"
        ]
    },
    "referenceLevel": null,
    "layer": layer,
    "nameList": [
        "Wolkenkuckucksheim"
    ],
    "propertyNameList": [],
    "featureTypes": [
        [
            "v_hh_statistik_bev_insgesamt",
            "v_hh_statistik_bev_maennlich",
            "v_hh_statistik_bev_weiblich",
            "v_hh_statistik_arb_alg2_empfaenger_15_bis_u65_proz",
            "v_hh_statistik_arb_alg2_empfaenger_insgesamt_anz",
            "v_hh_statistik_arb_alg2_empfaenger_insgesamt_proz",
            "v_hh_statistik_arb_alg_empfaenger_15_bis_u65_proz",
            "v_hh_statistik_arb_alg_empfaenger_insgesamt_anz",
            "v_hh_statistik_arb_alg_empfaenger_insgesamt_proz",
            "v_hh_statistik_arb_arbeitslose_15_bis_u65_proz",
            "v_hh_statistik_arb_arbeitslose_ingesamt_anz",
            "v_hh_statistik_arb_arbeitslose_ingesamt_proz",
            "v_hh_statistik_bev_10_bis_u15",
            "v_hh_statistik_bev_15_bis_u21",
            "v_hh_statistik_bev_15_bis_u65",
            "v_hh_statistik_bev_21_bis_u45",
            "v_hh_statistik_bev_45_bis_u65",
            "v_hh_statistik_bev_6_bis_u10",
            "v_hh_statistik_bev_ab65",
            "v_hh_statistik_bev_auslaender_anz",
            "v_hh_statistik_bev_auslaender_proz",
            "v_hh_statistik_bev_migrationshintergrund_anz",
            "v_hh_statistik_bev_migrationshintergrund_proz",
            "v_hh_statistik_bev_u18",
            "v_hh_statistik_bev_u6",
            "v_hh_statistik_flaeche_brutto_ha",
            "v_hh_statistik_flaeche_einw_pro_ha",
            "v_hh_statistik_gsa_anteil_bev_65_und_aelter_proz",
            "v_hh_statistik_gsa_empfaenger_grundsicherung_65_und_aelter_anz",
            "v_hh_statistik_hau_alleinerziehende_anz",
            "v_hh_statistik_hau_alleinerziehende_proz",
            "v_hh_statistik_hau_einpersonenhaushalte_anz",
            "v_hh_statistik_hau_einpersonenhaushalte_proz",
            "v_hh_statistik_hau_haushalte_mit_kindern_anz",
            "v_hh_statistik_hau_haushalte_mit_kindern_proz",
            "v_hh_statistik_hau_haushaltgroesse_avg",
            "v_hh_statistik_hau_privathaushalte_anz",
            "v_hh_statistik_sgb_anteil_an_bev_15_bis_u25_proz",
            "v_hh_statistik_sgb_anteil_an_bev_u15_proz",
            "v_hh_statistik_sgb_anteil_an_der_ausl_bev_erw_15_bis_u65_proz",
            "v_hh_statistik_sgb_anteil_an_der_bev_15_bis_u65_proz",
            "v_hh_statistik_sgb_anteil_an_der_bevoelkerung_ins_proz",
            "v_hh_statistik_sgb_auslaend_erwerbsf_leistungsempfaenger_anz",
            "v_hh_statistik_sgb_bedarfsgemeinschaften_anz",
            "v_hh_statistik_sgb_erwerbsfaehige_lstempfaenger_anz",
            "v_hh_statistik_sgb_jugendl_lstempfaenger_15_bis_u25_anz",
            "v_hh_statistik_sgb_leistungsempfaenger_anz",
            "v_hh_statistik_sgb_nicht_erwebsf_lstempfaenger_u15_anz",
            "v_hh_statistik_soz_sozverpflichtig_besch_frauen_15_bis_u65_ant",
            "v_hh_statistik_soz_sozverpflichtig_besch_maenner_15_bis_u65_ant",
            "v_hh_statistik_soz_sozverpflichtig_beschaeftigte_15_bis_u65_ant",
            "v_hh_statistik_soz_sozverpflichtig_beschaeftigte_frauen",
            "v_hh_statistik_soz_sozverpflichtig_beschaeftigte_ins_anz",
            "v_hh_statistik_soz_sozverpflichtig_beschaeftigte_maenner",
            "v_hh_statistik_ver_anteil_pkw_schadstkl_4_bis_6_gruene_pl_proz",
            "v_hh_statistik_ver_gewerbl_pkw_anz",
            "v_hh_statistik_ver_pkw_bestand_ins_anz",
            "v_hh_statistik_ver_private_pkw_anz",
            "v_hh_statistik_ver_private_pkw_je_1000_ew_anz",
            "v_hh_statistik_wohn_mit_bindungsauslauf_anz",
            "v_hh_statistik_wohn_sozialwohnungen_ins_anz",
            "v_hh_statistik_wohn_wohngebaeude_anz",
            "v_hh_statistik_wohn_wohnungen_in_wohn_und_nichtwohngebauede_anz"
        ]
    ],
    "districts": [
        district
    ]
};

