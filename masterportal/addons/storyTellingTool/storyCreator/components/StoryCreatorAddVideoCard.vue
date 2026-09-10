<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

export default {
    name: "StoryCreatorAddVideoCard",
    components: {
        FlatButton,
        InputText
    },
    props: {
        closeable: {
            type: Boolean,
            required: false,
            default: true
        },
        initialContent: {
            type: Object,
            required: false,
            default: null
        }
    },
    emits: ["addVideo", "click:close"],
    data () {
        return {
            videoObj: {
                link: "",
                title: "",
                accessibleText: ""
            }
        };
    },
    computed: {
        /**
         * Returns true if the link and freetext are not empty.
         * @returns {Boolean} True if the link and freetext are not empty.
         */
        enableAdd () {
            if (this.videoObj?.link.trim() !== "" && this.videoObj?.accessibleText.trim() !== "") {
                return true;
            }

            return false;
        }
    },
    watch: {
        /**
         * Watches of the initial content and assign the attributes.
         * @param {Object} val - The initial content.
         * @returns {void}
         */
        initialContent: {
            handler (val) {
                if (!val) {
                    return;
                }

                const content = JSON.parse(JSON.stringify(val))?.attrs;

                this.videoObj = {
                    link: content?.link,
                    title: content?.title,
                    accessibleText: content?.accessibleText
                };
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        /**
         * Handles clicking the discard button.
         * @returns {void}
         */
        handleDiscardButtonClick () {
            this.videoObj = {
                link: "",
                title: "",
                accessibleText: ""
            };
        }
    }
};
</script>
<template lang="html">
    <div class="card border-0 rounded-3 bg-light">
        <div class="card-body p-4 position-relative">
            <button
                v-if="closeable"
                type="button"
                class="btn-close position-absolute top-0 end-0 m-2"
                aria-label="Close"
                @click="$emit('click:close')"
            />

            <h5 class="card-title mb-3">
                {{ $t("additional:modules.storyCreator.headlines.addVideo") }}
            </h5>
            <InputText
                id="video-link"
                v-model="videoObj.link"
                class="mt-2"
                :label="$t('additional:modules.storyCreator.labels.videoLink')"
                :placeholder="$t('additional:modules.storyCreator.labels.videoLink')"
            />
            <InputText
                id="video-title"
                v-model="videoObj.title"
                class="mt-2"
                :label="$t('additional:modules.storyCreator.labels.videoTitle')"
                :placeholder="$t('additional:modules.storyCreator.labels.videoTitle')"
            />
            <InputText
                id="video-accessibletext"
                v-model="videoObj.accessibleText"
                class="mt-2"
                :label="$t('additional:modules.storyCreator.labels.videoAccessibleText')"
                :placeholder="$t('additional:modules.storyCreator.labels.videoAccessibleText')"
            />
            <div
                class="d-flex justify-content-center gap-2"
            >
                <FlatButton
                    class="mt-2"
                    icon="bi bi-save"
                    :text="$t('additional:modules.storyCreator.buttons.confirm')"
                    :disabled="!enableAdd"
                    :interaction="() => $emit('addVideo', videoObj)"
                />
                <FlatButton
                    class="mt-2"
                    icon="bi bi-x-circle"
                    :secondary="true"
                    :text="$t('additional:modules.storyCreator.buttons.discardVideo')"
                    :interaction="handleDiscardButtonClick"
                />
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>
</style>
