<script>
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import Badges from "../../shared/modules/badges/components/Badges.vue";
import CustomCard from "../../shared/modules/cards/components/CustomCard.vue";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import ReportingToolStepItemAddCard from "./ReportingToolStepItemAddCard.vue";
import ReportingToolStepItemSettings from "./ReportingToolStepItemSettings.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {uniqueId} from "@shared/js/utils/uniqueId";
import {VueDraggableNext} from "vue-draggable-next";

export default {
    name: "ReportingToolStepItem",
    components: {
        AlertMessage,
        Badges,
        CustomCard,
        DropdownAutocomplete,
        ReportingToolStepItemAddCard,
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
        nothingSelectedText: {
            type: String,
            required: false,
            default: null
        },
        title: {
            type: String,
            required: true
        },
        groups: {
            type: Array,
            required: false,
            default: null
        }
    },
    emits: ["setCards", "setOrderOfCards"],
    data () {
        return {
            activelyClosedNonMultipleCardNames: [],
            cards: [],
            isCollapsed: false
        };
    },
    computed: {
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
        }
    },
    mounted () {
        this.initializeCards();
    },
    activated () {
        this.initializeCards();
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
    <div class="container px-4">
        <div
            v-for="(card, index) in cards"
            :key="card.id"
            class="cards row align-items-center d-flex flex-nowrap"
            :class="[cards.length > 1 ? 'justify-content-end' : 'justify-content-center']"
        >
            <div
                v-if="cards.length > 1"
                class="col col-auto d-flex flex-nowrap"
            >
                <div class="row">
                    <IconButton
                        class="order-button-up col col-md-auto col-sm-12 px-1"
                        :aria="$t('additional:modules.cosi.reportingTool.label.up')"
                        :icon="'bi bi-arrow-up'"
                        :interaction="() => updateCardOrder(card.id, 'up')"
                        :class-array="['btn-light', 'border border-dark-subtle', index == 0 ? 'd-none' : '']"
                    />
                    <IconButton
                        class="order-button-down col col-md-auto col-sm-12 px-2"
                        :aria="$t('additional:modules.cosi.reportingTool.label.down')"
                        :icon="'bi bi-arrow-down'"
                        :interaction="() => updateCardOrder(card.id, 'down')"
                        :class-array="['btn-light', 'border border-dark-subtle', index == cards.length - 1 ? 'd-none' : '']"
                    />
                </div>
            </div>
            <CustomCard
                class="mb-3 d-flex flex-nowrap"
                :class="[cards.length > 1 ? 'col col-10' : 'col col-11']"
                :icon="card.icon"
                closable
                @click:close="removeCard(index, card)"
            >
                <Badges
                    v-if="card.tag"
                    class="mb-2 mt-1"
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
                        class="pt-0 mt-0"
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
                        class="pt-0"
                        :label="$t('additional:modules.cosi.reportingTool.label.heading')"
                        :model-value="card.value"
                        :placeholder="$t('additional:modules.cosi.reportingTool.label.heading')"
                        @input="setCardValue($event, card)"
                    />
                </div>
            </CustomCard>
        </div>
    </div>
    <ReportingToolStepItemAddCard
        class="pt-5 ps-5 pe-2"
        @click="addCard"
    />
</template>
<style scoped lang="scss">
.drag-card {
    cursor: grab;
}
</style>
