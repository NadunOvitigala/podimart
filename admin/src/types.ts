export type AdminSeller = {
  id: string;
  name: string;
  slug: string;
  city: string;
  email: string;
  whatsapp: string;
  phone: string;
  product_count?: number;
  created_at?: string;
};

export type AdminProduct = {
  id: string;
  seller_id: string;
  seller_slug: string;
  seller_name: string;
  city: string;
  category: string;
  name: string;
  description: string;
  price: number;
  lead_time: string;
  image_url: string;
  code?: string;
  status?: string;
  created_at?: string;
};

export type AdminUser = {
  email: string;
  name: string;
  status: string;
  created_at?: string;
  shop_name: string;
  shop_slug: string;
  is_admin: boolean;
  granted_at?: string;
};
