<script>
import AddCardButton from "../../shared/modules/cards/components/AddCardButton.vue";
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import Badges from "../../shared/modules/badges/components/Badges.vue";
import CustomCard from "../../shared/modules/cards/components/CustomCard.vue";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import ReportingToolStepItemSettings from "./ReportingToolStepItemSettings.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {uniqueId} from "@shared/js/utils/uniqueId";
import {VueDraggableNext} from "vue-draggable-next";

export default {
    name: "ReportingToolStepItem",
    components: {
        AddCardButton,
        AlertMessage,
        Badges,
        CustomCard,
        DropdownAutocomplete,
        ReportingToolStepItemSettings,
        IconButton,
        InputText,
        Draggable: VueDraggableNext
    },
    props: {
        cardMapping: {
            type: Array,
            required: true
        },
        groups: {
            type: Array,
            required: false,
            default: null
        },
        nothingSelectedText: {
            type: String,
            required: false,
            default: null
        },
        selectedAreasName: {
            type: String,
            required: false,
            default: ""
        },
        title: {
            type: String,
            required: true
        }
    },
    emits: ["setCards", "setOrderOfCards", "update:selected-areas-name", "update:statistical-year"],
    data () {
        return {
            activelyClosedNonMultipleCardNames: [],
            cards: [],
            isCollapsed: false
        };
    },
    computed: {

        /**
         * Computed dropdown items, filtering out those that are not allowed to be added multiple times and are already used.
         * @returns {String[]} The filtered dropdown items.
         */
        dropdownItems () {
            const usedNames = this.cards.map(card => card.name),
                filteredCardTypes = this.cardMapping.filter(cardType => cardType.multiple || !usedNames.includes(cardType.name)),
                dropdownItems = [];

            filteredCardTypes.forEach(cardType => {
                if (Array.isArray(cardType.items)) {
                    const filteredItems = cardType.items.filter(item => cardType.multiple || !usedNames.includes(item.inputs.title));

                    filteredItems.forEach(item => {
                        dropdownItems.push(item.inputs.title);
                    });
                }
                else {
                    dropdownItems.push(cardType.name);
                }
            });
            return dropdownItems;
        },

        draggableCards: {
            get () {
                return this.groups;
            },
            set (newValue) {
                this.$emit("setOrderOfCards", newValue);
            }
        }
    },
    watch: {
        cards: {
            deep: true,
            handler (newCards) {
                this.$emit("setCards", newCards);
            }
        },
        cardMapping: {
            deep: true,
            handler (newCardMapping) {
                this.syncCardsWithMapping(newCardMapping);
            }
        }
    },
    mounted () {
        this.initializeCards();
    },
    methods: {
        /**
         * Syncs the currently selected cards with the available card mapping.
         * This is required because the internal `cards` array is initialized on mount,
         * but the allowed `cardMapping` can change dynamically (e.g. legend becomes unavailable).
         *
         * Cards that are no longer part of the mapping will be removed while preserving
         * the order and the user's remaining selections.
         *
         * @param {Object[]} newCardMapping - The updated card mapping.
         * @returns {void}
         */
        syncCardsWithMapping (newCardMapping) {
            if (!Array.isArray(newCardMapping)) {
                return;
            }

            const allowedPairs = [];
            let filteredCards = [];

            newCardMapping.forEach(cardType => {
                if (Array.isArray(cardType?.items)) {
                    cardType.items.forEach(item => {
                        allowedPairs.push({key: cardType.key, name: item?.inputs?.title});
                    });
                }
                else {
                    allowedPairs.push({key: cardType?.key, name: cardType?.name});
                }
            });

            /**
             * Checks whether a card is still allowed based on the current card mapping.
             * Placeholder cards without a key are always allowed.
             *
             * @param {Object} card - The card to validate.
             * @returns {boolean} True if the card is allowed, otherwise false.
             */
            function isAllowed (card) {
                if (!card?.key && card?.name === null) {
                    return true;
                }

                return allowedPairs.some(({key, name}) => {
                    if (typeof key !== "undefined" && card?.key !== key) {
                        return false;
                    }
                    if (typeof name === "undefined" || name === null) {
                        return true;
                    }
                    return card?.name === name;
                });
            }

            filteredCards = Array.isArray(this.cards) ? this.cards.filter(isAllowed) : [];

            if (filteredCards.length !== this.cards.length) {
                this.cards = filteredCards;
            }
        },

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
         * Initializes the cards array based on the cardMapping prop,
         * excluding certain card types as well as cards that have been actively closed.
         * @returns {void}
         */
        initializeCards () {
            this.cards = [];
            this.cardMapping.forEach(cardType => {
                if (cardType.key === "textArea" || cardType.key === "heading") {
                    return;
                }
                if (Array.isArray(cardType.items)) {
                    cardType.items.forEach(item => {
                        if (this.activelyClosedNonMultipleCardNames.includes(item.inputs.title)) {
                            return;
                        }
                        this.cards.push({...cardType, name: item.inputs.title, id: uniqueId("reporting-tool-card-")});
                    });
                    return;
                }
                this.cards.push({...cardType, id: uniqueId("reporting-tool-card-")});
            });
        },

        /**
         * Updates the attributes of a specific card in the `cards` array by merging it
         * with an object found in the `cardMapping` array that matches the provided value.
         * @param {number} index - The index of the card in the `cards` array to update.
         * @param {string} value - The (card-) name used to find the corresponding object in the `cardMapping` array.
         * @returns {void}
         */
        mergeCardAttributes (index, value) {
            const obj = this.cardMapping.find(item => item.name === value)
                || this.cardMapping
                    .find(cardType => Array.isArray(cardType.items)
                        && cardType.items.some(subItem => subItem.inputs.title === value));

            if (typeof obj === "undefined") {
                this.resetCard(index);
                return;
            }
            this.cards[index] = Object.assign({}, this.cards[index], obj);
            if (Array.isArray(obj?.items)) {
                this.cards[index].name = value;
            }
        },

        /**
         * Removes a card from the cards array at the specified index.
         * @param {Number} index - Index of the card to remove
         * @param {Object} card - The card object to remove
         * @returns {void}
         */
        removeCard (index, card) {
            this.cards.splice(index, 1);
            if (!card.multiple) {
                this.activelyClosedNonMultipleCardNames.push(card.name);
            }
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
        },

        /**
         * Updates the order of the cards depending on user input.
         * @param {String} id - the id of the current card.
         * @param {String} upOrDown - indicates whether the user clicked up or down.
         * @returns {void}
         */
        updateCardOrder (id, upOrDown) {
            const indexFrom = this.cards.findIndex(x => x.id === id),
                indexTo = upOrDown === "down" ? indexFrom + 1 : indexFrom - 1;

            [this.cards[indexFrom], this.cards[indexTo]] = [this.cards[indexTo], this.cards[indexFrom]];
        },

        /**
         * Sets the value of a card.
         * @param {String} value - The new value for the card.
         * @param {Object} card - The card object to update.
         * @returns {void}
         */
        setCardValue (value, card) {
            card.value = value;
        }
    }
};

</script>
<template lang="html">
    <h5 class="pb-2">
        {{ title }}
    </h5>
    <slot name="additional-settings" />
    <ReportingToolStepItemSettings
        v-if="title.startsWith('2. ') && !(cards.length === 0 && nothingSelectedText)"
        class="pb-5"
        :selected-areas-name="selectedAreasName"
        @update:selected-areas-name="$emit('update:selected-areas-name', $event)"
        @update:statistical-year="$emit('update:statistical-year', $event)"
    />
    <AlertMessage
        v-if="cards.length === 0 && nothingSelectedText"
        :text="nothingSelectedText"
        type="info"
    />
    <div class="container px-4">
        <div
            v-for="(card, index) in cards"
            :key="card.id"
            class="cards row align-items-center d-flex flex-nowrap justify-content-center mb-3"
            :class="[cards.length > 1 ? 'justify-content-end' : 'justify-content-center']"
        >
            <div
                v-if="cards.length > 1"
                class="col-auto d-flex flex-nowrap me-2 me-md-3"
            >
                <div
                    class="row d-flex justify-content-center gap-0 gap-sm-1 gap-md-2"
                    :class="index === cards.length - 1 ? 'flex-row-reverse' : ''"
                >
                    <IconButton
                        class="order-button-up col-auto p-0"
                        :aria="$t('additional:modules.cosi.reportingTool.label.up')"
                        :icon="'bi bi-arrow-up'"
                        :interaction="() => updateCardOrder(card.id, 'up')"
                        :class-array="['btn-light', 'border border-dark-subtle', index == 0 ? 'invisible' : '']"
                    />
                    <IconButton
                        class="order-button-down col-auto p-0"
                        :aria="$t('additional:modules.cosi.reportingTool.label.down')"
                        :icon="'bi bi-arrow-down'"
                        :interaction="() => updateCardOrder(card.id, 'down')"
                        :class-array="['btn-light', 'border border-dark-subtle', index == cards.length - 1 ? 'invisible' : '']"
                    />
                </div>
            </div>
            <CustomCard
                class="mb-3 d-flex flex-nowrap"
                :class="[cards.length > 1 ? 'col col-10' : 'col col-11']"
                :icon="card.icon"
                closeable
                @click:close="removeCard(index, card)"
            >
                <Badges
                    v-if="card.tag"
                    class="mb-2 mt-1"
                    :text="card.tag"
                    :background-color="card.tagBackgroundColor"
                    :color="card.tagFontColor"
                    :icon="card.tagIcon"
                />
                <DropdownAutocomplete
                    :items="dropdownItems"
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
                            {{ isCollapsed ? $t(card.expandableLabelHide) : $t(card.expandableLabelShow) }}
                        </small>
                    </a>
                    <div v-if="isCollapsed">
                        <Draggable
                            v-model="draggableCards"
                        >
                            <div
                                v-for="(group, idx) in draggableCards"
                                :key="idx"
                                class="card drag-card mb-2"
                            >
                                <div class="row card-body py-1">
                                    <i class="col col-1 bi bi-grip-vertical fs-3 ps-0" />
                                    <div class="col-11 mt-2">
                                        {{ group }}
                                    </div>
                                </div>
                            </div>
                        </Draggable>
                    </div>
                </div>
                <div v-if="card.key === 'textArea'">
                    <InputText
                        id="customText"
                        class="pt-3"
                        :label="$t('additional:modules.cosi.reportingTool.label.freetext')"
                        :placeholder="$t('additional:modules.cosi.reportingTool.label.freetext')"
                        html-type="textarea"
                        max-length="1000"
                        :model-value="card.value"
                        @input="setCardValue($event, card)"
                    />
                </div>
                <div v-if="card.key === 'heading'">
                    <InputText
                        id="customHeading"
                        class="pt-3"
                        :label="$t('additional:modules.cosi.reportingTool.label.heading')"
                        :model-value="card.value"
                        :placeholder="$t('additional:modules.cosi.reportingTool.label.heading')"
                        @input="setCardValue($event, card)"
                    />
                </div>
            </CustomCard>
        </div>
    </div>
    <AddCardButton
        class="pt-5 ps-5 pe-2"
        @click="addCard"
    />
</template>
<style scoped lang="scss">
.drag-card {
    cursor: grab;
}
</style>
