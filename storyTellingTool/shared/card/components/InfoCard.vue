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
        photoCredit: {
            type: String,
            required: false,
            default: ""
        },
        altText: {
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
    emits: ["delete", "edit", "download"],
    data () {
        return {
            chapterSettingIcons: [
                {key: "subject", icon: "bi bi-layers"},
                {key: "map", icon: "bi bi-geo-alt"},
                {key: "tool", icon: "bi bi-tools"}
            ]
        };
    }
};
</script>

<template lang="html">
    <div
        class="card shadow rounded-3 mb-3"
        :class="{'story-card': cardType === 'story'}"
    >
        <i class="bi bi-grip-vertical mt-1" />
        <div
            v-if="cardImage.length"
            class="w-100 overflow-hidden d-flex align-items-center justify-content-center card-img-fixed-height"
        >
            <img
                :src="cardImage"
                class="card-img-top w-100 h-100 object-fit-cover"
                :alt="altText"
            >
        </div>
        <div class="text-end">
            <small
                v-if="photoCredit"
                class="text-muted photo-credit me-2 mt-1"
            >
                &copy; {{ photoCredit }}
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
            <p class="card-text card-text-fixed">
                {{ cardText }}
            </p>
            <div v-if="cardType === 'chapter'">
                <div class="d-flex justify-content-between align-items-center gap-3 pt-2 px-2">
                    <div
                        v-if="Object.keys(cardItems).length !== 0"
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
                    <IconButton
                        :aria="$t('additional:modules.storyCreator.labels.deleteChapter')"
                        icon="bi bi-trash"
                        :title="$t('additional:modules.storyCreator.labels.deleteChapter')"
                        :interaction="() => $emit('delete')"
                        :class-array="['btn-light']"
                    />
                </div>
            </div>
            <div
                v-else
            >
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
                    <div class="d-flex align-items-center gap-2">
                        <IconButton
                            :aria="$t('additional:modules.storyCreator.labels.editStory')"
                            icon="bi bi-pencil"
                            :title="$t('additional:modules.storyCreator.labels.editStory')"
                            :interaction="() => $emit('edit')"
                            :class-array="['btn-light']"
                        />
                        <IconButton
                            :aria="$t('additional:modules.storyCreator.labels.downloadStory')"
                            icon="bi bi-download"
                            :title="$t('additional:modules.storyCreator.labels.downloadStory')"
                            :interaction="() => $emit('download')"
                            :class-array="['btn-light']"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>
.card {
    border: 0.5px solid $light_grey;
    transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;

    .bi-grip-vertical {
        position: absolute;
        left: -25px;
        top: -7px;
        font-size: 30px;
    }

    &:hover {
        border-color: $secondary;
        box-shadow: 0 0 0 3px rgba($secondary, 1) inset;
        .bi-grip-vertical {
            color: $secondary;
        }
    }
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
.chapter-text-fixed {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    white-space: normal;
}
</style>
