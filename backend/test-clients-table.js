const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testClientsTable() {
  try {
    console.log("Testing clients table...");

    // Try to select from clients table
    const { data, error } = await supabase.from("clients").select("*").limit(1);

    if (error) {
      console.error("Error accessing clients table:", error);
      return;
    }

    console.log("✅ Clients table exists and is accessible");
    console.log("Sample data:", data);

    // Check table structure
    const { data: structure, error: structureError } = await supabase
      .from("clients")
      .select("*")
      .limit(0);

    if (structureError) {
      console.error("Error checking structure:", structureError);
    } else {
      console.log("✅ Table structure is valid");
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testClientsTable();
