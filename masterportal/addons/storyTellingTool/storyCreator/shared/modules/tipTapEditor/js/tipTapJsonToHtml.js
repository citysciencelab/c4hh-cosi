import {generateHTML} from "@tiptap/core";
import tipTapExtensions from "./tipTapExtensions";

/**
 * Converts TipTap JSON content to HTML.
 * @param {Object} content TipTap content as JSON document.
 * @param {Array} [extensions=tipTapExtensions] TipTap extensions used for conversion.
 * @returns {string} HTML representation of the provided content.
 */
export default function tipTapJsonToHtml (content, extensions = tipTapExtensions) {
    return generateHTML(content, extensions);
}
