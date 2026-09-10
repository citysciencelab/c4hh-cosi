const interactionEvents = ["pointerdown", "mousemove", "keydown", "wheel", "scroll", "touchstart"],
    interactionListenerOptions = {capture: true, passive: true},
    interactionGracePeriod = 1500;
let hasInteracted = false;

/**
 * Marks the client as having interacted and detaches all interaction listeners.
 * @returns {void}
 */
function onInteraction () {
    hasInteracted = true;
    interactionEvents.forEach(eventName => window.removeEventListener(eventName, onInteraction, interactionListenerOptions));
}

// Registered on module evaluation so interactions before the first tracked event are recognized.
interactionEvents.forEach(eventName => window.addEventListener(eventName, onInteraction, interactionListenerOptions));

/**
 * Collects several client side indicators that hint at an automated client (bot, crawler, headless browser).
 * Each matching indicator adds to a score; a low score means the client is most likely a real user.
 * @returns {Promise<{isCredible: Boolean, reasons: String[], score: Number}>} The result of the credibility check.
 */
export async function checkClientCredibility () {
    let score = 0;
    const reasons = [];

    if (navigator.webdriver === true) {
        score += 40;
        reasons.push("webdriver");
    }

    const ua = navigator.userAgent.toLowerCase(),
        botPatterns = [
            "headlesschrome",
            "phantomjs",
            "selenium",
            "playwright",
            "puppeteer",
            "crawler",
            "spider",
            "bot",
            "curl",
            "wget"
        ];

    if (botPatterns.some(x => ua.includes(x))) {
        score += 40;
        reasons.push("userAgent");
    }

    const automationProperties = [
            "__webdriver_evaluate",
            "__selenium_evaluate",
            "__webdriver_script_function",
            "__fxdriver_evaluate",
            "__driver_evaluate",
            "_phantom",
            "callPhantom",
            "__nightmare",
            "domAutomation",
            "domAutomationController",
            "_selenium"
        ],
        hasDriverProperty = Object.keys(document).some(key => key.startsWith("$cdc_") || key.startsWith("$wdc_"));

    if (automationProperties.some(property => property in window) || hasDriverProperty) {
        score += 40;
        reasons.push("automation");
    }

    const platform = (navigator.userAgentData?.platform || navigator.platform || "").toLowerCase();

    if (platform !== "" && (
        ua.includes("windows") && !platform.startsWith("win") ||
        ua.includes("macintosh") && !platform.startsWith("mac")
    )) {
        score += 5;
        reasons.push("platform");
    }

    if (!navigator.languages || navigator.languages.length === 0) {
        score += 10;
        reasons.push("languages");
    }

    if (navigator.cookieEnabled === false) {
        score += 5;
        reasons.push("cookies");
    }

    if (
        screen.width === 0
        || screen.height === 0
        || window.outerWidth === 0
        || window.outerHeight === 0
    ) {
        score += 20;
        reasons.push("width/height");
    }

    if (navigator.maxTouchPoints === 0 && window.matchMedia("(pointer: coarse)").matches) {
        score += 5;
        reasons.push("touch");
    }

    try {
        const permission = await navigator.permissions.query({name: "notifications"});

        if (Notification.permission === "denied" && permission.state === "prompt") {
            score += 10;
            reasons.push("permissions");
        }

    }
    catch { /* */ }

    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 1) {
        score += 5;
        reasons.push("cpu");
    }

    if (navigator.deviceMemory && navigator.deviceMemory < 1) {
        score += 5;
        reasons.push("memory");
    }

    try {
        const canvas = document.createElement("canvas"),
            gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

        if (!gl) {
            score += 5;
            reasons.push("webgl");
        }
        else {
            const debug = gl.getExtension("WEBGL_debug_renderer_info");

            if (debug) {
                const renderer = gl.getParameter(debug.UNMASKED_RENDERER_WEBGL);

                if (renderer.toLowerCase().includes("swiftshader")) {
                    score += 5;
                    reasons.push("swiftshader");
                }
            }
        }
    }
    catch { /* */ }

    if (!hasInteracted) {
        await new Promise(resolve => setTimeout(resolve, interactionGracePeriod));
    }

    if (!hasInteracted) {
        score += 10;
        reasons.push("interaction");
    }

    return {
        isCredible: score < 40,
        reasons,
        score
    };
}
