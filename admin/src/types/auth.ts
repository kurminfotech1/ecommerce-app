export interface Admin {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  phone: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  postal_code: string | null;
  createdAt: string;
}
