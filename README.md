# MergeMind - Intelligent Git Merge Conflict Resolution System

> **Understand. Resolve. Verify.**  
> An intelligent, AI-assisted Git merge conflict resolution platform that analyzes author intent, synthesizes safe unified solutions via Google Gemini, empowers developers with Monaco-powered human approval, verifies runtime and syntax integrity, and safely commits back to real local Git repositories.

---

## Problem Statement

Merge conflicts in long-lived feature branches consume vast amounts of engineering time. Traditional Git three-way merges only evaluate line-by-line text differences without understanding the functional intent of the code.

Even worse, developers rushing through conflict resolution often pick one side blindly or manually concatenate code in ways that compile without syntax errors but silently break application invariants, drop audit logging, or introduce subtle race conditions.

## Solution

**MergeMind** bridges the gap between raw Git text merging and true software engineering intelligence:
1. **Understands Intent**: Analyzes the common ancestor merge base, target branch modifications, and source branch modifications to understand what each author was trying to accomplish.
2. **AI Resolution Synthesis**: Employs Google Gemini with strict prompt engineering to harmonize complementary changes without inventing fake APIs or dropping critical validation or retry behavior.
3. **Human-in-the-Loop Approval**: Puts the developer in full control with a dark IDE-inspired 3-pane Monaco Diff & Code Editor to inspect, test, or modify proposed resolutions before anything touches the working tree.
4. **Automated Verification Engine**: Executes a 5-point verification pipeline (zero conflict markers, syntax balance, project builds, automated tests, Git working tree integrity).
5. **Safe Automated Git Commit**: Staged via `git add` and committed with the exact message `"resolved merge conflict"` only after verification passes.
6. **One-Click Instant Rollback**: Takes snapshots before modifications and can restore the repository to its pre-application state immediately if verification fails or the user cancels.

---

## System Architecture

```
                    ┌─────────────────────────────────────────┐
                    │               React UI                  │
                    │   TypeScript + TailwindCSS + Monaco     │
                    │   Dual Branch Pickers & AI Panel        │
                    └────────────────────┬────────────────────┘
                                         │ REST API
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │            Express Backend              │
                    │       Node.js + TypeScript + Zod        │
                    └────────────────────┬────────────────────┘
                                         │
              ┌──────────────────────────┼─────────────────────────┐
              │                          │                         │
              ▼                          ▼                         ▼
       ┌─────────────┐            ┌─────────────┐           ┌──────────────┐
       │ Git Service │            │ Gemini AI   │           │ DataStore    │
       │  (Git CLI)  │            │ (Google AI) │           │ (MongoDB/Mgo)│
       └──────┬──────┘            └──────┬──────┘           └──────────────┘
              │                          │
              ▼                          ▼
       Local Git Repo             Conflict Analysis
    (Windows/POSIX Safe)                 │
              │                          │
              └────────────┬─────────────┘
                           ▼
                    Human Approval
                   (Monaco Diff/Edit)
                           │
                           ▼
                    Apply Resolution
                           │
                           ▼
                   Verification Engine
                (Syntax, Build, Tests)
                           │
                           ▼
                 "resolved merge conflict"
```

---

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite
- **Styling**: TailwindCSS with custom Dark IDE theme
- **Code & Diff Editor**: Monaco Editor (`@monaco-editor/react`)
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Routing**: React Router v7

### Backend
- **Runtime**: Node.js v20+ / v22+
- **Framework**: Express.js with TypeScript
- **Validation**: Zod schema validation
- **Database**: MongoDB with Mongoose (with built-in resilient in-memory store fallback)
- **AI Integration**: Google Generative AI (`@google/generative-ai`)
- **Version Control**: Direct Git CLI integration via `child_process.execFile` with argument escaping and Windows path normalization
- **Process Management**: TSX for high-speed hot-reloading development

---

## Project Structure

```
merge-mind/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/       # Sidebar, Header, MainLayout
│   │   │   ├── repository/   # RepositorySelector, RepositoryInfo, BranchSelector, BranchComparison
│   │   │   ├── conflicts/    # ConflictList, ConflictCard, ConflictViewer, DiffViewer, ResolutionPanel
│   │   │   ├── ai/           # AIAnalysis, ConfidenceBadge, ResolutionExplanation, AIReasoning
│   │   │   ├── verification/ # VerificationPanel, VerificationStatus, TestResults
│   │   │   └── common/       # Button, Modal, Badge, Spinner, EmptyState, Toast
│   │   ├── pages/            # Dashboard, RepositoryPage, ConflictResolutionPage, VerificationPage, HistoryPage
│   │   ├── services/         # Axios API clients for repos, branches, AI, conflicts, verification
│   │   ├── hooks/            # useRepository, useBranches, useConflicts
│   │   ├── context/          # RepositoryContext for global state
│   │   ├── types/            # Strict TypeScript interfaces
│   │   └── utils/            # Formatters, constants, labels
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── server/
│   ├── src/
│   │   ├── config/           # env.ts (Zod), database.ts (Mongoose), gemini.ts (Google AI)
│   │   ├── controllers/      # repository, branch, conflict, ai, verification, demo
│   │   ├── routes/           # REST endpoints
│   │   ├── services/
│   │   │   ├── git/          # git.service, git.repository, git.branch, git.conflict, git.commit
│   │   │   ├── ai/           # gemini.service, conflict-analyzer, resolution-generator, prompts
│   │   │   ├── verification/ # verification.service, test-runner, syntax-checker
│   │   │   └── resolution/   # resolution.service, approval.service, apply-resolution.service
│   │   ├── models/           # Repository, AnalysisSession, Conflict, Resolution, OperationLog, DataStore
│   │   ├── middleware/       # Centralized error handler and Zod validation
│   │   ├── types/            # Backend TypeScript types
│   │   ├── utils/            # Logger, safe command execution, Windows path normalization
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── README.md
├── .gitignore
└── package.json
```

---

## How It Works

### 1. Repository Path Inspection
The user enters a path (e.g. `C:/Projects/coop` or `C:\Projects\coop`). The backend verifies:
- Path exists and is a directory
- Contains a valid `.git` tree
- Git CLI is installed and responsive
- Inspects current branch, modified files count, and latest commit info

### 2. Isolated Merge Simulation
When the user selects **Source Branch** (`feature/payment`) and **Target Branch** (`main`) and clicks **Analyze Merge**:
- MergeMind creates a temporary sandbox clone in `os.tmpdir()/mergemind-simulations/<sessionId>`.
- The original repository is **never touched** during analysis.
- Simulates `git merge --no-commit --no-ff` in the sandbox.
- Identifies conflicted files, line numbers, and hunks (`<<<<<<<`, `=======`, `>>>>>>>`).

### 3. Context & Intent Extraction
For every conflict, MergeMind extracts:
- Common ancestor base code (`git show <mergeBase>:<filePath>`)
- Target branch version (ours)
- Source branch version (theirs)
- Target diff against merge base
- Source diff against merge base
- Recent commit messages from both branches
- Surrounding code context

### 4. Gemini AI Intent Analysis
Gemini analyzes:
- Why the author of the target branch changed the lines
- Why the author of the source branch changed the lines
- Whether changes are independent, overlapping, or complementary
- Synthesizes a unified resolution that preserves both behaviors
- Classifies conflict type (`LOGIC_CONFLICT`, `IMPORT_CONFLICT`, `FUNCTION_CONFLICT`, etc.)
- Assigns a confidence score (0-100%) and outlines potential risks

### 5. Human-in-the-Loop Approval & Monaco Editing
- The developer reviews the proposal in Monaco Diff Editor.
- If satisfied, clicks **[Accept Resolution]** (marked as `ai_approved`).
- Or clicks **[Open in Editor]** to modify code directly in Monaco (marked as `human_modified`).
- Or marks **[Needs Human Review]** if team discussion is required.

### 6. Automated Verification Pipeline
Before committing, MergeMind executes:
1. **Conflict Markers Check**: Verifies zero `<<<<<<<`, `=======`, or `>>>>>>>` markers remain.
2. **Language Syntax Integrity**: Structural balance validation (brackets, braces, parentheses).
3. **Project Build Script**: If `package.json` contains `build`, executes `npm run build`.
4. **Automated Test Suite**: If `package.json` contains `test`, executes `npm test`.
5. **Git Tree Integrity**: Validates git porcelain status.

### 7. Commit & Rollback
- If verification passes: stages files with `git add <files>` and creates the commit:
  ```bash
  git commit -m "resolved merge conflict"
  ```
- If verification fails: commit is blocked and the user can click **[Rollback Changes]** to restore pre-application state instantly.

---

## 1-Click Hackathon Demo Scenario

To experience a realistic, verified end-to-end demo in under 60 seconds:
1. Click **"Load Demo Repo"** or **"Launch Instant Demo Repository"** on the Dashboard.
2. MergeMind automatically initializes a real Git repository with:
   - `main`: contains `processPayment()` with a 3-attempt resilient retry handler.
   - `feature/payment`: contains `processPayment()` with audit receipt confirmation.
3. Click **"Analyze Merge"**.
4. Watch MergeMind simulate the merge, extract the conflict, and invoke Gemini to produce a unified function preserving **both retry handling AND audit receipts**!
5. Inspect the Monaco diff, click **[Accept Resolution]**, run **Verification**, and watch it automatically stage and commit `"resolved merge conflict"`.

---

## Installation & Setup

### Prerequisites
- Node.js 20+ or 22+
- Git CLI installed on machine
- MongoDB (Optional: MergeMind includes automatic in-memory fallback storage if MongoDB is not running locally)

### 1. Install Dependencies
In the project root:
```bash
npm run install:all
```
Or manually:
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Configure Environment Variables
Copy `.env.example` in `server/`:
```bash
cd server
cp .env.example .env
```
Fill in your credentials:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
MONGODB_URI=mongodb://127.0.0.1:27017/mergemind
PORT=4000
CLIENT_URL=http://localhost:5173
```
*(Note: If GEMINI_API_KEY is not set, MergeMind runs with an intelligent local synthesis engine so tests and demos never crash!)*

### 3. Run Locally
From the root directory:
```bash
npm run dev
```
This concurrently starts:
- Backend Express API on `http://localhost:4000`
- Frontend Vite App on `http://localhost:5173`

---

## Security Model

- **No Shell Injection**: All Git commands use parameterized argument arrays (`execFile('git', [args])`).
- **No Arbitrary Shell Endpoint**: Frontend cannot execute arbitrary commands; only predefined Git operations exist.
- **Zero API Key Leakage**: `GEMINI_API_KEY` stays on the server and is never sent to the client.
- **Windows Path Sanitization**: Strips quotes and normalizes backslashes and slashes across platforms.
- **Non-destructive by default**: Merge simulations are conducted in isolated temporary clone sandboxes.

---

## License
MIT
