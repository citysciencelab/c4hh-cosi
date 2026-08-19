/**
 * Gets a direct video object.
 * @param {String} val - the link text
 * @returns {Object[]} the filtered video type
 */
function getDirectVideo (val) {
    if (typeof val !== "string") {
        return [];
    }

    const validVideoTypes = [
        {type: "mp4", content: "video/mp4"},
        {type: "webm", content: "video/webm"},
        {type: "ogg", content: "video/ogg"},
        {type: "mov", content: "video/quicktime"},
        {type: "m4v", content: "video/x-m4v"},
        {type: "avi", content: "video/x-msvideo"},
        {type: "mkv", content: "video/x-matroska"},
        {type: "flv", content: "video/x-flv"},
        {type: "wmv", content: "video/x-ms-wmv"},
        {type: "3gp", content: "video/3gpp"}
    ];

    return validVideoTypes.filter(video => val.toLowerCase().includes("." + video.type));
}

/**
 * Gets embed youtube link.
 * @param {String} url - the link text
 * @returns {String} the embed link.
 */
function getEmbedLink (url) {
    if (typeof url !== "string") {
        return "";
    }

    let videoId = "",
        parsedUrl = "";

    try {
        parsedUrl = new URL(url);
    }
    catch (e) {
        console.warn(e);
        return "";
    }

    if (parsedUrl.hostname === "youtu.be") {
        videoId = parsedUrl.pathname.slice(1);
    }
    else if (parsedUrl.pathname === "/watch") {
        videoId = parsedUrl.searchParams.get("v");
    }
    else if (parsedUrl.pathname.startsWith("/shorts/")) {
        videoId = parsedUrl.pathname.split("/")[2];
    }
    else if (parsedUrl.pathname.startsWith("/embed/")) {
        videoId = parsedUrl.pathname.split("/")[2];
    }

    if (!videoId) {
        return url;
    }

    return "https://www.youtube-nocookie.com/embed/" + videoId;
}

export {
    getDirectVideo,
    getEmbedLink
};
