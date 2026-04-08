# agent-templates
Central repository for Pinata agent template examples

### What are Pinata Agents
Pinata Agents are hosted OpenClaw instances - AI agents that can run code, search the web, manage files, and connect to external services. Each agent runs in its own isolated container with a persistent workspace.

### What are Agent Templates?
Templates are the fastest way to get a working agent. Instead of configuring everything yourself, pick a template that does what you need - it comes with the right skills, settings, and personality already set up. Just add your API keys and deploy.

## 📦 Agent Template Categories
Templates should be grouped based on the *role the agent plays* in a system.

### 1. 🛰️ [Monitoring & Alerts](./monitoring-and-alerts)
Agents that observe systems, detect changes, and notify or trigger actions.

**Use this for:**
- Price / market monitoring
- Wallet or transaction tracking
- System health checks
- Event detection and alerting

**Examples:**
- Financial tracker
- API uptime monitor
- Activity alert agent

---

### 2. ⚙️ [Actions & Transactions](./actions-and-transactions)
Agents that take actions on behalf of a user or system, especially involving external services or state changes.

**Use this for:**
- Purchasing / payments
- Executing workflows
- Writing to external systems
- Triggering side effects

**Examples:**
- Purchasing agent
- Trading agent
- CRM update agent

---

### 3. 🔎 [Data Extraction & Summarization](./data-extraction-and-summarization)
Agents that read, process, and condense information into usable outputs.

**Use this for:**
- Summarization
- Parsing structured/unstructured data
- Report generation
- Indexing / transforming data

**Examples:**
- Graph summarizer
- PDF summarization agent
- Log analysis agent

---

### 4. 💬 [Interaction & Interfaces](./interaction-and-interfaces)
Agents that directly interact with users or act as an interface layer.

**Use this for:**
- Chatbots
- Assistants
- Conversational workflows
- User-facing AI tools

**Examples:**
- Slack assistant
- Customer support bot

---

### 5. 🧩 [Orchestration & Multi-Agent Systems](./orchestration-and-multi-agent)
Agents that coordinate other agents, tools, or workflows.

**Use this for:**
- Multi-step pipelines
- Agent coordination
- Tool routing / decision engines
- Complex workflow composition

**Examples:**
- Research pipeline orchestrator
- Multi-agent task runner
- Tool selection / routing agent
---

## How can I create a template?
See here: https://docs.pinata.cloud/agents/templates/creating

## How can I get my template on the Pinata Agent marketplace?
Currently marketplace inclusion is limited to ecosystem partners. Reach out to partnerships@pinata.cloud for partner information 

## 🚀 Contributing a Template

We welcome contributions from the community! To submit a new agent template, follow the process below.

### 1. Fork the Repository

1) Create a fork of this repository and clone it locally

```bash
git clone https://github.com/YOUR-USERNAME/pinata-agent-templates.git
cd pinata-agent-templates

2) Create your agent template

3) Submit a PR to the repository
