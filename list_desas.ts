import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
    try {
        const { client } = await import("./lib/db");
        const res = await client.execute("SELECT * FROM desa");
        console.log("Desa table content:", JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
