<script>
import {mapGetters} from "vuex";

export default {
    inject: ["toggleCurrentView"],

    computed: {
        ...mapGetters("Modules/ScenarioBuilder", ["activeScenarioCard"])
    }
};
</script>

<template lang="html">
    <div class="d-flex align-items-center mb-3">
        <button
            id="back-to-overview"
            type="button"
            class="btn btn-link text-decoration-none p-0 d-inline-flex align-items-center gap-2"
            :aria-label="$t('additional:modules.tools.cosi.objectManager.back')"
            @click="toggleCurrentView('manager')"
        >
            <i class="bi bi-arrow-left" />
            <span>{{ $t('additional:modules.tools.cosi.objectManager.back') }}</span>
        </button>
    </div>
    <h5 class="mb-4">
        {{ activeScenarioCard.title + " - " }}
        {{ $t('additional:modules.tools.cosi.objectManager.title') }}
    </h5>
</template>

<style lang="scss" scoped>
    .back-to-overview {
        color: $link-color;
    }
</style>
