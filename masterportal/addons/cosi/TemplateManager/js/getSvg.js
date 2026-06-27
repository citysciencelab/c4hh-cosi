import dayjs from "dayjs";

/**
 * Returns the svg for footer
 * @param {number} currentPage - The number of current page
 * @param {number} pageCount - The total number of pages
 * @param {string} author - The author
 * @returns {Object} svg as Object
 */
function getSvg (currentPage, pageCount, author) {
    return {
        svg: "<svg\n" +
            "   width=\"595\"\n" +
            "   height=\"60\"\n" +
            "   viewBox=\"0 0 157.42708 15.875\"\n" +
            "   version=\"1.1\"\n" +
            "   id=\"svg1\"\n" +
            "   xml:space=\"preserve\"\n" +
            "   inkscape:version=\"1.3.2 (091e20e, 2023-11-25, custom)\"\n" +
            "   sodipodi:docname=\"Zeichnung-2.svg\"\n" +
            "   inkscape:export-filename=\"Zeichnung-3.svg\"\n" +
            "   inkscape:export-xdpi=\"96\"\n" +
            "   inkscape:export-ydpi=\"96\"\n" +
            "   xmlns:inkscape=\"http://www.inkscape.org/namespaces/inkscape\"\n" +
            "   xmlns:sodipodi=\"http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd\"\n" +
            "   xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
            "   xmlns=\"http://www.w3.org/2000/svg\"\n" +
            "   xmlns:svg=\"http://www.w3.org/2000/svg\"><sodipodi:namedview\n" +
            "     id=\"namedview1\"\n" +
            "     pagecolor=\"#ffffff\"\n" +
            "     bordercolor=\"#000000\"\n" +
            "     borderopacity=\"0.25\"\n" +
            "     inkscape:showpageshadow=\"2\"\n" +
            "     inkscape:pageopacity=\"0.0\"\n" +
            "     inkscape:pagecheckerboard=\"0\"\n" +
            "     inkscape:deskcolor=\"#d1d1d1\"\n" +
            "     inkscape:document-units=\"mm\"\n" +
            "     inkscape:zoom=\"1.9578168\"\n" +
            "     inkscape:cx=\"298.29145\"\n" +
            "     inkscape:cy=\"52.354235\"\n" +
            "     inkscape:window-width=\"1863\"\n" +
            "     inkscape:window-height=\"991\"\n" +
            "     inkscape:window-x=\"2391\"\n" +
            "     inkscape:window-y=\"-9\"\n" +
            "     inkscape:window-maximized=\"1\"\n" +
            "     inkscape:current-layer=\"layer1\" /><defs\n" +
            "     id=\"defs1\" /><g\n" +
            "     inkscape:label=\"Ebene 1\"\n" +
            "     inkscape:groupmode=\"layer\"\n" +
            "     id=\"layer1\"><rect\n" +
            "       style=\"fill:#003063;fill-opacity:1;stroke-width:2.72967\"\n" +
            "       id=\"rect1\"\n" +
            "       width=\"157.43767\"\n" +
            "       height=\"11.1125\"\n" +
            "       x=\"0\"\n" +
            "       y=\"4.7624998\" /><image\n" +
            "       width=\"29.104166\"\n" +
            "       height=\"8.2020836\"\n" +
            "       preserveAspectRatio=\"none\"\n" +
            "       xlink:href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAz4AAADtCAYAAAB+iaDEAAAABmJLR0QA/wD/AP+gvaeTAAAACXBI&#10;WXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH4gkGDBs7rgT2XgAACh1JREFUeNrt3c9xWlkaxuGXqQlg&#10;tqzOhEAICkEh3MnAzgAyQBlYGUAGkAFkwF2drYiAXrS7ytXT7ZZt8e/jeap60bYlwavVr87RVQIA&#10;AFDcZMz0ZAYAAKCoY0v/z7/sAAAAFPacJMIHAACo6qWlb4QPAABQ1Zhk/sf/CB8AAKCi55b+JnwA&#10;AICqFi199+0feKobAABQyb6lz/78h058AACAKo5Jhr/6C+EDAABUMf/zFTfhAwAAVLJt6cu/+0vh&#10;AwAA3Ltjvv6iUuEDAABUNXz76GrhAwAAVLNu6at/+kfCBwAAuFdj/uYpbsIHAACo4h+vuAkfAADg&#10;nr209M17/7HwAQAA7s0+yfxHPkD4AAAA9+bdV9yEDwAAcI8WLX33ox80GTM92Q4AALgD25b+9DMf&#10;6MQHAAC4B8e889HVwgcAALhX85Z+ED4AAEBV65a+/JVPIHwAAIBb9ktX3IQPAABwD3740dXCBwAA&#10;uCevLX31EZ9I+AAAALdoTPLpoz6Z8AEAAG7Rh1xxEz4AAMCtWrT0zUd+wsmY6cmuAADAjdi39NlH&#10;f1InPgAAwC0ZzvFJhQ8AAHArPrf0nfABAACq2rb05bk+ufABAACu7ZgzXXETPgAAwK341NIPwgcA&#10;AKhq3dK/nPuLCB8AAOBazn7FTfgAAADX9tzS34QPAABQ1UtL31zqiwkfAADg0sYk80t+QeEDAABc&#10;2sWuuAkfAADgGhYtfXfpLzoZMz3ZHgAAuIB9S59d4ws78QEAAC7hYo+uFj4AAMC1zK9xxU34AAAA&#10;l7Jt6ctrvgDhAwAAnNMxyfO1X4TwAQAAzmm49KOrhQ8AAHBJ65a+uoUXInwAAIBzGHPFp7gJHwAA&#10;4BJu4oqb8AEAAM7lpaVvbukFCR8AAOAj7ZPMb+1FCR8AAOAj3dQVN+EDAAB8tEVL393iC5uMmZ58&#10;fwAAgF+0belPt/rinPgAAAC/6pgbenS18AEAAM5h3tIPwgcAAKhq3dKXt/4ihQ8AAPCzbv6Km/AB&#10;AAB+1U0+ulr4AAAAH+W1pa/u5cUKHwAA4EeNST7d0wsWPgAAwI+6mytuwgcAAPgZi5a+ubcXPRkz&#10;PfneAQAA77Bv6bN7fOFOfAAAgPca7vWFCx8AAOA9Prf0nfABAACq2rb05T2/AeEDAAB8zzF3fMVN&#10;+AAAAO8xtPSD8AEAAKpat/RVhTcifAAAgL9S4oqb8AEAAL7nuaW/CR8AAKCql5a+qfSGhA8AAPCt&#10;Mcm82psSPgAAwLdKXXETPgAAwJ8tWvqu4hubjJmefH8BAODh7Vv6rOqbc+IDAAAckzxXfoPCBwAA&#10;mLf0g/ABAACq2rb0ZfU3KXwAAOBxlb/iJnwAAICh4qOrhQ8AAPCHdUtfPcqbFT4AAPB4xiTDI71h&#10;4QMAAI/nYa64CR8AAHhMLy1982hvejJmevK9BwCAh7Bv6bNHfONOfAAA4HEMj/rGhQ8AADyGRUvf&#10;Peqbd9UNAADq27b0p0cewIkPAADUdswDX3ETPgAA8Bg+tfSD8AEAAKpat/QvZhA+AABQlStuwgcA&#10;AMobWvqbGYQPAABU9dLSV2YQPgAAUNWYZG4G4QMAAJW54iZ8AACgtEVL35jh/03GTE9mAACAu7dv&#10;6TMz/DUnPgAAcP88ulr4AABAefOWvjOD8AEAgKq2LX1pBuEDAABVueImfAAAoLyhpR/MIHwAAKCq&#10;dUtfmUH4AABAVWNccRM+AABQ3NDS38wgfAAAoKqXlr4xg/ABAICq9knmZhA+AABQmStuwgcAAEpb&#10;tPSdGX7OZMz0ZAYAALhp25b+ZIaf58QHAABu2zEeXS18AACguHlLP5hB+AAAQFXrlr40g/ABAICq&#10;XHETPgAAUJ5HVwsfAAAo7bWlr8wgfAAAoKoxySczCB8AAKjMFTfhAwAApS1a+sYMH28yZnoyAwAA&#10;XN2+pc/McB5OfAAA4DYMJhA+AABQ2eeWvjOD8AEAgKq2LX1pBuEDAABVHeOKm/ABAIDihpZ+MIPw&#10;AQCAqtYtfWUG4QMAAFW54iZ8AACgvOeW/mYG4QMAAFW9tPSNGYQPAABUtU8yN4PwAQCAygZX3IQP&#10;AABUtmjpOzNcx2TM9GQGAAA4q31Ln5nhepz4AADAeR2TPJtB+AAAQGXzln4wg/ABAICq1i19aQbh&#10;AwAAVR2TDGYQPgAAUJlHVwsfAAAo7bWlr8wgfAAAoKoxySczCB8AAKjMFTfhAwAApS1a+sYMt2cy&#10;ZnoyAwAA/LJ9S5+Z4TY58QEAgI8xmED4AABAZZ9b+s4MwgcAAKratvSlGYQPAABUdYwrbsIHAACK&#10;G1r6wQzCBwAAqlq39JUZhA8AAFTlipvwAQCA8p5b+psZhA8AAFT10tI3ZhA+AABQ1T7J3AzCBwAA&#10;KhtccRM+AABQ2aKl78xwnyZjpiczAADAd+1b+swM98uJDwAAfN8xybMZhA8AAFQ2b+kHMwgfAACo&#10;at3Sl2YQPgAAUNUxyWAG4QMAAJV5dLXwAQCA0l5a+soMwgcAAKoak8zNIHwAAKAyV9yEDwAAlLZo&#10;6Rsz1DMZMz2ZAQAAsm/pMzPU5MQHAAA8ulr4AADAA5i39J0ZhA8AAFS1belLMwgfAACoyhU34QMA&#10;AOUNLf1gBuEDAABVrVv6ygzCBwAAqhrjipvwAQCA4oaW/mYG4QMAAFW9tPSNGR7LZMz0ZAYAAB7E&#10;vqXPzPB4nPgAAPBIBhMIHwAAqOxzS9+ZQfgAAEBV25a+NIPwAQCAqo5xxU34mAAAgOKGln4wg/AB&#10;AICq1i19ZQaEDwAAVY1xxQ3hAwBAcUNLfzMDwgcAgKoWLX1jBv4wGTM9mQEAgEL2LX1mBr7lxAcA&#10;gEo8uhrhAwBAeZ9a+s4MCB8AAKpat/QvZkD4AABQlUdXI3wAACjv2aOrET4AAFT22c/1IHwAAKhs&#10;3dKXZkD4AABQlZ/rQfgAAFDaMX6uB+EDAEBxfl8PwgcAgNJe/b4ehA8AAJXtW/pgBoQPAABVjUme&#10;zIDwAQCgKg8zQPgAAFCehxkgfAAAKO2zhxkgfAAAqOy1pS/NgPABAKCqrSe4IXwAAKhsn+TZDAgf&#10;AAAqR8+TJ7ghfAAAqOqYZBA9CB8AACpHz5PHViN8AAAQPSB8AAAQPSB8AAAQPQgfAAAQPQgfAAAQ&#10;PQgfAAAQPQgfAAAe2T7Jf0UPwgcAgKq2+f2kxy8n5eL+bQIAAC7gtaUPZuBanPgAAHBu/xM9XJsT&#10;HwAAzmVM8uznebgFTnwAADiHlyQz0cOtcOIDAMBHGpMMLX1jCm6JEx8AAD7KIr+f8ogebo4THwAA&#10;ftVrknlLP5gC4QMAQDXbr8GzMQXCBwCAal6TfBE8CB8AAKo5JvmSZOlKG8IHAIBq1klWLf2LKRA+&#10;AABUss/vpzsrpzsIHwAAqjgmWSXZfI2dN5MgfAAAuHdjkt3X0Nm09J1JED4AANyzbZLD1/82SXZO&#10;dHhEvwFwchiTou4UQwAAAABJRU5ErkJggg==&#10;\"\n" +
            "       id=\"image1\"\n" +
            "       x=\"-8.8817842e-16\"\n" +
            "       y=\"0\" /><text\n" +
            "       xml:space=\"preserve\"\n" +
            "       style=\"font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:2.11667px;font-family:HamburgSans;-inkscape-font-specification:HamburgSans;text-align:center;text-anchor:middle;fill:#000000;stroke-width:0.264583\"\n" +
            "       x=\"149.69656\"\n" +
            "       y=\"11.192586\"\n" +
            "       id=\"text1\"><tspan\n" +
            "         id=\"tspan1\"\n" +
            "         style=\"font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:2.11667px;font-family:HamburgSans;-inkscape-font-specification:HamburgSans;fill:#fffff0;fill-opacity:1;stroke-width:0.264583\"\n" +
            "         x=\"149.69656\"\n" +
            "         y=\"11.192586\"\n" +
            "         sodipodi:role=\"line\">" + getPageStr(currentPage, pageCount) + "</tspan></text><text\n" +
            "       xml:space=\"preserve\"\n" +
            "       style=\"font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:2.11667px;line-height:0px;font-family:HamburgSans;-inkscape-font-specification:HamburgSans;text-align:start;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;direction:ltr;text-anchor:start;fill:#fffff0;fill-opacity:1;stroke-width:0.264587\"\n" +
            "       x=\"3.1877329\"\n" +
            "       y=\"10.982446\"\n" +
            "       id=\"text2\"><tspan\n" +
            "         id=\"tspan2\"\n" +
            "         style=\"font-size:2.11667px;text-align:start;text-anchor:start;stroke-width:0.264587\"\n" +
            "         x=\"3.1877329\"\n" +
            "         y=\"10.982446\"\n" +
            "         sodipodi:role=\"line\">" + getAuthor(author) + "</tspan></text><text\n" +
            "       xml:space=\"preserve\"\n" +
            "       style=\"font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:1.85208px;line-height:0px;font-family:HamburgSans;-inkscape-font-specification:HamburgSans;text-align:center;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;direction:ltr;text-anchor:middle;fill:#fffff0;fill-opacity:1;stroke-width:0.264583\"\n" +
            "       x=\"82.322624\"\n" +
            "       y=\"10.982323\"\n" +
            "       id=\"text3\"><tspan\n" +
            "         sodipodi:role=\"line\"\n" +
            "         id=\"tspan3\"\n" +
            "         style=\"font-size:2.11667px;stroke-width:0.264583\"\n" +
            "         x=\"82.322624\"\n" +
            "         y=\"10.982323\">Erstellt am: " + getDate() + "</tspan><tspan\n" +
            "         sodipodi:role=\"line\"\n" +
            "         style=\"font-size:1.85208px;stroke-width:0.264583\"\n" +
            "         x=\"82.322624\"\n" +
            "         y=\"10.982323\"\n" +
            "         id=\"tspan6\" /></text></g></svg>"
    };
}

/**
 * Returns the author with its label if the author is not empty.
 * @param {string} author - The given author.
 * @returns {string} author and its label or empty string.
 */
function getAuthor (author) {
    if (author === "" || typeof author === "undefined") {
        return "";
    }

    return "Ersteller:in: " + author;
}

/**
 * Returns date as string in DD.MM.YYYY format.
 * @returns {string} date as string.
 */
function getDate () {
    return dayjs(new Date()).format("DD.MM.YYYY");
}

/**
 * Returns the page counter as a string for the page footer.
 * @param {number} currentPage - The current page number.
 * @param {number} pageCount - The total number of pages.
 * @returns {string} - The page counter string.
 */
function getPageStr (currentPage, pageCount) {
    if (typeof currentPage !== "number" || typeof pageCount !== "number") {
        return "";
    }

    return "Seite " + currentPage.toString() + "/" + pageCount;
}

export {
    getSvg
};
