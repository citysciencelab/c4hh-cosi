<script>
import {mapActions, mapGetters} from "vuex";
import {buffer, createEmpty, extend} from "ol/extent.js";
import Control from "ol/control/Control.js";
import Overlay from "ol/Overlay.js";
import {unByKey} from "ol/Observable.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import TabBar from "../../shared/modules/tabBar/components/TabBar.vue";
import FundingTab from "./SocialInfraMonitorFundingTab.vue";
import HoursTab from "./SocialInfraMonitorHoursTab.vue";
import ReachTab from "./SocialInfraMonitorReachTab.vue";
import {CATEGORIES, FUNDED_KEYS} from "../utils/categories.js";
import {formatEuro, formatNumber} from "../utils/format.js";
import {buildLinks, loadFeatures, prepareDistricts, prepareSites, toRow} from "../utils/loadData.js";
import {districtColoring, districtStyle, fundingStyle, hoursStyle, reachStyle} from "../utils/mapStyles.js";
import {MINUTES_PER_DAY, isOpen, wrapMinute} from "../utils/openingHours.js";

const T = "additional:modules.tools.cosi.socialInfraMonitor.",
      LAYER_KEY_BY_CATEGORY = {Jugend: "jugend", Familie: "familie", Kita: "kitas", Schule: "schulen"},
      // Simulated minutes per real second at speed 1: one day in 24 seconds.
      MINUTES_PER_SECOND = 60;

/**
 * Prototype "Förderung & Öffnungszeiten" (fictional demo data).
 *
 * Draws everything on its own two overlay layers instead of restyling the
 * layer tree's demo layers: the animation, symbol sizes and network lines stay
 * under the tool's control, and the tree layers stay untouched for COSI's own
 * analyses. While the tool is open those tree layers are hidden so nothing is
 * drawn twice, and restored afterwards.
 */
export default {
    name: "SocialInfraMonitor",
    components: {ToolInfo, TabBar, FundingTab, HoursTab, ReachTab},
    data () {
        const tabItems = [
            {type: "funding", text: T + "tabs.funding", icon: "bi bi-cash-coin"},
            {type: "hours", text: T + "tabs.hours", icon: "bi bi-clock"},
            {type: "reach", text: T + "tabs.reach", icon: "bi bi-people"}
        ];

        return {
            tabItems,
            activeTab: tabItems[0],
            loading: true,
            loadError: null,
            sites: [],
            districts: [],
            // funding
            fundingCategories: [...FUNDED_KEYS],
            showAllNetworks: false,
            selectedTraegerId: null,
            coloring: "none",
            selectedDistrict: null,
            // hours
            hourCategories: CATEGORIES.map(category => category.key),
            minute: 7 * 60,
            playing: false,
            speed: 1,
            selectedHoursId: null,
            // reach
            reachCategories: [...FUNDED_KEYS],
            selectedReachId: null,
            reachSort: "visits"
        };
    },
    computed: {
        ...mapGetters("Modules/SocialInfraMonitor", ["layerIds", "districtsUrl", "menuSide", "accessibilityAnalysisType", "aiLabelUrl"]),
        ...mapGetters(["layerConfigById"]),
        funded () {
            return this.sites.filter(site => FUNDED_KEYS.includes(site.kategorie));
        },
        // One scale per measure, fixed for the session so symbols don't jump when filtering.
        maxPaid () {
            return Math.max(...this.funded.map(site => site.foerderung_zahlung_eur || 0), 1);
        },
        maxSpent () {
            return Math.max(...this.funded.map(site => site.foerderung_standort_eur || 0), 1);
        },
        maxVisits () {
            return Math.max(...this.funded.map(site => site.besuche_woche || 0), 1);
        },
        coloringInfo () {
            return districtColoring(this.coloring, this.districts, value => this.coloring === "perU18"
                ? `${Math.round(value)} €`
                : formatEuro(value));
        },
        /** Everything the map styles depend on; a change re-renders the overlays. */
        mapState () {
            return [
                this.activeTab.type, this.fundingCategories, this.showAllNetworks, this.selectedTraegerId,
                this.coloring, this.selectedDistrict, this.hourCategories, this.minute, this.selectedHoursId,
                this.reachCategories, this.selectedReachId
            ];
        }
    },
    watch: {
        mapState: {
            handler () {
                this.facilityLayer?.changed();
                this.districtLayer?.changed();
                this.districtLayer?.setVisible(this.activeTab.type === "funding");
            },
            deep: true
        },
        activeTab () {
            this.hideTooltip();
            if (this.activeTab.type !== "hours") {
                this.stop();
            }
        }
    },
    async mounted () {
        this.map = mapCollection.getMap("2D");
        await this.createLayers();
        this.activate();
        await this.loadData();
    },
    activated () {
        if (this.map) {
            this.activate();
        }
    },
    deactivated () {
        this.deactivate();
    },
    beforeUnmount () {
        this.deactivate();
        if (this.tooltip) {
            this.map.removeOverlay(this.tooltip);
        }
    },
    methods: {
        ...mapActions(["replaceByIdInLayerConfig"]),
        ...mapActions("Maps", ["addNewLayerIfNotExists"]),

        async createLayers () {
            this.districtLayer = await this.addNewLayerIfNotExists({layerName: "socialInfraMonitor_districts"});
            this.facilityLayer = await this.addNewLayerIfNotExists({layerName: "socialInfraMonitor_facilities"});
            // Without an explicit z-index the outlines would sit under the basemap.
            this.districtLayer.setZIndex(this.facilityLayer.getZIndex() - 1);
            this.districtLayer.setStyle(feature => districtStyle(feature, {
                fillFor: this.coloringInfo.fillFor,
                selectedName: this.selectedDistrict
            }));
            this.facilityLayer.setStyle(feature => this.styleFacility(feature));

            const element = document.createElement("div");

            element.className = "sim-map-tooltip";
            this.tooltipElement = element;
            this.tooltip = new Overlay({element, offset: [14, 0], positioning: "center-left", stopEvent: false});
            this.map.addOverlay(this.tooltip);
            this.aiBadge = this.createAiBadge();
        },

        /**
         * The EU "AI generated" label as a map control, so every screenshot of
         * the prototype's map carries it, not only the panel.
         * @returns {module:ol/control/Control} The control, not yet on the map.
         */
        createAiBadge () {
            const element = document.createElement("div"),
                  image = document.createElement("img");

            element.className = "sim-ai-badge ol-unselectable";
            image.src = this.aiLabelUrl;
            image.alt = this.$t(T + "aiLabel");
            image.title = this.$t(T + "aiLabelTitle");
            element.appendChild(image);
            return new Control({element});
        },

        /**
         * The map canvas spans the whole window and the menus sit on top of it,
         * so the badge follows the right edge of the main menu to stay in the
         * visible part of the map, also when the menu is resized or collapsed.
         * @returns {void}
         */
        positionAiBadge () {
            const menu = document.getElementById("mp-menu-mainMenu"),
                  viewport = this.map.getViewport().getBoundingClientRect(),
                  edge = menu && menu.offsetWidth > 0 ? menu.getBoundingClientRect().right : viewport.left;

            this.aiBadge.element.style.left = `${Math.max(edge - viewport.left, 0) + 8}px`;
        },

        async loadData () {
            this.loading = true;
            this.loadError = null;
            try {
                const projection = this.map.getView().getProjection(),
                      urls = Object.values(LAYER_KEY_BY_CATEGORY).map(key => {
                          const url = rawLayerList.getLayerWhere({id: this.layerIds[key]})?.url;

                          if (!url) {
                              throw new Error(`${this.layerIds[key]} fehlt in services.json`);
                          }
                          return url;
                      }),
                      [siteLists, districtFeatures] = await Promise.all([
                          Promise.all(urls.map(url => loadFeatures(url, projection))),
                          loadFeatures(this.districtsUrl, projection)
                      ]),
                      sites = prepareSites(siteLists.flat()),
                      districts = prepareDistricts(districtFeatures);

                this.featureById = new Map(sites.map(site => [site.get("id"), site]));
                this.districtByName = new Map(districts.map(district => [district.get("stadtteil"), district]));
                this.facilityLayer.getSource().clear();
                this.facilityLayer.getSource().addFeatures([...buildLinks(sites), ...sites]);
                this.districtLayer.getSource().clear();
                this.districtLayer.getSource().addFeatures(districts);
                this.sites = sites.map(toRow);
                this.districts = districts.map(toRow);
            }
            catch (error) {
                console.error("SocialInfraMonitor: could not load the demo data", error);
                this.loadError = error.message;
            }
            finally {
                this.loading = false;
            }
        },

        /**
         * Shows the overlays and takes over the map while the tool is open.
         * Safe to call twice: keep-alive calls activated() right after mounted().
         * @returns {void}
         */
        activate () {
            this.facilityLayer?.setVisible(true);
            this.districtLayer?.setVisible(this.activeTab.type === "funding");
            if (!this.listeners) {
                this.listeners = [
                    this.map.on("singleclick", this.onMapClick),
                    this.map.on("pointermove", this.onPointerMove)
                ];
            }
            if (this.aiBadge && !this.aiBadge.getMap()) {
                this.map.addControl(this.aiBadge);
                this.badgeObserver = new ResizeObserver(() => this.positionAiBadge());
                [document.getElementById("mp-menu-mainMenu"), this.map.getViewport()]
                    .filter(Boolean)
                    .forEach(element => this.badgeObserver.observe(element));
                this.positionAiBadge();
            }
            this.hideTreeLayers();
        },

        deactivate () {
            this.stop();
            this.hideTooltip();
            this.facilityLayer?.setVisible(false);
            this.districtLayer?.setVisible(false);
            unByKey(this.listeners || []);
            this.listeners = null;
            if (this.aiBadge?.getMap()) {
                this.map.removeControl(this.aiBadge);
            }
            this.badgeObserver?.disconnect();
            this.badgeObserver = null;
            this.restoreTreeLayers();
        },

        hideTreeLayers () {
            if (this.hiddenTreeLayers) {
                return;
            }
            this.hiddenTreeLayers = Object.values(this.layerIds).filter(id => this.layerConfigById(id)?.visibility === true);
            this.hiddenTreeLayers.forEach(id => this.setTreeLayerVisibility(id, false));
        },

        restoreTreeLayers () {
            (this.hiddenTreeLayers || []).forEach(id => this.setTreeLayerVisibility(id, true));
            this.hiddenTreeLayers = null;
        },

        setTreeLayerVisibility (id, visibility) {
            this.replaceByIdInLayerConfig({layerConfigs: [{id, layer: {id, visibility}}]});
        },

        styleFacility (feature) {
            switch (this.activeTab.type) {
                case "hours":
                    return hoursStyle(feature, {
                        categories: this.hourCategories,
                        minute: this.minute,
                        selectedId: this.selectedHoursId
                    });
                case "reach":
                    return reachStyle(feature, {
                        categories: this.reachCategories,
                        maxVisits: this.maxVisits,
                        maxEuro: this.maxSpent,
                        selectedId: this.selectedReachId
                    });
                default:
                    return fundingStyle(feature, {
                        categories: this.fundingCategories,
                        showAllNetworks: this.showAllNetworks,
                        selectedTraegerId: this.selectedTraegerId,
                        maxEuro: this.maxPaid
                    });
            }
        },

        /**
         * The topmost visible site at a pixel. Hidden features have no style and are never hit.
         * @param {Number[]} pixel - Map pixel.
         * @returns {module:ol/Feature|null} The site.
         */
        siteAtPixel (pixel) {
            let hit = null;

            this.map.forEachFeatureAtPixel(pixel, feature => {
                if (feature.get("_kind") === "site") {
                    hit = feature;
                    return true;
                }
                return false;
            }, {layerFilter: layer => layer === this.facilityLayer, hitTolerance: 3});
            return hit;
        },

        onMapClick (event) {
            const site = this.siteAtPixel(event.pixel),
                  id = site?.get("id") || null;

            if (this.activeTab.type === "funding") {
                const traegerId = site?.get("traeger_id") || null;

                this.selectedTraegerId = traegerId && traegerId === this.selectedTraegerId && site.get("rolle") !== "Standort" ? null : traegerId;
            }
            else if (this.activeTab.type === "hours") {
                this.selectedHoursId = id;
            }
            else {
                this.selectedReachId = id;
            }
        },

        onPointerMove (event) {
            if (event.dragging) {
                return;
            }
            const site = this.siteAtPixel(event.pixel);

            this.map.getTargetElement().style.cursor = site ? "pointer" : "";
            if (!site) {
                this.hideTooltip();
                return;
            }
            this.tooltipElement.replaceChildren(...this.tooltipLines(site).map((text, i) => {
                const line = document.createElement("div");

                line.textContent = text;
                line.className = i === 0 ? "sim-map-tooltip-title" : "";
                return line;
            }));
            this.tooltipElement.style.display = "block";
            this.tooltip.setPosition(site.getGeometry().getCoordinates());
        },

        tooltipLines (site) {
            const lines = [site.get("einrichtung")];

            if (this.activeTab.type === "funding") {
                lines.push(site.get("rolle") === "Standort"
                    ? this.$t(T + "tooltip.spentHere", {value: formatEuro(site.get("foerderung_standort_eur")), traeger: site.get("traeger")})
                    : this.$t(T + "tooltip.paidHere", {value: formatEuro(site.get("foerderung_zahlung_eur")), count: site.get("standorte_anz")}));
            }
            else if (this.activeTab.type === "hours") {
                lines.push(`${isOpen(site.get("_intervals"), this.minute) ? this.$t(T + "tooltip.open") : this.$t(T + "tooltip.closed")} · ${site.get("oeffnungszeiten_text")}`);
            }
            else {
                lines.push(this.$t(T + "tooltip.reach", {
                    visits: formatNumber(site.get("besuche_woche")),
                    value: formatEuro(site.get("foerderung_standort_eur"))
                }));
            }
            return lines;
        },

        hideTooltip () {
            if (this.tooltipElement) {
                this.tooltipElement.style.display = "none";
            }
            if (this.map) {
                this.map.getTargetElement().style.cursor = "";
            }
        },

        // --- week clock ---------------------------------------------------

        togglePlay () {
            if (this.playing) {
                this.stop();
            }
            else {
                this.play();
            }
        },

        play () {
            this.playing = true;
            this.lastFrame = performance.now();
            this.frame = requestAnimationFrame(this.tick);
        },

        stop () {
            this.playing = false;
            cancelAnimationFrame(this.frame);
        },

        tick (now) {
            // Cap the step so a background tab does not jump hours ahead on return.
            const seconds = Math.min(0.1, (now - this.lastFrame) / 1000);

            this.lastFrame = now;
            this.minute = wrapMinute(this.minute + seconds * MINUTES_PER_SECOND * this.speed);
            this.frame = requestAnimationFrame(this.tick);
        },

        setNow () {
            const date = new Date();

            this.minute = (date.getDay() + 6) % 7 * MINUTES_PER_DAY + date.getHours() * 60 + date.getMinutes();
        },

        // --- navigation ---------------------------------------------------

        fitFeatures (features, padding = 250) {
            if (!features.length) {
                return;
            }
            const extent = features.reduce((acc, feature) => extend(acc, feature.getGeometry().getExtent()), createEmpty());

            this.map.getView().fit(buffer(extent, padding), {duration: 400});
        },

        zoomToTraeger (traegerId, siteId) {
            if (siteId) {
                this.fitFeatures([this.featureById.get(siteId)].filter(Boolean), 400);
                return;
            }
            this.fitFeatures([...this.featureById.values()].filter(site => site.get("traeger_id") === traegerId));
        },

        zoomToSite (siteId) {
            this.fitFeatures([this.featureById.get(siteId)].filter(Boolean), 600);
        },

        zoomToDistrict (name) {
            this.selectedDistrict = name;
            this.fitFeatures([this.districtByName.get(name)].filter(Boolean), 100);
        },

        /**
         * Hands the selected site over to the Erreichbarkeitsanalyse: opens it and
         * sets the site as its start point, through the same map-click path a user
         * click would take (the analysis starts in point mode and watches
         * Maps/clickCoordinate, and marks the point itself). The tree layer is
         * deliberately not switched on: that pops COSI's attribution dialog in
         * the middle of a demo.
         * @param {String} siteId - The site.
         * @returns {Promise<void>} Resolves once the analysis is opened.
         */
        async openAccessibilityAnalysis (siteId) {
            const site = this.featureById.get(siteId);

            if (!site) {
                return;
            }
            const type = this.accessibilityAnalysisType,
                  moduleName = type.charAt(0).toUpperCase() + type.slice(1),
                  coordinate = [...site.getGeometry().getCoordinates()];

            await this.$store.dispatch("Menu/changeCurrentComponent", {
                type,
                side: this.menuSide,
                props: {name: this.$store.getters[`Modules/${moduleName}/name`]}
            });
            // Give the analysis a moment to mount and choose its default mode.
            setTimeout(() => this.$store.commit("Maps/setClickCoordinate", coordinate), 600);
        }
    }
};
</script>

<template lang="html">
    <div id="social-infra-monitor">
        <ToolInfo
            :summary="$t('additional:modules.tools.cosi.socialInfraMonitor.description')"
            :url="{}"
        />
        <div
            class="sim-demo-note small mb-3"
            role="note"
        >
            <img
                :src="aiLabelUrl"
                :alt="$t('additional:modules.tools.cosi.socialInfraMonitor.aiLabel')"
                :title="$t('additional:modules.tools.cosi.socialInfraMonitor.aiLabelTitle')"
                class="sim-ai-label"
            >
            <span>{{ $t("additional:modules.tools.cosi.socialInfraMonitor.demoNote") }}</span>
        </div>
        <hr class="my-3 mx-0 text-black-50">
        <TabBar
            class="mb-3"
            :active-item="activeTab"
            :items="tabItems"
            :loading="loading"
            @change="activeTab = $event"
        />
        <div
            v-if="loadError"
            class="alert alert-danger small"
            role="alert"
        >
            {{ $t("additional:modules.tools.cosi.socialInfraMonitor.loadError") }} ({{ loadError }})
        </div>
        <template v-else-if="!loading">
            <FundingTab
                v-if="activeTab.type === 'funding'"
                v-model:categories="fundingCategories"
                v-model:show-all-networks="showAllNetworks"
                v-model:selected-traeger-id="selectedTraegerId"
                v-model:coloring="coloring"
                :sites="sites"
                :districts="districts"
                :coloring-legend="coloringInfo.legend"
                :max-euro="maxPaid"
                @zoom-traeger="zoomToTraeger"
                @zoom-district="zoomToDistrict"
            />
            <HoursTab
                v-else-if="activeTab.type === 'hours'"
                v-model:categories="hourCategories"
                v-model:minute="minute"
                v-model:speed="speed"
                v-model:selected-id="selectedHoursId"
                :sites="sites"
                :playing="playing"
                @toggle-play="togglePlay"
                @now="setNow"
            />
            <ReachTab
                v-else
                v-model:categories="reachCategories"
                v-model:selected-id="selectedReachId"
                v-model:sort="reachSort"
                :sites="sites"
                :max-visits="maxVisits"
                :max-euro="maxSpent"
                @open-accessibility="openAccessibilityAnalysis"
                @zoom-site="zoomToSite"
            />
        </template>
    </div>
</template>

<style lang="scss">
    // Shared by the tab components; namespaced to the tool.
    #social-infra-monitor {
        .sim-demo-note {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 6px 10px;
            border-left: 3px solid #3C5F94;
            background: rgba(60, 95, 148, 0.06);
            color: #52514e;
        }
        // The EU artwork keeps generous clear space around the pill (about half
        // the image height), so the image is sized up rather than cropped.
        .sim-ai-label {
            flex: none;
            height: 44px;
        }
        .sim-section-title {
            margin: 0 0 8px;
            font-weight: 600;
            color: #0b0b0b;
        }
        .sim-swatch {
            display: inline-block;
            flex: none;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            &.square {
                border-radius: 2px;
            }
        }
        .sim-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: 1px solid #c3c2b7;
            border-radius: 16px;
            background: #ffffff;
            color: #898781;
            &.active {
                border-color: #3C5F94;
                background: rgba(60, 95, 148, 0.08);
                color: #0b0b0b;
            }
        }
        .sim-tile {
            height: 100%;
            padding: 8px 10px;
            border: 1px solid rgba(11, 11, 11, 0.1);
            border-radius: 6px;
            background: #fcfcfb;
        }
        .sim-tile-label {
            font-size: 12px;
            color: #52514e;
        }
        .sim-tile-value {
            font-size: 18px;
            font-weight: 600;
            color: #0b0b0b;
        }
        .sim-legend-title {
            font-size: 12px;
            color: #52514e;
            margin-bottom: 4px;
        }
        .sim-card {
            padding: 12px;
            border: 1px solid rgba(11, 11, 11, 0.1);
            border-radius: 8px;
            background: #fcfcfb;
        }
        .sim-card-kicker {
            font-size: 12px;
            color: #52514e;
        }
        .sim-card-title {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
    }
    // Top left of the visible map, under the layer-menu toggle (left is set by
    // positionAiBadge); the bottom edge of the map runs under COSI's footer bar.
    .sim-ai-badge {
        position: absolute;
        top: 64px;
        left: 8px;
        img {
            display: block;
            height: 48px;
        }
    }
    .sim-map-tooltip {
        display: none;
        max-width: 280px;
        padding: 6px 8px;
        background: #ffffff;
        border: 1px solid rgba(11, 11, 11, 0.1);
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        font-size: 12px;
        color: #52514e;
        pointer-events: none;
        white-space: normal;
        .sim-map-tooltip-title {
            font-weight: 600;
            color: #0b0b0b;
        }
    }
</style>
