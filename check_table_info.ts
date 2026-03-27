import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
    try {
        const { client } = await import("./lib/db");
        const res = await client.execute("SELECT sql FROM sqlite_master WHERE name = 'users_old'");
        console.log("users_old table sql:", res.rows[0].sql);
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
