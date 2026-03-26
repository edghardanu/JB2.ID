import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
    try {
        const { client } = await import("./lib/db");
        const res = await client.execute("PRAGMA table_info(desa)");
        console.log("desa table info:", JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
