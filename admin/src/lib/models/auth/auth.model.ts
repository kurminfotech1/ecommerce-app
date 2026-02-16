import { supabaseAdmin } from "@/lib/supabaseServer";

export const AuthModel = {
  async createUser(payload: {
    email: string;
    password: string;
    full_name?: string;
    role?: string;
  }) {
    // create auth user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      role: payload.role
    });

    if (error) throw error;

    // insert into public.users
    const { error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: data.user.id,
        email: data.user.email,
        full_name: payload.full_name ?? null,
        role: payload.role
      });

    if (insertError) throw insertError;

    return data.user;
  },
};