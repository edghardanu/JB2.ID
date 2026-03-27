import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
    try {
        const { client } = await import("./lib/db");
        const res1 = await client.execute("SELECT count(*) as count FROM users");
        const res2 = await client.execute("SELECT count(*) as count FROM users_old");
        console.log("users table count:", res1.rows[0].count);
        console.log("users_old table count:", res2.rows[0].count);
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
