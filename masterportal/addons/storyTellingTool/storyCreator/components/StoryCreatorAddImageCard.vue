<script>
import AlertMessage from "../../../cosi/shared/modules/alerts/components/AlertMessage.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

export default {
    name: "StoryCreatorAddImageCard",
    components: {
        AlertMessage,
        FlatButton,
        FileUpload,
        InputText
    },
    props: {
        embedded: {
            type: Boolean,
            required: false,
            default: false
        },
        closeable: {
            type: Boolean,
            required: false,
            default: true
        },
        createImageAsset: {
            type: Function,
            required: true
        },
        imageAssetsById: {
            type: Object,
            required: true
        },
        initialImage: {
            type: Object,
            required: false,
            default: null
        }
    },
    emits: ["addImage", "update:image", "update:image-valid", "click:close"],
    data () {
        return {
            image: {
                alt: "",
                copyright: ""
            },
            uploadedAsset: null,
            isValidated: true,
            showRequiredHint: false
        };
    },
    computed: {
        /**
         * Returns the current asset to display: uploaded first, initial as fallback.
         * @returns {Object|null} The active image asset.
         */
        currentAsset () {
            return this.uploadedAsset || this.imageAssetsById[this.initialImage?.id] || null;
        },
        /**
         * Returns true if an image id exists and its object URL is available.
         * @returns {Boolean} True if the image can be displayed.
         */
        isImageLoaded () {
            return Boolean(this.currentAsset?.id && this.currentAsset?.objectURL);
        },
        /**
         * Returns true if the alt and copyright are not empty and image is loaded.
         * @returns {Boolean} True if the alt and copyright are not empty.
         */
        enableAdd () {
            if (this.image?.alt.trim() !== "" && this.image?.copyright.trim() !== "" && this.isImageLoaded) {
                return true;
            }

            return false;
        },
        /**
         * Returns true if the alt text is required and missing.
         * @returns {Boolean} True if the alt text is missing and the required hint should be shown.
         */
        hasAltError () {
            return this.embedded
                && this.showRequiredHint
                && !this.image?.alt?.trim();
        },
        /**
         * Returns true if the copyright is required and missing.
         * @returns {Boolean} True if the copyright is missing and the required hint should be shown.
         */
        hasCopyrightError () {
            return this.embedded
                && this.showRequiredHint
                && !this.image?.copyright?.trim();
        }
    },
    watch: {
        image: {
            handler () {
                if (this.embedded) {
                    this.updateEmbeddedImage();
                }
                else {
                    this.$emit("update:image", this.image);
                }
            },
            deep: true
        }
    },
    created () {
        if (this.initialImage?.id) {
            this.image = JSON.parse(JSON.stringify(this.initialImage));
        }
    },
    methods: {
        /**
         * Handles clicking the close button.
         * @returns {void}
         */
        handleCloseButtonClick () {
            this.$emit("click:close");
        },

        /**
         * Handles clicking the discard button.
         * @returns {void}
         */
        handleDiscardButtonClick () {
            this.image = {
                alt: "",
                copyright: ""
            };
            this.uploadedAsset = {
                id: null,
                objectURL: null
            };
            this.isValidated = true;
            this.showRequiredHint = false;
        },

        /**
         * Loads the image and stores it both locally and as an asset for the parent.
         * @param {Event} event
         */
        async loadImage (event) {
            const file = event?.dataTransfer?.files?.[0] ?? event?.target?.files?.[0];

            if (!file || !file?.type.startsWith("image/")) {
                this.isValidated = false;
                return;
            }

            this.isValidated = true;
            this.uploadedAsset = await this.createImageAsset(file);

            this.image.id = this.uploadedAsset.id;
        },

        /**
         * Returns true if the image metadata is valid.
         * @returns {Boolean} True if alt text and copyright are present and an image is loaded.
         */
        isImageValid () {
            return Boolean(
                this.image?.alt?.trim()
                    && this.image?.copyright?.trim()
                    && this.isImageLoaded
            );
        },

        /**
         * Updates the embedded image and its validation state. Emits the image only when it is valid.
         * @returns {void}
         */
        updateEmbeddedImage () {
            if (!this.isImageLoaded) {
                this.showRequiredHint = false;
                this.$emit("update:image-valid", true);
                this.$emit("update:image", null);

                return;
            }
            const valid = this.isImageValid();

            this.$emit("update:image-valid", valid);
            this.showRequiredHint = !valid && this.isImageLoaded;

            if (!valid) {
                return;
            }

            this.$emit("update:image", {
                ...this.image,
                id: this.currentAsset?.id || this.initialImage?.id
            });
        }


    }
};
</script>
<template lang="html">
    <div
        class="card border-0 rounded-3"
        :class="embedded ? 'bg-white' : 'bg-light'"
    >
        <div class="card-body p-4 position-relative">
            <button
                v-if="closeable"
                type="button"
                class="btn-close position-absolute top-0 end-0 m-2"
                aria-label="Close"
                @click="handleCloseButtonClick"
            />

            <h5 class="card-title mb-3">
                {{ !embedded && !closeable
                    ? $t('additional:modules.storyCreator.headlines.addImageTitle')
                    : $t('additional:modules.storyCreator.headlines.addImages') }}
            </h5>
            <div v-if="!isImageLoaded">
                <FileUpload
                    :id="'Story-Creator-Image-Upload'"
                    :change="loadImage"
                    :drop="loadImage"
                    :multiple="false"
                    accept="image/*"
                />
            </div>
            <div v-else>
                <img
                    :src="currentAsset.objectURL"
                    :alt="image.alt"
                    class="img-thumbnail d-block mx-auto mb-3 w-25"
                >
            </div>
            <InputText
                id="image-name"
                v-model="image.alt"
                class="mt-2"
                :class-obj="{'is-invalid': hasAltError}"
                :label="$t('additional:modules.storyCreator.labels.alt')"
                :placeholder="$t('additional:modules.storyCreator.labels.alt')"
                :error-message="hasAltError ? $t('additional:modules.storyCreator.labels.imageRequiredAlt'): null"
            />
            <InputText
                id="image-name"
                v-model="image.copyright"
                class="mt-2"
                :class-obj="{'is-invalid': hasCopyrightError}"
                :label="$t('additional:modules.storyCreator.labels.copyright')"
                :placeholder="$t('additional:modules.storyCreator.labels.copyright')"
                :error-message="hasCopyrightError ? $t('additional:modules.storyCreator.labels.imageRequiredCopyright'): null"
            />
            <AlertMessage
                v-if="!isValidated"
                :closeable="true"
                :text="$t('additional:modules.storyCreator.labels.wrongFormat')"
                :title="$t('additional:modules.storyCreator.labels.wrongFormatTitle')"
                type="error"
                @closed="isValidated = true"
            />
            <div
                class="d-flex justify-content-center gap-2"
            >
                <FlatButton
                    v-if="!embedded"
                    class="mt-2"
                    icon="bi bi-save"
                    :text="$t('additional:modules.storyCreator.buttons.confirm')"
                    :disabled="!enableAdd"
                    :interaction="() => $emit('addImage', image)"
                />
                <FlatButton
                    class="mt-2"
                    icon="bi bi-x-circle"
                    :secondary="true"
                    :text="$t('additional:modules.storyCreator.buttons.discardImage')"
                    :interaction="handleDiscardButtonClick"
                />
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>
</style>
