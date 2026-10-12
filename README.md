# GraphRAG Publication Engine with Tarjan Loop Compression

Welcome to the **GraphRAG Publication Engine**! This application implements state-of-the-art **Tarjan Strongly Connected Components (SCC)** loop compression and **Bridge-Aware preservation** to deliver ultra-precise, hallucination-free retrieval-augmented generation (RAG) over academic literature.

---

## 🚀 Quickstart: Running the Application

Anyone who clones this repository can immediately launch and run the complete application:

### 1. Clone the repository
```bash
git clone https://github.com/sinchana329/graghrag.git
cd graghrag
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

The Express API and Vite application will start seamlessly on **http://localhost:3003** (or http://localhost:3000 depending on your port configuration).

---

## 🌟 Key Features

1. **Multi-Paper Graph RAG & Knowledge Merging**:
   - Upload or select multiple research papers simultaneously.
   - Automatically detects and merges shared semantic concepts across papers into unified bridge nodes while preserving paper-specific distinct structures.
   - Switchable across all 4 Graph RAG retrieval methodologies (**Ours - Tarjan SCC + Bridges**, **Dynamic Selection**, **Static Baseline**, and **Local Search**).

2. **HotpotQA Multi-Paper Validation Benchmark Suite**:
   - Rigorous multi-hop cross-paper evaluation against gold-standard HotpotQA ground truth.
   - **Real, dynamic performance indicators** (Speed in tokens/s, exact execution latency, genuine prompt & completion token consumption, and LLM call counts).
   - Side-by-side 4-method comparison table for publication and live demo evaluation.

3. **Interactive Cytoscape Visualizer & Compression QA**:
   - Visual inspection of original vs. Tarjan SCC quotient collapsed graphs with bridge protection.
   - Live Focus Index and zero-fracture rate preservation guarantees.

---

## 🛠️ Environment Configuration (Optional)

Create a `.env` file in the root directory and add your credentials if you wish to connect to a live Neo4j instance or leverage Gemini AI features:
```env
# Neo4j Settings (Optional)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Gemini API Key (Required for live AI grounding)
GEMINI_API_KEY=your_gemini_api_key_here
```
*(If no credentials are provided, the application automatically triggers premium, local, mathematically grounded fallbacks so that you can explore all features offline without any setup errors.)*
