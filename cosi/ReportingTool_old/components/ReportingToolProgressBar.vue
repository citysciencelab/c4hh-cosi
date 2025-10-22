<script>
export default {
    name: "ReportingToolProgressBar",
    props: {
        downloadName: {
            type: String,
            required: false,
            default: ""
        },
        progress: {
            type: Number,
            required: true
        }
    },
    data () {
        return {
            showGoBack: false
        };
    },
    watch: {
        progress () {
            if (this.progress === 100) {
                setTimeout(() => {
                    this.showGoBack = true;
                }, 500);
            }
        }
    }
};
</script>

<template lang="html">
    <div
        class="progress-section col col-md-12"
    >
        <div v-if="!showGoBack">
            <div
                class="export-infos row mb-1"
            >
                <i class="export-icon bi bi-file-earmark-pdf col col-md-1" />
                <div class="col col-md-8">
                    <div
                        class="downloadName bold-headline"
                    >
                        {{ downloadName }}
                    </div>
                    <span class="creatingReport">
                        {{ $t("additional:modules.cosi.reportingTool.creatingReport") }}
                    </span>
                </div>
            </div>
            <div
                class="progress"
            >
                <div
                    class="progress-bar bg-primary"
                    role="progressbar"
                    :style="`width: ${progress}%`"
                    :aria-valuenow="progress"
                    aria-valuemin="0"
                    aria-valuemax="100"
                >
                    <span class="progress-percentage">{{ progress > 2 ? `${progress} %` : '' }}</span>
                </div>
            </div>
        </div>
        <div v-else>
            <div class="row">
                <i
                    class="bi bi-check"
                />
                <p
                    class="p-0"
                >
                    {{ $t("additional:modules.cosi.reportingTool.reportSuccess") }}
                </p>
            </div>
            <div class="row">
                <div class="col mt-3">
                    <button
                        class="btn btn-outline lh-1 fs-5"
                        @click.prevent="$emit('closeProgressBar')"
                    >
                        <i class="bi bi-arrow-return-left pe-2" />
                        {{ $t("additional:modules.cosi.reportingTool.backToTemplate") }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.progress {
    background-color: $light_grey;
    color: white;
    text-align: center;
    height: 20px;
    font-size: 14px;
}
.progress-bar {
    height: 100%;
}

.progress-percentage {
    font-family: $font_family_accent;
    white-space: nowrap;
}
.export-icon {
    font-size: 40px;
}
.downloadName {
    font-size: 14px;
}
.creatingReport {
    color: $dark_blue;
}
.btn-outline {
    border-color: $light_blue;
    color: $light_blue;
}
.btn-outline:hover {
        cursor: pointer;
        background-color: $light_blue;
        color: $white;
}

</style>
