# Joe's Crypto — Static Website

This is a small static single-page application that lets you track holdings of major cryptocurrencies and fetches live USD prices from the free CoinGecko API.

Files:
- `index.html` — main page
- `styles.css` — styles
- `script.js` — client-side logic (CoinGecko API calls, localStorage portfolio)
- `deploy.sh` — helper script to create a public S3 bucket and deploy (example)
- `bucket-policy.json` — sample bucket policy to make objects publicly readable

Live prices come from CoinGecko (no API key required): https://www.coingecko.com/en/api

---

## How it works

- Choose a coin from the list, enter how many you own, and click "Add / Update Holding".
- The site stores holdings in your browser's `localStorage`.
- When holdings exist, the site fetches current USD prices for those coins from CoinGecko's `/simple/price` endpoint and shows each holding's USD value plus a total.

---

## Deploy to AWS S3 (static site)

Prerequisites:
- AWS CLI installed and configured with credentials that can create buckets and put objects.
- A unique S3 bucket name (S3 bucket names are global).

Example steps (replace `your-unique-bucket-name` with something globally unique and `us-east-1` with your region):

1. Make a bucket:
   - aws s3 mb s3://your-unique-bucket-name --region us-east-1

2. Enable static website hosting:
   - aws s3 website s3://your-unique-bucket-name --index-document index.html --error-document index.html

3. Upload site files:
   - aws s3 sync . s3://your-unique-bucket-name --acl public-read --exclude "deploy.sh" --exclude "bucket-policy.json"

4. (Optional) Set a public bucket policy:
   - Save `bucket-policy.json` locally and run:
     aws s3api put-bucket-policy --bucket your-unique-bucket-name --policy file://bucket-policy.json

5. Visit your site:
   - http://your-unique-bucket-name.s3-website-us-east-1.amazonaws.com
   - If you used a different region, update the domain accordingly (look at the S3 website endpoint in the AWS console).

Note: Using `--acl public-read` when syncing is a simple approach; for production consider using CloudFront + OAI or restricting via a bucket policy.

---

## About the API

This site uses CoinGecko's public API:
- Endpoint used: `/api/v3/simple/price?ids={ids}&vs_currencies=usd`
- CoinGecko allows client-side requests (CORS enabled) and doesn't require an API key for this endpoint. Respect their rate limits and terms of service.

---

## Customization ideas

- Add more coins to `COINS` in `script.js`.
- Show historic price charts using CoinGecko's market chart endpoints.
- Use CloudFront for HTTPS and better caching.
- Add authentication and a server-side component if you want synced multi-device portfolios.

If you want, I can:
- Commit these files to the `joelewisnotts-cmd/CryptoWebsite` repository.
- Or, walk through creating the S3 bucket and deploying step-by-step with your AWS account.
