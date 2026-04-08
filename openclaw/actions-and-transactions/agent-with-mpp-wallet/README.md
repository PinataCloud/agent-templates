# agent with wallet template

## What this is

A pre-configured agent template with a Tempo wallet. Deploy it and get an AI purchasing agent that can discover, compare, and pay for any service in the Tempo MPP directory — no API keys, no subscriptions, pay per request.

## What is the Tempo MPP Directory?

The Tempo MPP (Machine Payments Protocol) directory is a marketplace of 80+ paid APIs and services accessible without accounts or API keys. Services accept payment natively via Tempo's on-chain payment protocol — the agent handles auth, pricing, and payment automatically.

Current categories include:
- **AI models** — LLMs and image generation
- **Web search & scraping** — search engines, crawlers, and browser automation
- **Data enrichment** — company and contact intelligence
- **Blockchain & crypto data** — on-chain analytics and market data
- **Travel** — flights, hotels, and real-time tracking
- **Finance & business intel** — market data, SEC filings, and competitive intelligence
- **Communications** — email, phone calls, and social data
- **Compute & storage** — GPU compute and distributed storage

The agent browses the directory, compares prices across providers, and executes purchases on your behalf. Your wallet has a hard on-chain spending limit — the agent cannot spend more than you authorize, enforced by the blockchain itself.

## Example prompts

**Search the web**
> "Find me the cheapest web search provider and search for 'best noise cancelling headphones 2026'"

**Generate images**
> "What image generation services are available and what do they cost? Use the cheapest one to generate a photo of a futuristic city at sunset."

**Research a company**
> "Enrich this company domain for me: acme.com — find their tech stack, employee count, and key contacts"

**Multi-step pipeline**
> "Scrape this webpage, translate it to Spanish, then summarize it. Tell me the total cost before doing anything."

**Crypto & finance**
> "Pull the last 30 days of ETH price data and chart the trend"

**Travel**
> "Find me flights from NYC to London next Friday and show me the three cheapest options"

## How it works

1. Deploy the template on Pinata and open the chat
2. The agent introduces itself and sets up its Tempo wallet
3. Fund the wallet at [wallet.tempo.xyz](https://wallet.tempo.xyz) — a few dollars is enough to explore
4. Ask for anything — the agent searches the directory, shows options and prices, and executes with your confirmation

Transactions over 1 usd always require explicit confirmation before the agent proceeds.

## Post-deploy setup

Open the chat — the agent handles everything from there.
