# ApexLoad

> AI-powered API load testing desktop tool — built for developers who want answers, not just numbers.

---

## Problem Statement

### API Load Testing is Too Slow, Too Complex, and Blind to Root Causes

Developers and QA engineers need to validate how their APIs perform under concurrent load before shipping to production. Current solutions either require steep CLI expertise (like `k6` or `wrk`), are locked behind expensive SaaS paywalls (like Loader.io or BlazeMeter), or produce raw data dumps with no guidance on *what went wrong* or *why*.

Setting up a meaningful test means hand-writing scripts, decoding percentile histograms, and manually diagnosing bottlenecks — all before you can act on anything.

ApexLoad solves this by combining a high-performance load engine with an AI layer that lets you *describe* a test in plain English and *understand* results in plain English — all from a local desktop app with no cloud dependency.

---

### Target Users

- **Backend developers** validating API performance before releases
- **QA engineers** running stress, smoke, and soak tests
- **Indie developers & hackathon builders** who need a fast, zero-cost local testing tool
- **DevOps engineers** checking infrastructure limits without sending data to third-party clouds

---

### Existing Gaps

| Gap | Existing Tools | ApexLoad's Fix |
|-----|----------------|----------------|
| High setup friction | k6, wrk require scripting | Natural language test builder — just describe what you want |
| Expensive SaaS | BlazeMeter, Loader.io cost $$$ | Fully local, offline-capable desktop app |
| Raw stats, no diagnosis | All tools dump numbers | AI Bottleneck Analyst streams a plain-English diagnosis with fix recommendations |
| No desktop-native UX | CLI-only or browser-only | Electron app with real-time charts |
| Privacy risk | Cloud tools receive your API traffic | 100% local — your endpoints never leave your machine |

---

## Problem Understanding & Approach

### Root Cause Analysis

Three compounding problems make load testing harder than it should be:

- **Setup Tax** — Tools like `k6` and `wrk` require scripting knowledge just to run a basic test, blocking the developers who need feedback most.
- **Interpretation Gap** — Tests produce raw percentile data but no diagnosis. Knowing your p99 is 3s doesn't tell you *why* or what to fix.
- **Cloud Privacy Trade-off** — SaaS platforms (BlazeMeter, Loader.io) improve UX but route your API traffic — headers, bodies, endpoints — through third-party infrastructure.

---

### Solution Strategy

| Root Cause | ApexLoad's Approach |
|------------|---------------------|
| Setup Tax | Natural language test builder — describe the test, Claude configures it |
| Interpretation Gap | AI Bottleneck Analyst streams a plain-English diagnosis with ranked fix recommendations after every test |
| Cloud Privacy | Fully local Electron app — API traffic never leaves the machine; only aggregated stats reach the Anthropic API |
| Performance accuracy | `undici` load engine + HDR histograms for high-concurrency throughput and precise percentile tracking |

---

## Proposed Solution

### Solution Overview

ApexLoad is a local-first desktop app that combines a high-performance HTTP load engine with an AI layer powered by Claude. It removes the two biggest blockers in load testing — setup friction and result interpretation — while keeping all API traffic on the user's machine.

### Core Idea

> Describe your test in plain English. Run it. Get a diagnosis — not just data.

The entire workflow is three steps: type what you want to test, run it, and read the AI's plain-English breakdown of what happened and what to fix. No scripting, no manual metric analysis, no third-party cloud.

### Key Features

| Feature | Description |
|---------|-------------|
| **Natural Language Test Builder** | Type an intent like *"stress test my login API with 200 concurrent users"* — AI parses it and auto-fills the entire config form |
| **AI Bottleneck Analyst** | After each test, AI streams a real-time diagnosis — identifies issues, explains percentile data in context, and ranks fix recommendations by severity |
| **High-Concurrency Load Engine** | Built on `undici` with configurable concurrency, ramp-up, think time, and per-request timeouts |
| **Real-Time Metrics** | Live throughput, error rate, and latency charts (p50/p95/p99) streamed via WebSocket as the test runs |
| **Test History & Reports** | All results persisted locally in SQLite; exportable as HTML reports via Puppeteer |
| **100% Local Execution** | Electron desktop app — your API endpoints and traffic never leave your machine |

---

## System Architecture

### Architecture Description

ApexLoad follows a local monorepo architecture with two packages — `backend` and `frontend` — bridged by Electron's IPC and a WebSocket connection.

The frontend is a React app running inside an Electron shell. It handles user input, renders real-time charts, and communicates with the backend over WebSocket for live test metrics and over REST for configuration, history, and AI requests.

The backend is a Node.js process running two servers: a Fastify REST API on port 3000 and a WebSocket server on port 8765. When a test runs, the load engine spawns concurrent workers using `undici`, each firing HTTP requests at the target API. Results are fed into an HDR histogram for accurate percentile tracking and streamed to the frontend in real time.

On test completion, aggregated stats are sent to the Anthropic API. Claude's bottleneck analyst returns a streamed SSE diagnosis token-by-token, which the frontend renders progressively. All test configs and results are persisted locally in a SQLite database — nothing is stored in the cloud.
## Architecture Diagram
### Usecase Diagram
<img width="1280" height="915" alt="image" src="https://github.com/user-attachments/assets/3fbd1371-c55c-460c-b388-4277f15979b1" />

### Sequence Diagram
<img width="2175" height="3791" alt="image" src="https://github.com/user-attachments/assets/741d9afb-6b64-4dc5-94e7-b908cc6f9a17" />


---

### ER Diagram Description

The local SQLite database consists of two tables linked by a foreign key.

**test_configs** stores each saved load test configuration — its unique ID, name, the full config serialized as JSON, and the timestamp it was created. This acts as the source of truth for all test definitions.

**test_results** records the outcome of every test run. Each result references a `config_id` from `test_configs`, and stores the start time, end time, status (`idle`, `running`, `completed`, `error`), and the full aggregated stats as JSON — including latency percentiles, throughput, error rate, and timeline data.

One config can have many results, forming a one-to-many relationship. This allows users to re-run the same test over time and compare results across runs from the history view.
### ER Diagram 
<img width="980" height="576" alt="image" src="https://github.com/user-attachments/assets/2c442948-e969-45aa-b08f-2fd98073e78c" />

---

## Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| Electron (v31+) | Desktop shell — wraps the React app as a native cross-platform application |
| React 18 + TypeScript | UI framework for all views and components |
| Vite | Build tool and dev server |
| Tailwind CSS + shadcn/ui | Styling and component primitives |
| Recharts | Real-time streaming charts for throughput, latency, and error rate |
| Zustand | Lightweight global state management |
| React Hook Form + Zod | Form handling and config validation |

### Backend

| Technology | Purpose |
|------------|---------|
| Node.js (v20+) + TypeScript | Runtime and language |
| Fastify | High-performance REST API server (port 3000) |
| `undici` | Native Node.js HTTP client powering the concurrent load engine |
| `ws` | WebSocket server for real-time metric streaming (port 8765) |
| `hdr-histogram-js` | Accurate latency percentile tracking (p50 to p99.9) |
| Puppeteer + Handlebars | HTML report generation |

### AI / ML

| Technology | Purpose |
|------------|---------|
| AI API | Powers both AI features — natural language test parsing and post-test bottleneck analysis |
| AI SDK | Official Node.js SDK for streaming and non-streaming AI calls |
| Server-Sent Events (SSE) | Streams AI's diagnosis token-by-token to the frontend |

### Database

| Technology | Purpose |
|------------|---------|
| `better-sqlite3` | Embedded local SQLite database for test configs and results |

### Deployment

| Technology | Purpose |
|------------|---------|
| electron-builder | Packages the app for distribution |
| macOS (.dmg) | macOS installer |
| Windows (.exe) | Windows installer |
| Linux (.AppImage) | Linux portable app |
| GitHub Actions | CI/CD pipeline for testing and builds |

---

## Project Checkpoints

### Checkpoint 1: Research & Planning

**Deliverables:**
- Problem statement and gap analysis against existing tools
- Defined target users and core use cases
- Architecture decisions: local-first, Electron monorepo, WebSocket + REST split
- Tech stack selection with rationale for each layer
- Database schema design (`test_configs` and `test_results`)
- AI feature scope: natural language parsing and post-test bottleneck analysis

### Checkpoint 2: Backend Development

**Deliverables:**
- TypeScript project scaffold with full type definitions
- SQLite persistence layer for configs and results
- HDR Histogram stats engine for accurate percentile tracking
- `undici`-based concurrent load engine with ramp-up, think time, and timeout support
- Concurrency orchestrator managing worker lifecycle
- Real-time WebSocket server streaming live metrics
- Fastify REST API with endpoints for configs, results, and reports
- HTML report generator via Puppeteer and Handlebars
- AI Bottleneck Analyst with streaming SSE endpoint (`POST /ai/analyze`)
- Natural Language Intent Parser with REST endpoint (`POST /ai/parse-intent`)
- Main entry point with AI status logging

### Checkpoint 3: Frontend Development

**Deliverables:**
- Electron + React + TypeScript scaffold with Tailwind dark theme
- WebSocket connection hook with auto-reconnect
- Zustand global state store including AI state
- Zod-validated test config form
- Natural Language Builder panel with `useNLBuilder` hook and form auto-fill from Claude's parsed result
- Live stats dashboard with 8 real-time metric cards
- Latency timeline, throughput area, and percentile distribution charts
- AI Bottleneck Analyst panel with token-by-token SSE streaming, severity badge, and structured issues/suggestions grid
- Results page, history page, and HTML report export via Electron dialog

### Checkpoint 4: Deployment

**Deliverables:**
- Production build pipeline via `electron-builder` bundling backend and frontend into a single distributable
- Cross-platform installers: macOS `.dmg` (x64 + arm64), Windows `.exe` (NSIS), Linux `.AppImage`
- GitHub Actions CI/CD pipeline running backend tests, frontend tests, build verification, and automated packaging on merge to `main`
- Backend test coverage target of >80% with coverage reports uploaded as CI artifacts
- Production validation script covering all tests, benchmark, build check, and AI endpoint smoke tests
- Quality benchmarks met: >5,000 req/s at 100 concurrency, NL Builder response under 3s, AI Analyst first token under 5s, app startup under 3s

---

## End-to-End Workflow

### Step 1: Configure the Test

**Option A — Natural Language:** Type a plain-English description into the AI Test Builder panel (e.g. *"stress test https://api.myapp.com/login with 200 concurrent users, POST, ramp up 20 seconds"*) and click **Auto-fill Form**. Claude parses the intent and fills in the entire config form. Review and adjust if needed.

**Option B — Manual:** Fill the config form directly with the target URL, HTTP method, headers, request body, concurrency (parallel workers), total requests, ramp-up duration, per-request timeout, and think time between requests.

### Step 2: Run the Test

Click **Start Load Test**. The config is sent over WebSocket to the backend, which spawns the configured number of `undici` workers. If ramp-up is set, workers are introduced gradually at evenly spaced intervals. Each worker fires requests independently, recording latency, status code, and bytes per response. The test can be stopped at any time via the **Stop Test** button.

### Step 3: Monitor in Real Time

The Monitor tab streams live updates every second — 8 metric cards (throughput, error rate, P50/P95/P99 latency, success count, max latency) plus a latency timeline and throughput area chart. Error rate cards turn amber above 1% and red above 5%.

### Step 4: Review Results and Get AI Diagnosis

On completion, the Results tab loads with full aggregated stats. These are sent to AI bottleneck analyst, which streams a diagnosis token-by-token via SSE — showing a severity badge (HEALTHY, WARNING, or CRITICAL), a list of detected issues, and ranked fix recommendations.

### Step 5: Export and Revisit

Export the run as an HTML report via Electron's save dialog, or browse all past runs from the History page. All configs and results persist locally in SQLite across sessions.

---
## Demo & Video

- Live Demo Link:
- Demo Video Link:
- GitHub Repository:
---
## Hackathon Deliverables Summary

- **Backend** — High-concurrency load engine (`undici` + HDR histograms), Fastify REST API, real-time WebSocket streaming, SQLite persistence, and HTML report generation.
- **Frontend** — Electron desktop app with a dark React UI, live stats dashboard (8 metric cards, 3 charts), config form, history page, and report export.
- **AI Features** — Natural Language Test Builder that auto-fills the config form from a plain-English prompt, and an AI Bottleneck Analyst that streams a post-test diagnosis with severity rating, detected issues, and ranked fix recommendations.
- **Deployment** — Cross-platform installers (macOS, Windows, Linux), GitHub Actions CI/CD pipeline, >80% backend test coverage, and performance targets met (>5,000 req/s at 100 concurrency, NL Builder <3s, AI first token <5s).

---

## Team Roles & Responsibilities

| Member | Role | Responsibilities |
|--------|------|-----------------|
| Himanshu Mishra | Backend Engineer | Load engine (`undici` workers, concurrency orchestrator, ramp-up logic), HDR histogram stats engine, WebSocket server, Fastify REST API, SQLite persistence, HTML report generation |
| Hirdyansh Kumar | Frontend Engineer | Electron app setup, React UI and dark theme, live stats dashboard (metric cards and charts), config form, Natural Language Builder panel, AI Bottleneck Analyst streaming UI, history page and report export |
| Subhan Kumar Rai | AI & DevOps Engineer | AI API integration (NL intent parser and bottleneck analyst), SSE streaming pipeline, AI state management, testing suite (unit, integration, E2E), CI/CD pipeline, cross-platform packaging and deployment |

---

## Future Scope & Scalability

### Short-Term

- Support for custom authentication flows (OAuth2, API keys, session tokens) directly in the config form
- Distributed test scenarios — run multiple endpoint sequences in a single test to simulate real user journeys
- Saved test suites that can be scheduled or triggered via CLI for use in pre-deployment pipelines
- Threshold-based alerting — automatically flag results that exceed defined latency or error rate limits
- Dark/light theme toggle and configurable dashboard layouts

### Long-Term

- Distributed load generation across multiple machines to simulate tens of thousands of concurrent users beyond what a single desktop can handle
- Team collaboration mode — shared test history and results accessible across a team via a lightweight sync layer
- Plugin system for custom reporters, exporters (CSV, JSON, Grafana), and third-party integrations (Slack, PagerDuty)
- AI test generation from OpenAPI/Swagger specs — Claude reads the spec and proposes a full test suite automatically
- Historical trend analysis — track API performance across releases over time with regression detection powered by Claude

---

## Known Limitations

- **Single-machine load generation** — concurrency is bounded by the host machine's CPU, memory, and open file descriptor limits. Very high concurrency (1000+ workers) may be constrained by the local OS.
- **AI features require an internet connection** — the Natural Language Builder and Bottleneck Analyst both depend on the AI API. With no `AI_API_KEY` set, both features are disabled and return a 503.
- **No multi-step or stateful test flows** — each worker fires independent requests to a single endpoint. Workflows requiring session tokens from a prior login request are not supported in the current version.

---

## Impact

- **Lowers the barrier to load testing** — any developer can validate API performance in seconds without scripting knowledge or prior experience with testing tools.
- **Closes the diagnosis gap** — teams get actionable, plain-English bottleneck analysis instead of raw numbers, reducing the time from test results to fix.
- **Keeps sensitive API traffic private** — local-first execution means internal endpoints, auth headers, and request payloads never leave the developer's machine.
- **Accelerates pre-release confidence** — with a fast setup, real-time monitoring, and AI-guided insights, teams can integrate load testing into their regular development cycle rather than treating it as a late-stage or one-off exercise.


