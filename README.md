## brAIn Server: NestJS, WhatsApp integration, MCP server use

Backend for WhatsApp-based AI customer support, built with NestJS. Handles WhatsApp webhook events, processes messages, and uses Google Gemini AI for automated replies.

Includes transactional DB support and custom authentication.

---

### Features

- **WhatsApp Webhook API**: Receives and processes WhatsApp messages via `/whatsapp/webhook`.
- **AI Integration**: Uses Google Gemini AI to generate customer support responses.
- **Transactional DB**: TypeORM with custom transactional context for safe DB operations.
- **Custom Auth**: Secures endpoints using `x-webhook-signature` header.
- **Swagger/OpenAPI**: API docs at `/open-api`, supports `x-webhook-signature` header for auth.
- **Health Check**: `/status` endpoint.

---

### Demo
See the demo for basic brAIn functionality below:

https://github.com/user-attachments/assets/21390d92-6fea-485d-ad02-1e5e48c527c1

---

### Getting Started

#### 1. Requirements

- Node.js v20+
- Postgres
- WhatsApp sender account
- Gemini API key

#### 2. Setup

```sh
nvm use
npm install
cp apps/server/.env.example apps/server/.env # Fill in required variables
# Start Postgres (i.e. docker-compose up -d)
```

#### 3. Run

```sh
# From apps/server directory
npm run start
# For migrations:
DATABASE_RUN_MIGRATIONS=false npm run migration:run
```

---

### API Authentication

- All protected endpoints require the `x-webhook-signature` header.
- For interactive API docs and testing, visit `/open-api` (Swagger UI).

---

### Prerequisites

Set the following in the .env file:

- Create WASender account and get API key: WASENDER_API_KEY
- From the WASender webhook, get WHATSAPP_WEBHOOK_API_KEY
- In Google AI studio, create GEMINI_API_KEY
- Optionally, set GEMINI_MODEL

---

### Usage

#### WhatsApp Integration

- The server expects WhatsApp webhook events at `/whatsapp/webhook`.
- Incoming messages are processed and can be stored as "memories" or trigger AI-powered replies.

#### Example: Create a New Memory

Send a WhatsApp message:

```
I need to buy green card insurance
```

- The system will store this as a memory associated with your WhatsApp number.

#### Example: Retrieve All Memories

Send a WhatsApp message:

```
Read all my memories
```

- The system will reply with a list of all your stored memories.

---

### Contact

Feel free to contact the author or open up an issue if you have a question or suggestion.

X.com: [@dexpetkovic](https://x.com/dexpetkovic)
