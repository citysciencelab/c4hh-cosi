import {defineStore} from "pinia";
import actionsAbout from "./actionsAbout.js";

/**
 * @module modules/About/store/aboutStore
 * @typedef {Object} AboutState
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} icon Icon next to name.
 * @property {String} name Name of this module.
 * @property {String} menuSide Specifies in which menu the about should be rendered.
 * @property {String} type The type of the module.
 * @property {String} abstractText The abstract info text.
 * @property {Object|null} contact The metadata contact.
 * @property {String} cswUrl The CSW metadata URL.
 * @property {String} logo The Masterportal logo.
 * @property {String} logoLink The link behind the Masterportal logo.
 * @property {String} logoText The alternate text if the Masterportal logo cannot be displayed.
 * @property {String} metaDataCatalogueId ID of the metadata catalogue.
 * @property {String} metaId ID of the metadata.
 * @property {String} metaUrl The metadata URL.
 * @property {String} noMetadataLoaded No metadata loaded text.
 * @property {Boolean} showAdditionalMetaData Parameter to show the metadata link for more information.
 * @property {String} title The metadata title.
 * @property {String|Boolean} version The current Masterportal version.
 * @property {String} versionLink Link behind the Masterportal version.
 * @property {String} ustId Sales tax identification number.
 * @property {String} privacyStatementText Text for data privacy section.
 * @property {String} privacyStatementUrl URL to data privacy policy site.
 * @property {String} accessibilityText Text for accessibility section.
 * @property {String} accessibilityUrl URL to accessibility site.
 * @property {Boolean} hideImprintInFooter Whether to hide the imprint link in the footer.
 */

export const useAboutStore = defineStore("about", {
    state: () => ({
        description: "common:modules.about.description",
        icon: "bi-info-circle",
        name: "common:modules.about.name",
        menuSide: "mainMenu",
        type: "about",

        abstractText: "",
        contact: null,
        cswUrl: "",
        logo: `${MASTERPORTAL_ASSETS_PATH}/Logo_Masterportal.svg`,
        logoLink: "https://masterportal.org",
        logoText: "Masterportallogo",
        metaDataCatalogueId: "2",
        metaId: "",
        metaUrl: "",
        noMetadataLoaded: "",
        showAdditionalMetaData: true,
        title: "",
        version: true,
        versionLink: "https://bitbucket.org/geowerkstatt-hamburg/masterportal/downloads/",
        ustId: "",
        privacyStatementText: "",
        privacyStatementUrl: "",
        accessibilityText: "",
        accessibilityUrl: "",
        hideImprintInFooter: false
    }),

    actions: {
        ...actionsAbout
    }
});
