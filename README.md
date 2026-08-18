# Podimart

Buyer marketplace. Home businesses list on **sellercenter**; buyers browse here and contact makers on WhatsApp, call, or email.

No custom domain yet. Localhost for development, **AWS default DNS** (CloudFront) for deploy.

## Run locally

You need Node 20+. Listings come from the **sellercenter API** — do not start this repo’s `backend/`.

```powershell
cd E:\Git\podimart\frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` to
`https://4a23sc77m1.execute-api.ap-south-1.amazonaws.com`. Photos use
`https://dw5k13qjwhs1y.cloudfront.net`.

**Log in / Open a free shop** use `VITE_SELLERCENTER_URL` (`https://dg5gf98ivabpi.cloudfront.net`).

## Deploy the buyer site (AWS)

This stack is **S3 + CloudFront only**. Do not deploy an API from this repo.

```powershell
cd E:\Git\podimart\infra
sam deploy
```

Then:

```powershell
cd E:\Git\podimart\frontend
npm run build
aws s3 sync dist/ s3://podimart-web-363018627930 --delete --region ap-south-1
aws cloudfront create-invalidation --distribution-id E5LPWPB0E54T8 --paths "/*"
```

The sellercenter API CORS list must include the buyer CloudFront origin (`BuyerSiteOrigin`).

## AWS URLs (no podimart.lk yet)

| Piece | URL |
|---|---|
| Buyer site | `https://d26jjlyflvm3tp.cloudfront.net` |
| Sellercenter | `https://dg5gf98ivabpi.cloudfront.net` |
| API | `https://4a23sc77m1.execute-api.ap-south-1.amazonaws.com` |
| Photos | `https://dw5k13qjwhs1y.cloudfront.net` |

A custom domain (`podimart.lk`) can be attached later in Route 53.

## What this repo includes

- Buyer site: home, category + city browse, seller shop, product page
- Contact via WhatsApp, call, email (no payments)
- Seller auth, DynamoDB, and photos live in **podimart-sellercenter**
