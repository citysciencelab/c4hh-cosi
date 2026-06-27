<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

export default {
    name: "StoryCreatorChapterCard",
    components: {
        IconButton
    },
    props: {
        chapterTitle: {
            type: String,
            required: true
        },
        chapterText: {
            type: String,
            required: false,
            default: ""
        },
        chapterImage: {
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
        chapterItems: {
            type: Object,
            required: false,
            default: () => ({})
        }
    },
    emits: ["delete"],
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
    <div class="card shadow rounded-3 mb-3">
        <i class="bi bi-grip-vertical mt-1" />
        <div
            v-if="chapterImage.length"
            class="w-100 overflow-hidden d-flex align-items-center justify-content-center card-img-fixed-height"
        >
            <img
                :src="chapterImage"
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
            :class="{'has-image': chapterImage.length}"
        >
            <h5 class="card-title">
                {{ chapterTitle }}
            </h5>
            <p class="card-text chapter-text-fixed">
                {{ chapterText }}
            </p>
            <div class="d-flex justify-content-between align-items-center gap-3 pt-2 px-2">
                <div
                    v-if="Object.keys(chapterItems).length !== 0"
                    class="d-flex flex-row flex-wrap gap-2 pt-1"
                >
                    <div
                        v-for="item in chapterSettingIcons"
                        :key="item?.key"
                    >
                        <small
                            v-if="chapterItems[item?.key]"
                            class="d-flex align-items-center settings me-2"
                        >
                            <i
                                :class="item.icon"
                                aria-hidden="true"
                            />
                            <span class="ms-1 small">{{ chapterItems[item?.key] }}</span>
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

