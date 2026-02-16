import { supabaseServer } from "@/lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // 1️⃣ Create user in Auth
  const { data, error } = await supabaseServer.auth.admin.createUser({
    email,
    password,
    email_confirm: false, // set false for dev
    user_metadata: { name },
  });

  if (error) return res.status(400).json({ message: error.message });

  // 2️⃣ Insert into your public users table
  const { error: tableError } = await supabaseServer
    .from("auth")
    .insert([{ name, email, password }]);

  if (tableError) return res.status(400).json({ message: tableError.message });

  return res.status(201).json({
    message: "User registered successfully",
    user: {
      password: data.user.password,
      email: data.user.email,
      name: data.user.user_metadata?.name,
    },
  });
}