<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import TipTapEditor from "../shared/modules/tipTapEditor/components/TipTapEditor.vue";

export default {
    name: "StoryCreatorAddTextCard",
    components: {
        FlatButton,
        TipTapEditor
    },
    emits: ["click:close"],
    data () {
        return {
            content: ""
        };
    }
};
</script>
<template lang="html">
    <div
        class="card border-0 rounded-3 bg-light"
    >
        <div class="card-body p-4 position-relative">
            <button
                type="button"
                class="btn-close position-absolute top-0 end-0 m-2"
                aria-label="Close"
                @click="$emit('click:close')"
            />
            <h5 class="card-title mb-3">
                {{ $t('additional:modules.storyCreator.headlines.addTexts') }}
            </h5>
            <div class="mt-2">
                <TipTapEditor v-model="content" />
            </div>
            <div class="d-flex justify-content-center gap-2">
                <FlatButton
                    class="mt-2"
                    icon="bi bi-x-circle"
                    :secondary="true"
                    :text="$t('additional:modules.storyCreator.buttons.abort')"
                    @click="$emit('click:close')"
                />
                <FlatButton
                    class="mt-2"
                    icon="bi bi-save"
                    :text="$t('additional:modules.storyCreator.buttons.add')"
                    @click="() => ''"
                />
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>
</style>
