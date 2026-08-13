import {fileURLToPath} from "url";
import {loadSuppressions, validateSuppressions} from "./osvSuppressions.mjs";

const suppressionsPath = fileURLToPath(new URL("./osvSuppressions.json", import.meta.url));
let entries;

try {
    entries = loadSuppressions(suppressionsPath);
}
catch (error) {
    console.error(`Cannot read the OSV suppression file: ${error.message}`);
    process.exit(1);
}

const errors = validateSuppressions(entries);

if (errors.length > 0) {
    console.error(`The OSV suppression file has ${errors.length} problem(s):`);
    errors.forEach(message => console.error(`  ${message}`));
    process.exit(1);
}

console.log(`OSV suppression file is valid, ${entries.length} entries.`);
