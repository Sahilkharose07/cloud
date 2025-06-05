import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const reset = url.searchParams.get("reset");

    if (reset === "true") {
      // Reset logic
      await client.execute({
        sql: `UPDATE certificate_report SET last_number = 0, genrate_num = NULL WHERE id = ?`,
        args: ["certificate"],
      });

      return NextResponse.json({ message: "Certificate number reset successfully." }, { status: 200 });
    }

    // Generate certificate number logic
    const now = new Date();
    const yearStart = String(now.getFullYear()).slice(-2);
    const yearEnd = String(now.getFullYear() + 1).slice(-2);
    const yearRange = `${yearStart}-${yearEnd}`;

    const result = await client.execute({
      sql: `SELECT last_number FROM certificate_report WHERE id = ? LIMIT 1`,
      args: ["certificate"],
    });

    let newNumber: number;
    let certificateNumber: string;

    if (result.rows.length === 0) {
      newNumber = 1;
      certificateNumber = `RPS/CER/${yearRange}/${String(newNumber).padStart(4, "0")}`;

      await client.execute({
        sql: `INSERT INTO certificate_report (id, last_number, genrate_num) VALUES (?, ?, ?)`,
        args: ["certificate", newNumber, certificateNumber],
      });
    } else {
      const last = result.rows[0].last_number as number;
      newNumber = last + 1;
      certificateNumber = `RPS/CER/${yearRange}/${String(newNumber).padStart(4, "0")}`;

      await client.execute({
        sql: `UPDATE certificate_report SET last_number = ?, genrate_num = ? WHERE id = ?`,
        args: [newNumber, certificateNumber, "certificate"],
      });
    }

    return NextResponse.json({ certificateNumber }, { status: 200 });
  } catch (err) {
    console.error("Error processing request:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
  