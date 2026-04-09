# Paperless — Minimalist Invoice & Receipt Maker

A beautiful, browser-based invoice and receipt generator built with React, Vite, and TailwindCSS v4.

**Live Demo:** [Deployed on Vercel](https://github.com/sadesthetic/paperless-invoice-maker)

## Features

- 📄 Create **Invoices** and **Receipts** in seconds
- 🖨️ **Print** directly from the browser
- 📥 **Export to PDF** with one click
- 📱 **QR Code** for payment links
- 💰 Configurable currency, tax rate, and line items
- ✨ Real-time live preview

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 6](https://vitejs.dev/) — fast build tool
- [TailwindCSS v4](https://tailwindcss.com/) — utility-first CSS
- [Motion (Framer Motion)](https://motion.dev/) — animations
- [html2canvas](https://html2canvas.hertzen.com/) + [jsPDF](https://github.com/parallax/jsPDF) — PDF export
- [qrcode.react](https://github.com/zpao/qrcode.react) — QR code generation
- [Lucide React](https://lucide.dev/) — icons

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deploy

This project is ready to deploy on [Vercel](https://vercel.com) or any static hosting provider:

```bash
npm run build
# Upload the `dist/` folder
```
