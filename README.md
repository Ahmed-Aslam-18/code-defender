# 🛡️ Code Defender

An automated GitHub PR review system built with **Node.js**, **NestJS**, **GitHub Apps**, and **BullMQ**.  
Code Defender listens to GitHub webhooks and acts as an intelligent reviewer for pull requests using an event-driven, scalable architecture.

---

## 🚀 Why Code Defender?

I built Code Defender to deeply understand:

- GitHub Apps vs Personal Access Tokens (PATs)
- Webhook-driven architectures
- Background job processing with queues
- Scalable backend design using NestJS

Initially, PR comments were created using a PAT, but all comments appeared under my own account — which didn't feel like a real review system.

Switching to **GitHub Apps** made it feel like an actual automated reviewer with its own identity.

---

## ⚙️ Features

- 🔔 GitHub webhook listener for PR events
- 🤖 Automated PR review system (GitHub App-based identity)
- 🧠 Event-driven architecture using NestJS
- ⚡ Background job processing with BullMQ + Redis
- 🔒 Secure webhook handling with signature validation
- 📦 Scalable async processing pipeline
- 🧩 Modular NestJS architecture

---

## 🧰 Tech Stack

- **Node.js**
- **NestJS**
- **TypeScript**
- **BullMQ**
- **Redis**
- **GitHub Webhooks**
- **GitHub Apps API**

---

## 🏗️ Architecture Overview

1. GitHub sends webhook events (e.g. PR opened, updated)
2. NestJS receives and validates the webhook
3. Event is pushed into a **BullMQ queue**
4. Worker processes the job asynchronously
5. GitHub App posts review/comments back to the PR

This ensures:
- Non-blocking API requests
- Reliable background processing
- Scalable event handling

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Ahmed-Aslam-18/code-defender

# Install dependencies
cd code-defender
npm install


## ⚙️ Environment Variables

Create a `.env` file in the root directory and add the following variables:

```env
PORT=3000

# GitHub Auth
GITHUB_TOKEN=
GITHUB_WEBHOOK_SECRET=
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_APP_CLIENT_SECRET=

# AI Services
OPENAI_API_KEY=
GEMINI_API_KEY=

# Redis (if used for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
