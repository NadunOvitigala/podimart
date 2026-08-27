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

export type AdminOrder = {
  id: string;
  reference: string;
  status: string;
  product_id: string;
  product_name: string;
  product_code: string;
  seller_id: string;
  seller_name: string;
  quantity: number;
  unit_price: number;
  items_total: number;
  delivery_charge: number;
  total: number;
  total_label: string;
  variant_label: string;
  payment_method: string;
  payment_method_label: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  note: string;
  created_at: string;
};

export type AdminStats = {
  orders_today: number;
  orders_this_month: number;
  orders_total: number;
  revenue_today: number;
  revenue_this_month: number;
  revenue_total: number;
  shops_this_month: number;
  shops_total: number;
  products_this_month: number;
  products_total: number;
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
