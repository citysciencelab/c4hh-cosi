<script>
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import Badges from "../../shared/modules/badges/components/Badges.vue";
import CustomCard from "../../shared/modules/cards/components/CustomCard.vue";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import ReportingToolStepItemAddCard from "./ReportingToolStepItemAddCard.vue";
import ReportingToolStepItemSettings from "./ReportingToolStepItemSettings.vue";
import {uniqueId} from "@shared/js/utils/uniqueId";

export default {
    name: "ReportingToolStepItem",
    components: {
        AlertMessage,
        Badges,
        CustomCard,
        DropdownAutocomplete,
        ReportingToolStepItemAddCard,
        ReportingToolStepItemSettings
    },
    props: {
        cardMapping: {
            type: Array,
            required: true
        },
        nothingSelectedText: {
            type: String,
            required: false,
            default: null
        },
        title: {
            type: String,
            required: true
        }
    },
    data () {
        return {
            cards: [],
            isCollapsed: true
        };
    },
    mounted () {
        this.cards = this.cardMapping.map(item => ({...item, id: uniqueId("reporting-tool-card-")}));
    },

    methods: {
        /**
         * Adds a new card to the cards array.
         * @returns {void}
         */
        addCard () {
            this.cards.push({
                id: uniqueId("reporting-tool-card-"),
                name: null
            });
        },

        /**
         * Gets the dropdown items, filtering out those that are not allowed to be added multiple times and are already used.
         * @returns {Array} The filtered dropdown items.
         */
        getDropdownItems () {
            const usedNames = this.cards.map(card => card.name);

            return this.cardMapping.filter(item => {
                if (!item.multiple && usedNames.includes(item.name)) {
                    return false;
                }
                return true;
            }).map(item => item.name);
        },

        /**
         * Updates the attributes of a specific card in the `cards` array by merging it
         * with an object found in the `cardMapping` array that matches the provided value.
         * @param {number} index - The index of the card in the `cards` array to update.
         * @param {string} value - The (card-) name used to find the corresponding object in the `cardMapping` array.
         * @returns {void}
         */
        mergeCardAttributes (index, value) {
            const obj = this.cardMapping.find(item => item.name === value);

            if (typeof obj === "undefined") {
                this.resetCard(index);
                return;
            }
            this.cards[index] = Object.assign({}, this.cards[index], obj);
        },

        /**
         * Removes a card from the cards array at the specified index.
         * @param {Number} index - Index of the card to remove
         * @returns {void}
         */
        removeCard (index) {
            this.cards.splice(index, 1);
        },

        /**
         * Resets the card at the specified index to its initial state.
         * @param {String} index - Index of the card to reset.
         * @returns {void}
         */
        resetCard (index) {
            this.cards[index] = {
                id: this.cards[index].id,
                name: null
            };
        },

        /**
         * Toggles the collapse state.
         * @returns {void}
         */
        toggleCollapse () {
            this.isCollapsed = !this.isCollapsed;
        }
    }
};

</script>
<template lang="html">
    <h5>
        {{ title }}
    </h5>
    <ReportingToolStepItemSettings
        v-if="title.startsWith('2. ')"
    />
    <AlertMessage
        v-if="cards.length === 0 && nothingSelectedText"
        :text="nothingSelectedText"
        type="info"
    />
    <CustomCard
        v-for="(card, index) in cards"
        :key="card.id"
        class="mb-3"
        :icon="card.icon"
        @click:close="removeCard(index)"
    >
        <Badges
            v-if="card.tag"
            class="mb-2"
            :text="card.tag"
            :background-color="card.tagColor"
            :icon="card.icon"
        />
        <DropdownAutocomplete
            :items="getDropdownItems()"
            :label="'Inhalt'"
            :model-value="[card.name]"
            @update:model-value="mergeCardAttributes(index, $event)"
        />
        <div v-if="card.expandable">
            <a
                data-bs-toggle="collapse"
                :data-bs-target="'#collapseOptions' + card.id"
                :href="'#collapseOptions' + card.id"
                aria-expanded="false"
                :aria-controls="'collapseOptions' + card.id"
                @click="toggleCollapse"
            >
                <small>
                    <i
                        class="bi me-2"
                        :class="isCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"
                    />
                    {{ $t(card.expandableLabel) }}
                </small>
            </a>
        </div>
    </CustomCard>
    <ReportingToolStepItemAddCard
        @click="addCard"
    />
</template>
