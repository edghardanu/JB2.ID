import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        console.log("Attempting to update a user role to 'peserta' in users_old...");
        // Get first user
        const res = await client.execute("SELECT id, name, role FROM users_old LIMIT 1");
        if (res.rows.length > 0) {
            const user = res.rows[0];
            console.log(`Current user: ${user.name}, role: ${user.role}`);
            
            // Try updating to 'peserta'
            await client.execute({
                sql: "UPDATE users_old SET role = 'peserta' WHERE id = ?",
                args: [user.id]
            });
            console.log("Update SUCCESSFUL! Role is now 'peserta'.");
            
            // Revert back for safety
            await client.execute({
                sql: "UPDATE users_old SET role = ? WHERE id = ?",
                args: [user.role, user.id]
            });
            console.log("Reverted role back to original.");
        } else {
            console.log("No users found in users_old.");
        }
    } catch (err: any) {
        console.error("Test FAILED:", err.message);
    }
}

main();
