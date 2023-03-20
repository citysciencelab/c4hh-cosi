<script>
import PiechartItem from "../../../../src/share-components/charts/components/PiechartItem.vue";
import {convertColor} from "../../../../src/utils/convertColor";
import thousandsSeparator from "../../../../src/utils/thousandsSeparator";

export default {
    name: "BildungsatlasThemeOKJA",
    components: {
        PiechartItem
    },
    props: {
        /**
         * checks if the given tab name is currently active
         * @param {String} tab the tab name
         * @returns {Boolean}  true if the given tab name is active
         */
        isActiveTab: {
            type: Function,
            required: true
        },

        /**
         * translates the given key, checkes if the key exists and throws a console warning if not
         * @param {String} key the key to translate
         * @param {Object} [options=null] for interpolation, formating and plurals
         * @returns {String} the translation or the key itself on error
         */
        translate: {
            type: Function,
            required: true
        },

        /**
         * the properties as a key value object
         */
        properties: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            bez_einrichtung: "",
            adresse: "",
            ort: "",
            typ_der_einrichtung: "",
            durchsch_stammnutzer: "",
            angebotsstunden_pro_jahr: "",

            // "Nein" is a database flag, not a german word
            kinder_0_bis_unter3_jahre: "Nein",
            kinder_3_bis_unter_6_jahre: "Nein",
            kinder_6_bis_unter_10_jahre: "Nein",
            kinder_10_bis_unter_14_jahre: "Nein",
            jugendliche_14_bis_unter_18_jahre: "Nein",
            junge_erwachsene_18_bis_unter_27_jahre: "Nein",

            piechart_opening: false,
            piechart_opening_options: {
                aspectRatio: 1.7,
                tooltips: {
                    callbacks: {
                        label: (tooltipItem, data) => {
                            return data.labels[tooltipItem.index] + ": " + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + "%";
                        }
                    }
                }
            },

            piechart_offers: false,
            piechart_offers_options: {
                aspectRatio: 1,
                tooltips: {
                    callbacks: {
                        label: (tooltipItem, data) => {
                            return data.labels[tooltipItem.index] + ": " + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + "%";
                        }
                    }
                }
            }
        };
    },
    watch: {
        // when the gfi window is switched, the gfi is refreshed
        properties: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    this.refreshGfi();
                }
            },
            immediate: true
        }
    },
    mounted () {
        this.refreshGfi();
    },
    methods: {
        /**
         * refreshes the gfi
         * @returns {void}
         */
        refreshGfi () {
            this.refreshGfiHeader();
            this.refreshGfiTable();
            this.refreshGfiPiechartOpening();
            this.refreshGfiPiechartOffers();
        },

        /**
         * refreshes the okja header of the gfi
         * @returns {void}
         */
        refreshGfiHeader () {
            this.bez_einrichtung = this.properties?.bez_einrichtung ? this.properties.bez_einrichtung : "g.F.";
            this.adresse = this.properties?.adresse ? this.properties.adresse : "g.F.";
            this.ort = this.properties?.ort ? this.properties.ort : "g.F.";
            this.typ_der_einrichtung = this.properties?.typ_der_einrichtung ? this.properties.typ_der_einrichtung : "g.F.";
            this.durchsch_stammnutzer = this.properties?.durchsch_stammnutzer ? thousandsSeparator(this.properties.durchsch_stammnutzer) : "g.F.";
            this.angebotsstunden_pro_jahr = this.properties?.angebotsstunden_pro_jahr ? thousandsSeparator(this.properties.angebotsstunden_pro_jahr) : "g.F.";
        },

        /**
         * refreshes the table with offerings for target groups
         * @returns {void}
         */
        refreshGfiTable () {
            this.kinder_0_bis_unter3_jahre = this.properties?.kinder_0_bis_unter3_jahre === "Ja" ? "Ja" : "Nein";
            this.kinder_3_bis_unter_6_jahre = this.properties?.kinder_3_bis_unter_6_jahre === "Ja" ? "Ja" : "Nein";
            this.kinder_6_bis_unter_10_jahre = this.properties?.kinder_6_bis_unter_10_jahre === "Ja" ? "Ja" : "Nein";
            this.kinder_10_bis_unter_14_jahre = this.properties?.kinder_10_bis_unter_14_jahre === "Ja" ? "Ja" : "Nein";
            this.jugendliche_14_bis_unter_18_jahre = this.properties?.jugendliche_14_bis_unter_18_jahre === "Ja" ? "Ja" : "Nein";
            this.junge_erwachsene_18_bis_unter_27_jahre = this.properties?.junge_erwachsene_18_bis_unter_27_jahre === "Ja" ? "Ja" : "Nein";
        },

        /**
         * refreshes the piechart with the distributions of opening hours
         * @returns {void}
         */
        refreshGfiPiechartOpening () {
            if (
                this.properties?.montag_bis_freitag_tagsueber
                || this.properties?.montag_bis_freitag_abendoeffnung
                || this.properties?.wochenende_tagsueber
                || this.properties?.wochenende_abendoeffnung
            ) {
                this.piechart_opening = {
                    labels: [
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_opening.weekdaysAfternoon"),
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_opening.weekdaysEvening"),
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_opening.weekendsAfternoon"),
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_opening.weekendsEvening")
                    ],
                    datasets: [{
                        data: [
                            this.properties?.montag_bis_freitag_tagsueber ? this.properties.montag_bis_freitag_tagsueber : 0,
                            this.properties?.montag_bis_freitag_abendoeffnung ? this.properties.montag_bis_freitag_abendoeffnung : 0,
                            this.properties?.wochenende_tagsueber ? this.properties.wochenende_tagsueber : 0,
                            this.properties?.wochenende_abendoeffnung ? this.properties.wochenende_abendoeffnung : 0
                        ],
                        backgroundColor: [
                            convertColor([0, 48, 99, 1], "rgbaString"),
                            convertColor([46, 127, 210, 1], "rgbaString"),
                            convertColor([255, 130, 102, 1], "rgbaString"),
                            convertColor([255, 217, 102, 1], "rgbaString")
                        ]
                    }]
                };
            }
        },

        /**
         * refreshes the piechart with the distribution of the content of the offer
         * @returns {void}
         */
        refreshGfiPiechartOffers () {
            if (
                this.properties?.allgemeine_und_soziale_bildung
                || this.properties?.politische_bildung
                || this.properties?.kulturelle_bildung
                || this.properties?.naturkundliche_bildung
                || this.properties?.technische_bildung
                || this.properties?.interkulturelle_arbeit_und_integration
                || this.properties?.sport_spiel_geselligkeit
                || this.properties?.erzieherischer_kinder_und_jugendschutz
                || this.properties?.jugendsozialarbeit
                || this.properties?.gesundheitsfoerderung
                || this.properties?.sonstige_gruppenangebote
                || this.properties?.foerderung_der_medienkompetenz
            ) {
                this.piechart_offers = {
                    labels: [
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_offers.allgemeine_und_soziale_bildung"),
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_offers.politische_bildung"),
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_offers.kulturelle_bildung"),
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_offers.naturkundliche_bildung"),
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_offers.technische_bildung"),
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_offers.interkulturelle_arbeit_und_integration"),
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_offers.sport_spiel_geselligkeit"),
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_offers.erzieherischer_kinder_und_jugendschutz"),
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_offers.jugendsozialarbeit"),
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_offers.gesundheitsfoerderung"),
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_offers.sonstige_gruppenangebote"),
                        this.translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_offers.foerderung_der_medienkompetenz")
                    ],
                    datasets: [{
                        data: [
                            this.properties?.allgemeine_und_soziale_bildung ? this.properties.allgemeine_und_soziale_bildung : 0,
                            this.properties?.politische_bildung ? this.properties.politische_bildung : 0,
                            this.properties?.kulturelle_bildung ? this.properties.kulturelle_bildung : 0,
                            this.properties?.naturkundliche_bildung ? this.properties.naturkundliche_bildung : 0,
                            this.properties?.technische_bildung ? this.properties.technische_bildung : 0,
                            this.properties?.interkulturelle_arbeit_und_integration ? this.properties.interkulturelle_arbeit_und_integration : 0,
                            this.properties?.sport_spiel_geselligkeit ? this.properties.sport_spiel_geselligkeit : 0,
                            this.properties?.erzieherischer_kinder_und_jugendschutz ? this.properties.erzieherischer_kinder_und_jugendschutz : 0,
                            this.properties?.jugendsozialarbeit ? this.properties.jugendsozialarbeit : 0,
                            this.properties?.gesundheitsfoerderung ? this.properties.gesundheitsfoerderung : 0,
                            this.properties?.sonstige_gruppenangebote ? this.properties.sonstige_gruppenangebote : 0,
                            this.properties?.foerderung_der_medienkompetenz ? this.properties.foerderung_der_medienkompetenz : 0
                        ],
                        backgroundColor: [
                            convertColor([0, 48, 99, 1], "rgbaString"),
                            convertColor([46, 127, 210, 1], "rgbaString"),
                            convertColor([255, 88, 51, 1], "rgbaString"),
                            convertColor([255, 230, 153, 1], "rgbaString"),
                            convertColor([13, 86, 163, 1], "rgbaString"),
                            convertColor([255, 172, 153, 1], "rgbaString"),
                            convertColor([149, 149, 149, 1], "rgbaString"),
                            convertColor([63, 63, 63, 1], "rgbaString"),
                            convertColor([255, 217, 102, 1], "rgbaString"),
                            convertColor([26, 106, 189, 1], "rgbaString"),
                            convertColor([255, 130, 102, 1], "rgbaString"),
                            convertColor([4, 66, 132, 1], "rgbaString")
                        ]
                    }]
                };
            }
        }
    }
};
</script>

<template>
    <div class="gfi-bildungsatlas-current-content">
        <div
            v-if="isActiveTab('data')"
            class="gfi-data"
        >
            <div class="rba_header">
                <div class="rba_header_title">
                    {{ bez_einrichtung }}
                </div>
                <div class="rba_header_text">
                    {{ adresse }}
                    <br>
                    {{ ort }}
                </div>
            </div>
            <div class="rba_table">
                <table>
                    <tbody>
                        <tr>
                            <td>
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.typ_der_einrichtung") }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ typ_der_einrichtung }}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.durchsch_stammnutzer") }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ durchsch_stammnutzer }}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.angebotsstunden_pro_jahr") }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ angebotsstunden_pro_jahr }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="rba_table">
                <table>
                    <thead>
                        <tr>
                            <th colspan="2">
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.table.title") }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.table.kinder_0_bis_unter3_jahre") }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.table." + kinder_0_bis_unter3_jahre) }}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.table.kinder_3_bis_unter_6_jahre") }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.table." + kinder_3_bis_unter_6_jahre) }}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.table.kinder_6_bis_unter_10_jahre") }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.table." + kinder_6_bis_unter_10_jahre) }}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.table.kinder_10_bis_unter_14_jahre") }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.table." + kinder_10_bis_unter_14_jahre) }}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.table.jugendliche_14_bis_unter_18_jahre") }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.table." + jugendliche_14_bis_unter_18_jahre) }}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.table.junge_erwachsene_18_bis_unter_27_jahre") }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.table." + junge_erwachsene_18_bis_unter_27_jahre) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="rba_chart">
                <div class="rba_chart_title">
                    {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_opening.title") }}
                </div>
                <div
                    v-if="piechart_opening"
                    class="rba_chart_content piechart_opening"
                >
                    <PiechartItem
                        :given-options="piechart_opening_options"
                        :data="piechart_opening"
                    />
                </div>
                <div
                    v-else
                    class="rba_chart_content"
                >
                    g.F.
                </div>
            </div>
            <div class="rba_chart">
                <div class="rba_chart_title">
                    {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.piechart_offers.title") }}
                </div>
                <div
                    v-if="piechart_offers"
                    class="rba_chart_content piechart_offers"
                >
                    <PiechartItem
                        :given-options="piechart_offers_options"
                        :data="piechart_offers"
                    />
                </div>
                <div
                    v-else
                    class="rba_chart_content"
                >
                    g.F.
                </div>
            </div>
            <div class="rba_footer">
                <p>
                    {{ $t("additional:addons.gfiThemes.bildungsatlas.general.disclaimer") }}
                </p>
            </div>
        </div>
        <div
            v-if="isActiveTab('info')"
            class="gfi-info"
        >
            <h6>
                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.info.title") }}
            </h6>
            <p>
                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.info.textA") }}
            </p>
            <p>
                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.info.textB") }}
            </p>
            <p>
                {{ translate("additional:addons.gfiThemes.bildungsatlas.okja.info.textC") }}
            </p>
        </div>
    </div>
</template>
