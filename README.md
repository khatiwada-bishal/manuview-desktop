# ManuView Desktop

<p align="center">
  <img src="public/icon.svg" width="96" height="96" alt="ManuView Logo" />
</p>

<h3 align="center">AI Pre-Submission Peer Review & Manuscript Diagnostic Suite</h3>

<p align="center">
  A native, privacy-first desktop application designed for researchers, clinicians, and academic authors to audit manuscripts, simulate 5-persona peer reviews, benchmark target journal fit, and verify citation integrity before formal submission.
</p>

<p align="center">
  <strong>100% Local & Private Processing</strong> &bull; <strong>Zero Unpublished Data Retention</strong> &bull; <strong>Multi-LLM & WebGPU Compatible</strong>
</p>

---

> [!NOTE]
> ### 🧪 Pre-compiled Installers are in Testing!
> Ready-to-use executable installers for **macOS (`.dmg` / `.app`)** and **Windows (`.exe` / `.msi`)** are currently in our testing phase and will be published directly under [GitHub Releases](https://github.com/khatiwada-bishal/manuview-desktop/releases).
> 
> You can easily run ManuView right now on your computer in just **2 minutes** using the simple instructions below!

---

## Table of Contents
1. [Core Capabilities & Latest Features](#-core-capabilities--latest-features)
2. [Diagnostic & Review Architecture](#-diagnostic--review-architecture)
3. [How to Run Locally (Step-by-Step)](#-how-to-run-locally-step-by-step)
   - [Method 1: Web Preview (Fastest — No Rust Needed)](#method-1-web-preview-fastest--no-rust-needed)
   - [Method 2: Full Native Desktop App (macOS & Windows)](#method-2-full-native-desktop-app-macos--windows)
4. [AI Providers & Key Setup (Free Options Included)](#-ai-providers--key-setup)
   - [1. Google AI Studio (Gemini) — Recommended Cloud](#1-google-ai-studio-gemini--recommended-cloud)
   - [2. Local WebGPU / In-Browser SLM (Zero Setup, 100% Private)](#2-local-webgpu--in-browser-slm-zero-setup-100-private)
   - [3. GroqCloud (Ultra-Fast Llama 3.3)](#3-groqcloud-ultra-fast-llama-33)
   - [4. OpenRouter (Access to 100+ Free Models)](#4-openrouter-access-to-100-free-models)
   - [5. Mistral AI & OpenAI / Anthropic](#5-mistral-ai--openai--anthropic)
   - [6. Ollama (Local Self-Hosted LLMs)](#6-ollama-local-self-hosted-llms)
5. [Report Export & Academic Tools](#-report-export--academic-tools)
6. [Testing & Scientific Benchmark Suite](#-testing--scientific-benchmark-suite)
7. [Scholarly Disclaimer & Responsible Use](#-scholarly-disclaimer--responsible-use)
8. [Privacy & Security Guarantee](#-privacy--security-guarantee)
9. [License](#-license)

---

## 🚀 Core Capabilities & Latest Features

ManuView transforms manuscript submission preparation through rigorous, multi-layered diagnostic intelligence:

### 1. 5-Persona Simulated Peer Review
- Simulates five distinct academic reviewer archetypes:
  - 🔬 **Methodologist**: Scrutinizes study design, controls, power analysis, and reproducibility.
  - 📊 **Statistician**: Verifies test selection, degrees of freedom, effect sizes, and p-value consistency via automated GRIM and Statcheck tests.
  - 🎯 **Domain Specialist**: Evaluates conceptual novelty, grounding in recent literature, and field impact.
  - 🩺 **Clinical / Applied Reviewer**: Assesses translational feasibility, real-world utility, and ethical rigor.
  - 🏛️ **Journal Editor**: Reviews overall scope, title/abstract alignment, framing, and desk-rejection hazards.

### 2. 6-Pillar Editorial Triage Matrix
- Quantifies editorial risk across the 6 major causes of desk rejection:
  - **Scope & Venue Fit**
  - **Methodological Soundness**
  - **Statistical Rigor & Reproducibility**
  - **Literature Grounding & Citation Integrity**
  - **Ethical & Data Reporting Compliance**
  - **Clarity, Structure & IMRaD Conventions**

### 3. Interactive Infographics & Visual Analytics
- **Dynamic Radar Chart**: Multi-axis visualization of readiness across all evaluation dimensions with SVG export.
- **Segmented Readiness Gauge**: Calibrated qualitative readiness band (High / Moderate / Low) without artificial percentage false precision.
- **Decision Distribution Bar**: Anticipated editorial outcomes (Accept / Minor Revision / Major Revision / Reject) summing strictly to 100%.
- **Citation Status Donut**: Visual breakdown of verified, unverified, retracted, and self-citations.
- **Scan Pipeline Stepper**: Real-time visual progress through text extraction, DOI checking, compliance parsing, and LLM inference.

### 4. Grounded Citation & Retraction Verification
- **Landmark Retraction Watch Database**: Built-in offline database detects retracted papers instantly without external dependencies.
- **Crossref DOI Verification**: Real-time live validation of references, authors, publication years, and DOI resolution.
- **Smart DOI De-Wrapping**: Robust parser that joins split DOIs across line breaks and hyphens without corrupting adjacent entries.
- **Recency & Self-Citation Indexing**: Flags reference obsolescence (>10-year skew) and computes self-citation concentration.

### 5. Multi-Format Academic Report Export
- **Print-Optimized PDF**: Browser-native print styles with clean page breaks, styled callouts, and SVG graphics.
- **Microsoft Word (`.doc` / `.docx`)**: Styled HTML formatted for flawless Word document import.
- **Point-by-Point LaTeX Rebuttal Template**: Pre-populated LaTeX rebuttal matrix for journal resubmissions.
- **BibTeX Library Export**: Structured BibTeX collection for all verified references.

### 6. Built-in Academic Utility Suite
- **PRISMA 2020 Flow Diagram Generator**: Interactive flow-diagram tool for systematic reviews with SVG/PDF export.
- **Cover Letter Drafter**: Formats professional submission letters highlighting novelty, ethical clearances, and editorial fit.
- **Review Response Rebuttal Builder**: Generates point-by-point author rebuttal matrices to respond constructively to peer reviewer critiques.
- **Batch Manuscript Management**: Multi-select, batch deletion, and local computer project persistence.

---

## 🔬 Diagnostic & Review Architecture

ManuView is engineered as a modular, lightweight desktop client powered by Tauri v2, React 18, and Vite:

```
src/
├── components/
│   ├── dashboard/          # Modularized dashboard cards (Triage, Personas, Citations, etc.)
│   ├── scan/               # Input dropzone, model picker, and full report viewers
│   ├── sidebar/            # Collapsible macOS-style sidebar, paper lists, time buckets
│   ├── charts/             # Radar charts, gauges, donuts, pipeline steppers
│   └── services/           # PRISMA flowcharts, Cover Letters, Rebuttal builders
├── lib/
│   ├── engine/             # Diagnostic orchestrator, prompt builders, compliance audits
│   ├── webllm/             # WebGPU on-device SLM execution engine (Qwen2.5-0.5B, etc.)
│   ├── data/               # Retraction Watch compact DB, 1,300+ journal catalog
│   ├── statcheck.ts        # Automated statistical consistency and GRIM test checks
│   ├── citation-recency.ts # Reference recency and self-citation density metrics
│   └── export-generator.ts # PDF, Word, LaTeX rebuttal, and BibTeX generators
└── src-tauri/              # Rust native application shell and OS dialog/file integration
```

---

## 💻 How to Run Locally (Step-by-Step)

You do not need deep programming experience to run ManuView. Choose either of the two methods below:

### Prerequisites

1. **Install Node.js** (Version 18 or newer):
   - Download the official installer from [nodejs.org](https://nodejs.org/) (choose **LTS**).
   - Verify installation in your terminal:
     ```bash
     node -v
     npm -v
     ```

---

### Method 1: Web Preview (Fastest — No Rust Needed)

If you only have Node.js installed and want to run ManuView immediately:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/khatiwada-bishal/manuview-desktop.git
   cd manuview-desktop
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   Navigate to [http://localhost:1420](http://localhost:1420). All features—including file upload, citation verification, AI reviews, and export tools—will run in your browser.

---

### Method 2: Full Native Desktop App (macOS & Windows)

To run ManuView inside a native operating system window with OS file dialogs and window dragging:

1. **Install Rust** (Required for Tauri):
   - **macOS / Linux**:
     ```bash
     curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
     ```
     Restart your terminal after installation.
   - **Windows**: Download and run `rustup-init.exe` from [rustup.rs](https://rustup.rs/).

2. **Launch the Native Desktop App**:
   ```bash
   npm run desktop:dev
   ```
   Tauri will compile the native backend and launch the standalone desktop app.

3. **Build an Executable / Installer**:
   ```bash
   npm run desktop:build
   ```
   *(For macOS specifically, you can also run `./scripts/build-mac.sh` to package `.dmg` and `.app` bundles).*

---

## 🔑 AI Providers & Key Setup

ManuView operates on a **Bring-Your-Own-Key (BYOK)** model. You have complete control over where your manuscript data travels:

### 1. Google AI Studio (Gemini) — *Recommended Cloud*
> **Generous free tier (up to 15 RPM), fast inference, and large context windows for full manuscripts.**

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **"Get API key"** &rarr; **"Create API key"**.
4. In ManuView, open **Settings** (gear icon in the bottom-left sidebar).
5. Select **Google Gemini**, pick `gemini-2.5-flash` or `gemini-1.5-flash`, and paste your key.

---

### 2. Local WebGPU / In-Browser SLM (Zero Setup, 100% Private)
> **Runs directly inside your browser or desktop window using your GPU. No API keys, no accounts, zero data transmission.**

1. Open **Settings** &rarr; switch to the **Local Models (WebLLM)** tab.
2. Select an optimized local Small Language Model (e.g., `Qwen2.5-0.5B-Instruct` or `Llama-3.2-1B`).
3. Click **Download / Cache Model** (weights are cached locally on your device).
4. Run live reviews completely offline with full privacy.

---

### 3. GroqCloud (Ultra-Fast Llama 3.3)
> **High-speed inference for open models like Meta Llama 3.3 70B.**

1. Visit [console.groq.com](https://console.groq.com/) and create a free account.
2. Navigate to **API Keys** &rarr; **Create API Key**.
3. In ManuView, select **Groq** and choose `llama-3.3-70b-versatile`.

---

### 4. OpenRouter (Access to 100+ Free Models)
> **Single unified key for Meta, Mistral, Google, Qwen, and DeepSeek.**

1. Visit [openrouter.ai](https://openrouter.ai/) and register.
2. Go to **Keys** &rarr; **Create Key** (starts with `sk-or-v1-...`).
3. In ManuView, select **OpenRouter**. ManuView automatically suggests available free-tier models (tagged `:free`).

---

### 5. Mistral AI & OpenAI / Anthropic
- **Mistral AI**: Create a key at [console.mistral.ai](https://console.mistral.ai/) and choose `mistral-small-latest` or `codestral-latest`.
- **OpenAI**: Supply your key from [platform.openai.com](https://platform.openai.com/) to use `gpt-4o` or `gpt-4o-mini`.
- **Anthropic**: Use Claude 3.5 Sonnet or Haiku directly with your Anthropic key.

---

### 6. Ollama (Local Self-Hosted LLMs)
> **For high-security clinical or confidential labs running their own local model server.**

1. Install [Ollama](https://ollama.com/) on your workstation.
2. Pull your preferred model:
   ```bash
   ollama run llama3.3
   ```
3. In ManuView Settings, select **Ollama (Local)**. ManuView connects directly to `http://localhost:11434` without needing an API key.

---

## 📑 Report Export & Academic Tools

Once a review is complete, click **Export Report** in the top-right toolbar to choose your format:

| Format | Output | Best Used For |
|---|---|---|
| **Print / PDF** | Formatted PDF with custom page-breaks and charts | Archival, departmental review, co-author distribution |
| **Microsoft Word** | Clean `.doc` / `.docx` with callout blocks | Collaborative editing and track changes with co-authors |
| **LaTeX Rebuttal** | Point-by-point `.tex` table matrix | Resubmissions to journal editorial boards |
| **BibTeX** | `.bib` file with deduplicated references | Direct import into Overleaf, LaTeX, or Zotero |

---

## 🧪 Testing & Scientific Benchmark Suite

ManuView includes an end-to-end automated test and scientific benchmarking suite:

```bash
# Run all 56 unit and integration tests
npm test

# Run synthetic scientific validation benchmarks (17 detectors)
npm run benchmark

# Run golden layer benchmarks
npm run benchmark:gold

# Verify TypeScript build and production bundle
npm run build
```

---

## ⚠️ Scholarly Disclaimer & Responsible Use

- **Simulated Synthetic Personas**: All reviewer personas, editorial office notes, and adversarial critiques displayed in ManuView are synthetic, AI-simulated role models designed exclusively for pre-submission stress-testing and manuscript triage. They do **not** represent real living individuals, actual journal editorial boards, or binding peer-review decisions.
- **Offline Deterministic Audits vs. Synthetic Scoring**: When operated without an active LLM connection, ManuView strictly suppresses overall acceptance scores and simulated personas to safeguard scholarly integrity. Instead, it provides a transparent, deterministic compliance audit covering IMRaD section structure, statistical and protocol cues, reporting guideline adherence, DOI validity, and author self-citation density.
- **Decision-Support Only**: ManuView is designed solely to assist authors in pre-submission preparation and diagnostic triage. It does not replace domain expertise, formal peer review, institutional ethics boards, or editorial oversight.
- **Ethics Alignment**: Designed to assist compliance with international guidelines from the **Committee on Publication Ethics (COPE)** and the **International Committee of Medical Journal Editors (ICMJE)**.

---

## 🛡️ Privacy & Security Guarantee

1. **Zero Cloud Telemetry**: ManuView does not operate a central server that ingests or logs manuscript text.
2. **Local Storage**: All project cards, generated reviewer reports, cover letters, and diagnostic scores are saved strictly inside your local storage.
3. **Encrypted Direct Communication**: When calling cloud AI providers, communication is transmitted over HTTPS directly between your computer and the AI provider's official endpoint using your private key.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
