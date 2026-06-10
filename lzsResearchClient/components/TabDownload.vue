<script>
import {TAB_SET_CURRENT} from "@shared/modules/tabs/components/TabContainer.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "TabDownload",
    components: {
        FlatButton
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    props: {},
    data () {
        return {};
    },
    computed: {},
    watch: {},
    methods: {
        returnToSearchTab () {
            this.setCurrentTab("tabSearch");
        }
    }
};
</script>

<template>
    <div id="TabDownload">
        "TabDownload Content"

        <FlatButton
            :aria-label="$t('additional:modules.lzsResearchClient.tabs.backToSearchButtonLabel')"
            :text="$t('additional:modules.lzsResearchClient.tabs.backToSearchButtonLabel')"
            @click="returnToSearchTab()"
        />
    </div>
</template>

<style lang="scss" scoped>
#TabDownload {
    outline: dashed 2px red;
}
</style>
