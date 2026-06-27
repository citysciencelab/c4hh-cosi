<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import TipTapEditor from "../shared/modules/tipTapEditor/components/TipTapEditor.vue";

export default {
    name: "StoryCreatorAddTextCard",
    components: {
        IconButton,
        TipTapEditor
    },
    props: {
        initialContent: {
            type: [Object, String],
            required: false,
            default: ""
        }
    },
    emits: ["click:close", "addContent"],
    data () {
        return {
            content: JSON.parse(JSON.stringify(this.initialContent))
        };
    }
};
</script>
<template lang="html">
    <div
        class="card rounded-3"
    >
        <div class="card-body p-3 position-relative">
            <button
                type="button"
                class="btn-close position-absolute top-0 end-0 m-2"
                aria-label="Close"
                @click="$emit('click:close')"
            />
            <div class="mt-2">
                <TipTapEditor v-model="content" />
            </div>
            <div class="d-flex justify-content-center gap-2">
                <IconButton
                    v-if="content"
                    class="mt-2"
                    icon="bi bi-check-lg"
                    :aria="$t('additional:modules.storyCreator.buttons.confirm')"
                    :class-array="['btn-secondary']"
                    :interaction="() => $emit('addContent', content)"
                />
                <IconButton
                    class="mt-2"
                    icon="bi bi-x-lg"
                    :aria="$t('additional:modules.storyCreator.buttons.abort')"
                    :class-array="['btn-primary']"
                    :interaction="() => $emit('click:close')"
                />
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>
</style>
