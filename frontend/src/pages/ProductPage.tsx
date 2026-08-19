import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api, formatPrice, mediaUrl, productCode } from "../api";
import { ContactActions } from "../components/ContactActions";
import type { Product, Seller } from "../types";

function listingPhotos(product: Product): string[] {
  const urls = (product.image_urls ?? []).filter(Boolean);
  if (product.image_url && !urls.includes(product.image_url)) {
    return [product.image_url, ...urls];
  }
  return urls.length ? urls : product.image_url ? [product.image_url] : [];
}

export function ProductPage() {
  const { id = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    api
      .product(id)
      .then((data) => {
        setProduct(data.product);
        setSeller(data.seller);
        setActive(0);
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  const photos = useMemo(() => (product ? listingPhotos(product) : []), [product]);
  const current = photos[active] || photos[0] || "";

  if (error) {
    return (
      <div className="wrap" style={{ paddingTop: 40 }}>
        <p className="error">{error}</p>
      </div>
    );
  }
  if (!product) return <div className="wrap" style={{ paddingTop: 40 }}>Loading…</div>;

  return (
    <div className="wrap product-layout">
      <div>
        {current ? (
          <img
            src={mediaUrl(current)}
            alt={product.name}
            style={{ width: "100%", borderRadius: 18, minHeight: 320, objectFit: "cover" }}
          />
        ) : null}
        {photos.length > 1 ? (
          <div className="product-thumbs">
            {photos.map((url, index) => (
              <button
                key={url}
                type="button"
                className={index === active ? "is-active" : ""}
                onClick={() => setActive(index)}
              >
                <img src={mediaUrl(url)} alt="" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div>
        <span className="chip">{product.city}</span>
        <h1>{product.name}</h1>
        <p className="muted">Product ID: {productCode(product)}</p>
        <p className="muted">Quote this Product ID when you call or WhatsApp the seller.</p>
        <p className="price" style={{ fontSize: 22 }}>
          {formatPrice(product.price)}
        </p>
        <p>{product.description}</p>
        <p className="muted">Lead time: {product.lead_time}</p>
        <p className="muted">By {product.seller_name}</p>
        {seller ? (
          <div className="panel" style={{ marginTop: 20 }}>
            <ContactActions seller={seller} product={product} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
