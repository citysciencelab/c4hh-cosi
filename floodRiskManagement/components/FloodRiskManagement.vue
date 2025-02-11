<script>
import AccordionItem from "../../../src/shared/modules/accordion/components/AccordionItem.vue";
import FlatButton from "../../../src/shared/modules/buttons/components/FlatButton.vue";
import FloodRiskManagementCard from "../components/FloodRiskManagementCard.vue";
import FloodRiskManagementSwitcher from "../components/FloodRiskManagementSwitcher.vue";
import {mapGetters, mapMutations} from "vuex";
import SwitchInput from "../../../src/shared/modules/checkboxes/components/SwitchInput.vue";
export default {
    name: "FloodRiskManagement",
    components: {
        AccordionItem,
        FlatButton,
        FloodRiskManagementCard,
        FloodRiskManagementSwitcher,
        SwitchInput
    },
    data () {
        return {
            scaleList: ["1:250", "1:1000", "1:5000", "1:60000"],
            cycles: ["1. Zyklus", "2. Zyklus", "3. Zyklus"],
            types: [
                {
                    type: "Hochwassergefahrenkarte",
                    text: "Die Gefahrenkarten stellen das Ausmaß der Hochwasserereignisse in Form der Ausdehnung und der sich einstellenden Wassertiefen dar.",
                    icon: "bi bi-water"
                },
                {
                    type: "Hochwasserrisikokarte",
                    text: "Die Risikokarten zeigen, wie die betroffenen Flächen genutzt werden, die Lage von Industrieanlagen und Schutzgütern sowie die Anzahl der potenziell betroffenen Einwohner.",
                    icon: "bi bi-buildings"
                }
            ],
            events: {
                "Flusshochwasser": {
                    "häufig": "10-jährliches Ereignis (H für High)",
                    "mittel": "100-jährliches Ereignis (M für Middle)",
                    "selten": "200-jährliches Ereignis (L für Low)"
                },
                "Küstenhochwasser": {
                    "häufig": "20-jährliches Ereignis (H für High)",
                    "mittel": "100-jährliches Ereignis (M für Middle)",
                    "selten": "Extremereignis (L für Low)"
                }
            }
        };
    },
    computed: {
        ...mapGetters("Modules/FloodRiskManagement", [
            "selectedEvent",
            "selectedType",
            "selectedCycle",
            "selectedFrequency"
        ]),

        floodevent () {
            return this.selectedEvent ? Object.entries(this.events[this.selectedEvent]) : "";
        }
    },
    mounted () {
        !this.selectedEvent ? this.setSelectedEvent(Object.keys(this.events)[0]) : "";
        !this.selectedType ? this.setSelectedType(this.types[0].type) : "";
        !this.selectedCycle ? this.setSelectedCycle(this.cycles[this.cycles.length - 1]) : "";
        !this.selectedFrequency ? this.setSelectedFrequency(Object.keys(this.events[this.selectedEvent])[0]) : "";
    },
    methods: {
        ...mapMutations("Modules/FloodRiskManagement", [
            "setSelectedEvent",
            "setSelectedType",
            "setSelectedCycle",
            "setSelectedFrequency"
        ])
    }
};
</script>

<template lang="html">
    <div
        id="tool-FloodRiskManagement"
        class="flood-risk-management position-relative"
    >
        <h5>
            {{ $t('additional:modules.floodRiskManagement.subtitle') }}
        </h5>
        <AccordionItem
            id="info-accordion"
            :title="$t('additional:modules.floodRiskManagement.information')"
            icon="bi bi-exclamation-circle"
        >
            <span> {{ $t('additional:modules.floodRiskManagement.informationText') }} </span>
        </AccordionItem>
        <div class="cycle-section">
            <h5>
                {{ $t('additional:modules.floodRiskManagement.headline.cycle') }}
            </h5>
            <FloodRiskManagementSwitcher
                class="cycle-switch"
                :buttons="cycles"
                :group="`cycle-group`"
                :selected-value="selectedCycle"
                @setSelectedElement="setSelectedCycle"
            />
            <div class="maptype-section mt-4">
                <h5>
                    {{ $t('additional:modules.floodRiskManagement.headline.mapType') }}
                </h5>
                <span class="small-text">
                    {{ $t('additional:modules.floodRiskManagement.mapInformation') }}
                </span>
                <div class="container">
                    <div class="row pt-2">
                        <FloodRiskManagementCard
                            v-for="(card, idx) in types"
                            id="map-type"
                            :key="idx"
                            class="col col-xs-12 mt-2 mx-2"
                            :icon="card.icon"
                            :title="card.type"
                            :text="card.text"
                            :selected-card="selectedType"
                            @setSelected="setSelectedType"
                        />
                    </div>
                </div>
            </div>
            <div class="flood-event-section mt-4">
                <h5>
                    {{ $t('additional:modules.floodRiskManagement.headline.floodEvent') }}
                </h5>
                <FloodRiskManagementSwitcher
                    class="event-switch"
                    :buttons="Object.keys(events)"
                    :group="`events-group`"
                    :selected-value="selectedEvent"
                    @setSelectedElement="setSelectedEvent"
                />
            </div>
            <div class="frequency-event-section py-4">
                <h5>
                    {{ $t('additional:modules.floodRiskManagement.headline.frequencyFloodEvents') }}
                </h5>
                <div>
                    <div class="container">
                        <div class="row pt-2">
                            <FloodRiskManagementCard
                                v-for="(card, idx) in floodevent"
                                id="card-Frequency"
                                :key="idx"
                                class="col col-xs-12 mt-2 mx-2 pt-4"
                                :title="card[0]"
                                :text="card[1]"
                                :selected-card="selectedFrequency"
                                @setSelected="setSelectedFrequency"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div
                class="form-floating scale mt-4"
            >
                <select
                    id="printScale"
                    class="form-select"
                >
                    <option
                        v-for="(scale, i) in scaleList"
                        :key="i"
                        :value="scale"
                    >
                        {{ scale }}
                    </option>
                </select>
                <label for="printScale">
                    {{ $t('additional:modules.floodRiskManagement.label.scaleLabel') }}
                </label>
            </div>
            <div
                class="form-check form-switch mt-3 mb-3 d-flex align-items-center"
            >
                <SwitchInput
                    :id="'autoAdjustScale'"
                    :aria="$t('additional:modules.floodRiskManagement.label.autoAdjustScale')"
                    :label="$t('additional:modules.floodRiskManagement.label.autoAdjustScale')"
                />
            </div>
            <div class="form-group form-group-sm row">
                <div class="col-md-12 d-flex justify-content-center">
                    <FlatButton
                        id="settingsBtn"
                        class="pe-2"
                        :aria-label="$t('additional:modules.floodRiskManagement.button.applyLabel')"
                        :text="$t('additional:modules.floodRiskManagement.button.applyLabel')"
                        :icon="'bi bi-check-all'"
                    />
                </div>
                <div class="col-md-12 d-flex justify-content-center">
                    <FlatButton
                        id="printBtn"
                        :aria-label="$t('additional:modules.floodRiskManagement.button.printLabel')"
                        :text="$t('additional:modules.floodRiskManagement.button.printLabel')"
                        :icon="'bi bi-printer'"
                    />
                </div>
            </div>
        </div>
    </div>
</template>


<style lang="scss" scoped>
@import "~variables";
    .small-text {
        font-size: $font_size_sm;
    }
</style>

