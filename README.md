# ManuView Desktop

<p align="center">
  <img src="public/icon.svg" width="96" height="96" alt="ManuView Logo" />
</p>

<h3 align="center">AI Pre-Submission Peer Review & Manuscript Diagnostic Suite</h3>

<p align="center">
  A native, privacy-first desktop application designed for researchers, clinicians, and academic authors to audit manuscripts, simulate 5-persona peer reviews, benchmark target journal fit, and verify citation integrity before formal submission.
</p>

<p align="center">
  <strong>100% Local & Private Processing</strong> &bull; <strong>Zero Unpublished Data Retention</strong> &bull; <strong>Multi-LLM Compatible</strong>
</p>

---

> [!NOTE]
> ### 🧪 Pre-compiled Installers are in Testing!
> Ready-to-use executable installers for **macOS (`.dmg` / `.app`)** and **Windows (`.exe` / `.msi`)** are currently in our testing phase and will be published directly under [GitHub Releases](https://github.com/khatiwada-bishal/manuview-desktop/releases).
> 
> If you'd like to try ManuView right now without waiting for the release packages, you can easily run it on your computer in just **2 minutes** using the simple instructions below!

---

## Table of Contents
1. [Core Features](#-core-features)
2. [How to Run Locally (Step-by-Step)](#-how-to-run-locally-step-by-step)
   - [Method 1: Web Preview (Fastest — No Rust Needed)](#method-1-web-preview-fastest--no-rust-needed)
   - [Method 2: Full Native Desktop App](#method-2-full-native-desktop-app)
3. [How to Get a Free AI API Key (No Credit Card Needed)](#-how-to-get-a-free-ai-api-key-no-credit-card-needed)
   - [1. Google AI Studio (Gemini) — Recommended](#1-google-ai-studio-gemini--recommended)
   - [2. GroqCloud (Ultra-Fast Llama 3.3)](#2-groqcloud-ultra-fast-llama-33)
   - [3. OpenRouter (Access to 100+ Free Models)](#3-openrouter-access-to-100-free-models)
   - [4. Mistral AI](#4-mistral-ai)
   - [5. Ollama (100% Offline, Zero Key Required)](#5-ollama-100-offline--zero-key-required)
4. [How to Add Your API Key in ManuView](#-how-to-add-your-api-key-in-manuview)
5. [Scholarly Disclaimer & Responsible Use](#-scholarly-disclaimer--responsible-use)
6. [Privacy & Security Guarantee](#-privacy--security-guarantee)

---

## 🚀 Core Features

- **Pre-Submission AI Review**: Simulates 5 specialized reviewer personas (Methodologist, Statistician, Domain Specialist, Clinical/Applied Reviewer, and Journal Editor) with 6 quantitative scoring dimensions.
- **Published Article & Guardrail Detection**: Automatically checks Crossref registries to verify already-published DOIs, and guards against evaluating non-academic files (CVs, resumes, code).
- **Journal Fit Predictor**: Analyzes manuscript title and abstract against 1,300+ journal catalog scopes, impact metrics, and editorial expectations.
- **Reference & Retraction Audit**: Scans references in real-time against Crossref DOI endpoints and Retraction Watch databases to flag retracted or broken citations.
- **Citation Claim Validator**: Validates whether assertions and empirical claims in your text are backed by cited literature.
- **PRISMA 2020 Flow Diagram Generator**: Interactive flow-diagram tool for systematic reviews with SVG/PDF export.
- **Journal Cover Letter Drafter**: Formats professional submission letters highlighting novelty, ethical clearances, and editorial fit.
- **Review Response Rebuttal Builder**: Generates point-by-point author rebuttal matrices to respond constructively to peer reviewer critiques.

---

## 💻 How to Run Locally (Step-by-Step)

You do not need deep programming experience to run ManuView on your computer. Follow either method below:

### Prerequisites (Only Node.js is required for Method 1)

1. **Install Node.js** (Version 18 or newer):
   - Download the official installer from [nodejs.org](https://nodejs.org/) (choose the **LTS** version).
   - Run the installer and click "Next" through the setup.
   - Verify installation by opening your Terminal (Mac) or Command Prompt / PowerShell (Windows) and typing:
     ```bash
     node -v
     npm -v
     ```

---

### Method 1: Web Preview (Fastest — No Rust Needed)

If you only have Node.js installed and don't want to install Rust compilers, you can run ManuView inside your web browser right away:

1. **Download or Clone the Repository**:
   ```bash
   git clone https://github.com/khatiwada-bishal/manuview-desktop.git
   cd manuview-desktop
   ```
   *(Alternatively, click the green **Code** button on GitHub &rarr; **Download ZIP**, and unzip the folder).*

2. **Install Dependencies**:
   Open Terminal / Command Prompt inside the `manuview-desktop` folder and run:
   ```bash
   npm install
   ```

3. **Start the Application**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   Open your browser and navigate to:
   ```
   http://localhost:1420
   ```
   *The entire ManuView suite will load with full functionality in your browser!*

---

### Method 2: Full Native Desktop App

To run ManuView as a native macOS window or Windows desktop program with native window controls:

1. **Install Rust** (Required for Tauri native apps):
   - **macOS / Linux**: Open your Terminal and run:
     ```bash
     curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
     ```
     Press `1` (Proceed with default installation), then restart your terminal.
   - **Windows**: Download and run **`rustup-init.exe`** from [rustup.rs](https://rustup.rs/).

2. **Launch the Native Desktop App**:
   Inside the `manuview-desktop` directory, run:
   ```bash
   npm run desktop:dev
   ```
   *Tauri will compile the native window and launch the ManuView desktop application automatically!*

---

## 🔑 How to Get a Free AI API Key (No Credit Card Needed)

ManuView operates on a **Bring-Your-Own-Key (BYOK)** model. This guarantees that **you own your data** and pay nothing extra. 

Several major AI providers offer generous, **100% free tiers** that require no credit card. Here are the best free options:

---

### 1. Google AI Studio (Gemini) — *Recommended*
> **Why choose it**: Generous free tier (up to 15 requests/minute), very fast, and exceptional at long academic papers.

1. Go to **[Google AI Studio](https://aistudio.google.com/)**.
2. Sign in with your standard Google / Gmail account.
3. In the left sidebar or top banner, click **"Get API key"**.
4. Click **"Create API key"** &rarr; Select any existing Google Cloud project or choose **"Create API key in new project"**.
5. Copy your generated key (starts with `AIzaSy...`).
6. **Recommended Model in ManuView**: `Gemini 2.5 Flash` or `Gemini 1.5 Flash`.

---

### 2. GroqCloud (Ultra-Fast Llama 3.3)
> **Why choose it**: Blazing fast response speeds (hundreds of tokens per second), completely free tier for open-weight models.

1. Go to **[GroqCloud Console](https://console.groq.com/)**.
2. Click **"Sign Up"** and log in with your Google or GitHub account.
3. In the left menu, click **"API Keys"** (or go directly to [console.groq.com/keys](https://console.groq.com/keys)).
4. Click **"Create API Key"**, give it a name (e.g., `ManuView`), and click **Submit**.
5. Copy your key (starts with `gsk_...`).
6. **Recommended Model in ManuView**: `llama-3.3-70b-versatile`.

---

### 3. OpenRouter (Access to 100+ Free Models)
> **Why choose it**: Access multiple state-of-the-art models from Meta, Qwen, Google, and Mistral with a single key.

1. Visit **[OpenRouter.ai](https://openrouter.ai/)**.
2. Sign in with Google, GitHub, or email.
3. Click on your profile icon in the top right &rarr; select **"Keys"** (or go to [openrouter.ai/keys](https://openrouter.ai/keys)).
4. Click **"Create Key"**, give it a label, and leave credit limit blank or set a limit.
5. Copy your key (starts with `sk-or-v1-...`).
6. OpenRouter provides dozens of models tagged `:free` (e.g. `meta-llama/llama-3.3-70b-instruct:free`, `google/gemini-2.0-flash-exp:free`).

---

### 4. Mistral AI
> **Why choose it**: High-quality European foundation models with strong reasoning capabilities.

1. Go to **[Mistral AI Console (La Plateforme)](https://console.mistral.ai/)**.
2. Create a free account.
3. In the left sidebar, click **"API Keys"**.
4. Click **"Create new key"**, name it `ManuView`, and copy the secret key.
5. **Recommended Model in ManuView**: `mistral-small-latest` or `codestral-latest`.

---

### 5. Ollama (100% Offline — Zero Key Required)
> **Why choose it**: If you work in a clinical or highly confidential environment and cannot send text to external APIs, run models 100% offline on your own GPU/CPU.

1. Download Ollama from **[ollama.com](https://ollama.com/)** (Mac, Windows, Linux).
2. Open your terminal and download an academic-grade open model:
   ```bash
   ollama run llama3.3
   ```
3. In ManuView Settings, select **Ollama (Local)**. The application will connect directly to `http://localhost:11434` without requiring any API key or internet access.

---

## ⚙️ How to Add Your API Key in ManuView

Once you have your key from any of the providers above:

1. Launch **ManuView Desktop** (or open `http://localhost:1420`).
2. Look at the bottom of the sidebar and click the **Settings (Gear icon)** next to the AI model indicator.
3. In the Settings dialog:
   - Select your **AI Provider** (e.g., *Google Gemini*, *Groq*, *OpenRouter*, etc.).
   - Select your preferred **Model** from the dropdown list.
   - Paste your key into the **API Key** field.
4. Click **"Check Latency"** / **"Test Connection"** to verify that your key connects successfully.
5. Click **"Save Settings"**.

> [!TIP]
> Your API key is stored **only inside your local device's storage**. It is never sent to ManuView servers or stored in any cloud database.

---

## ⚠️ Scholarly Disclaimer & Responsible Use

- **Use AI with Caution**: Generative AI models can occasionally produce inaccuracies, imprecise critiques, or false references. Always exercise independent scholarly judgment and verify citations and statistical parameters.
- **Supporting Decision-Support Only**: ManuView is designed to assist authors in pre-submission preparation and diagnostic triage. It does not replace domain expertise, formal ethical review boards, or institutional oversight.
- **No Publication Guarantee**: No automated system can guarantee manuscript acceptance or favorable peer review outcomes. Final editorial decisions rest exclusively with journal editors and external human peer reviewers.
- **Ethics Alignment**: Designed to assist compliance with international guidelines from the **Committee on Publication Ethics (COPE)** and the **International Committee of Medical Journal Editors (ICMJE)**.

---

## 🛡️ Privacy & Security Guarantee

1. **Zero Cloud Telemetry**: ManuView does not operate a central server that ingests or logs your manuscript text.
2. **Local Storage**: All project cards, generated reviewer reports, cover letters, and diagnostic scores are saved strictly inside your local browser or desktop app directory.
3. **Encrypted Direct Communication**: When calling your selected AI provider, communication is transmitted over HTTPS directly between your computer and the AI provider's official endpoint using your private key.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
