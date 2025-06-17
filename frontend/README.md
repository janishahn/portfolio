This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Frontend Setup

## Configuration

1. Copy `.env.local.example` to `.env.local`:
   ```sh
   cp .env.local.example .env.local
   ```
2. Edit `.env.local` to set your desired frontend port and backend API URL:
   ```env
   PORT=3000
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

## Running the Frontend

Start the frontend server (the port will be read from `.env.local`):
```sh
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000) (or your chosen port).

## Production Builds

When you create a production build (`npm run build`) and later start it with `npm start`, **Next.js will _not_ load values from `.env.local`**. In production mode the framework only considers `.env.production`, `.env.production.local`, or environment variables that are already present in the shell.

If you need to run the built app on a custom port (e.g. `8003`) you therefore have two options:

1. Export the variable at runtime:

   ```bash
   PORT=8003 npm start
   ```

2. Create a `.env.production.local` file next to `package.json` with the same contents you previously had in `.env.local`:

   ```env
   PORT=8003
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8012
   ```

Either approach will make `next start` listen on the defined port.

---

# Nginx Reverse Proxy

Nginx should be configured to:
- Proxy `/api` to the backend port (e.g., `http://localhost:8000`)
- Proxy `/` to the frontend port (e.g., `http://localhost:3000`)

---

# Full Project Usage

1. Start the backend:
   ```sh
   cd backend
   python start.py --port=8000
   ```
2. Start the frontend:
   ```sh
   cd frontend
   npm run dev
   ```
3. Access the app via Nginx at [http://localhost:8080](http://localhost:8080)
