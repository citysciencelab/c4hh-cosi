<script>
import {mapActions} from "vuex";
import ModalItem from "@shared/modules/modals/components/ModalItem.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";

export default {
    name: "TabGraphicsDisclaimerModal",
    components: {
        ModalItem,
        SpinnerItem
    },
    props: {
        params: {
            type: Object,
            required: true
        },
        show: {
            type: Boolean,
            required: true
        }
    },
    data () {
        return {
            loading: false,
            blocks: []
        };
    },
    watch: {
        show (val) {
            if (val) {
                this.loadDisclaimer();
            }
        }
    },
    methods: {
        ...mapActions("Modules/TimeSeriesChart", [
            "fetchDisclaimer"
        ]),
        /**
         * Loads disclaimer blocks via Vuex action and stores them locally.
         * @returns {Promise<void>}
         */
        async loadDisclaimer () {
            const url = this.params?.disclaimer?.data;

            if (!url) {
                this.blocks = [];
                return;
            }

            try {
                this.loading = true;
                const blocks = await this.fetchDisclaimer({url: url});

                this.blocks = Array.isArray(blocks) ? blocks : [];
            }
            catch (e) {
                console.error(e);
                this.blocks = [];
            }
            finally {
                this.loading = false;
            }
        },
        /**
         * Emits close to parent.
         */
        onClose () {
            this.$emit("close");
        }
    }
};
</script>

<template>
    <div class="TabGraphicsDisclaimerModal">
        <ModalItem
            :show-modal="show"
            title="Haftungsausschluss"
            @close="onClose"
            @modalHid="onClose"
        >
            <template #default>
                <SpinnerItem
                    v-if="loading"
                />
                <template
                    v-else
                >
                    <template
                        v-for="(block, bidx) in blocks"
                        :key="bidx"
                    >
                        <h2
                            v-if="block.type === 'h2'"
                        >
                            <template
                                v-for="(seg, sidx) in block.content"
                                :key="sidx"
                            >
                                <strong
                                    v-if="seg.type === 'strong'"
                                >
                                    {{ seg.text }}
                                </strong>
                                <span
                                    v-else
                                >
                                    {{ seg.text }}
                                </span>
                            </template>
                        </h2>

                        <p
                            v-else-if="block.type === 'p'"
                        >
                            <template
                                v-for="(seg, sidx) in block.content"
                                :key="sidx"
                            >
                                <strong
                                    v-if="seg.type === 'strong'"
                                >
                                    {{ seg.text }}
                                </strong>
                                <span
                                    v-else
                                >
                                    {{ seg.text }}
                                </span>
                            </template>
                        </p>
                    </template>
                </template>
            </template>
        </ModalItem>
    </div>
</template>

<style lang="scss">
#modal-1-inner-wrapper  {
    width: 50%;

    @media (max-width: 767px) {
        width: 90%;
    }

    p {
        margin: 0 1rem 1rem 0;
        font-size: 1rem;
    }
}
</style>
