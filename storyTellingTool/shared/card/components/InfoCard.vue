<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

export default {
    name: "InfoCard",
    components: {
        IconButton
    },
    props: {
        cardType: {
            type: String,
            default: "chapter",
            validator: val => ["chapter", "story"].includes(val)
        },
        cardTitle: {
            type: String,
            required: true
        },
        cardText: {
            type: String,
            required: false,
            default: ""
        },
        cardImage: {
            type: String,
            required: false,
            default: ""
        },
        copyright: {
            type: String,
            required: false,
            default: ""
        },
        alt: {
            type: String,
            required: false,
            default: ""
        },
        cardItems: {
            type: Object,
            required: false,
            default: () => ({})
        },
        editable: {
            type: Boolean,
            required: false,
            default: true
        }
    },
    emits: ["delete", "play", "edit", "download", "click"],
    data () {
        return {
            chapterSettingIcons: [
                {key: "subject", icon: "bi bi-layers"},
                {key: "map", icon: "bi bi-geo-alt"},
                {key: "tool", icon: "bi bi-tools"}
            ]
        };
    },
    computed: {
        /**
         * Returns true if at least one cardItem has a non-empty value.
         * @returns {Boolean} True if card items exist, otherwise false.
         */
        hasCardItems () {
            return Object.values(this.cardItems).some(value => value && value.length > 0);
        }
    },
    methods: {
        /**
         * Handles the click event on the edit button and stops propagation.
         * @param {Event} event The DOM event.
         * @param {Boolean} ignore if to ignore the click event.
         * @returns {void}
         */
        handleEditClick (event, ignore = false) {
            if (ignore) {
                return;
            }

            if (event) {
                event.stopPropagation();
            }
            this.$emit("edit");
        },

        /**
         * Handles the click event on the delete button and stops propagation.
         * @param {Event} event The DOM event.
         * @returns {void}
         */
        handleDeleteClick (event) {
            if (event) {
                event.stopPropagation();
            }
            this.$emit("delete");
        },

        /**
         * Handles the click event on the download button and stops propagation.
         * @param {Event} event The DOM event.
         * @returns {void}
         */
        handleDownloadClick (event) {
            if (event) {
                event.stopPropagation();
            }
            this.$emit("download");
        }
    }
};
</script>

<template lang="html">
    <div
        class="card-wrapper"
        :class="{'card-wrapper--chapter': cardType === 'chapter'}"
    >
        <i
            v-if="cardType === 'chapter'"
            class="bi bi-grip-vertical drag-handle"
            aria-hidden="true"
        />
        <div
            class="card shadow rounded-3 mb-3"
            :class="{
                'story-card': cardType === 'story',
                'is-editable': editable
            }"
            role="button"
            tabindex="0"
            @click="handleEditClick($event, cardType === 'story')"
            @keydown.enter="handleEditClick($event, cardType === 'story')"
            @keydown.space.prevent="handleEditClick($event, cardType === 'story')"
        >
            <div
                v-if="cardImage.length"
                class="w-100 overflow-hidden d-flex align-items-center justify-content-center card-img-fixed-height"
            >
                <img
                    :src="cardImage"
                    class="card-img-top w-100 h-100 object-fit-cover"
                    :alt="alt"
                >
            </div>
            <div class="text-end">
                <small
                    v-if="copyright"
                    class="text-muted copyright me-2 mt-1"
                >
                    &copy; {{ copyright }}
                </small>
            </div>
            <div
                class="card-body"
                :class="{'has-image': cardImage.length}"
            >
                <div class="d-flex align-items-center gap-2">
                    <h5 class="card-title mb-0">
                        {{ cardTitle }}
                    </h5>
                    <span
                        v-if="!editable"
                        class="badge rounded-pill"
                    >
                        {{ $t('additional:modules.storyCreator.readOnly') }}
                    </span>
                </div>
                <p class="card-text card-text-fixed pt-1">
                    {{ cardText }}
                </p>
                <div v-if="cardType === 'chapter'">
                    <div class="d-flex justify-content-between align-items-center gap-3 pt-2 px-2">
                        <div
                            v-if="hasCardItems"
                            class="d-flex flex-row flex-wrap gap-2 pt-1"
                        >
                            <div
                                v-for="item in chapterSettingIcons"
                                :key="item?.key"
                            >
                                <small
                                    v-if="cardItems[item?.key]"
                                    class="d-flex align-items-center settings me-2"
                                >
                                    <i
                                        :class="item.icon"
                                        aria-hidden="true"
                                    />
                                    <span class="ms-1 small">{{ cardItems[item?.key] }}</span>
                                </small>
                            </div>
                        </div>
                        <small
                            v-else
                            class="text-muted fst-italic ps-0"
                        >
                            {{ $t('additional:modules.storyCreator.noSettings') }}
                        </small>
                        <div class="d-flex align-items-center gap-2">
                            <IconButton
                                :aria="$t('additional:modules.storyCreator.labels.deleteChapter')"
                                icon="bi bi-trash"
                                :interaction="handleDeleteClick"
                                :class-array="['btn-light']"
                            />
                        </div>
                    </div>
                </div>
                <div v-else>
                    <div
                        v-if="Object.keys(cardItems).length !== 0"
                        class="d-flex justify-content-between align-items-center gap-3 pt-2 px-2"
                    >
                        <small class="d-flex flex-column align-items-start">
                            <div class="Author">
                                {{ cardItems.author }}
                            </div>
                            <div class="date">
                                {{ cardItems.creation }}
                            </div>
                        </small>
                        <div class="number-of-chapters text-center">
                            <i
                                class="bi bi-folder2-open"
                                aria-hidden="true"
                            />
                            <span class="ms-1 small">{{ cardItems.numberOfChapters + " " + $t('additional:modules.storyCreator.numberOfChapters') }}</span>
                        </div>
                        <div
                            class="d-flex align-items-center gap-2"
                        >
                            <IconButton
                                :aria="$t('additional:modules.storyCreator.labels.playStory')"
                                icon="bi bi-collection-play"
                                :interaction="() => $emit('play')"
                                :class-array="['btn-light']"
                            />
                            <IconButton
                                v-if="editable"
                                :aria="$t('additional:modules.storyCreator.labels.editStory')"
                                icon="bi bi-pencil"
                                :interaction="handleEditClick"
                                :class-array="['btn-light']"
                            />
                            <IconButton
                                v-if="editable"
                                :aria="$t('additional:modules.storyCreator.labels.downloadStory')"
                                icon="bi bi-download"
                                :interaction="handleDownloadClick"
                                :class-array="['btn-light']"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.card-wrapper {
    position: relative;

    &--chapter {
        padding-left: 2.5rem;
    }
}
.card {
    position: relative;
    overflow: visible;
    border: 0.5px solid $light_grey;
    transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    &.is-editable {
        cursor: pointer;

        &:hover {
            border-color: $secondary;
            box-shadow: 0 0 0 3px rgba($secondary, 1) inset;
        }
    }
}
.drag-handle {
    position: absolute;
    left: 0;
    top: 0;
    cursor: grab;
    color: $secondary;
    font-size: 1.75rem;
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;

    &:active {
        cursor: grabbing;
        background-color: $primary;
        color: $dark_blue;
    }
}
.card-wrapper:hover .drag-handle {
    opacity: 1;
}
.card-body {
    padding-top: 1.5rem;
    &.has-image {
        padding-top: 0.5rem;
    }
}
.card-title {
    font-family: $font_family_accent;
}
.badge {
    background-color: $secondary;
    color: $white;
    font-weight: normal;
}
.card.story-card {
    background-color: rgba($light_blue, 0.50);
}
.settings {
    color: $secondary;
}
.card-img-fixed-height {
    height: 130px;
}
.card-text-fixed {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    white-space: normal;
}
</style>
