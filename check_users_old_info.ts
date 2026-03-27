import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
    try {
        const { client } = await import("./lib/db");
        const res = await client.execute("PRAGMA table_info(users_old)");
        console.log("users_old table info:");
        res.rows.forEach(row => {
            console.log(`- ${row.name} (${row.type})`);
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
