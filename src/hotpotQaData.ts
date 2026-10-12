export interface HotpotQASample {
  id: string;
  question: string;
  type: "comparison" | "bridge";
  level: "hard" | "medium";
  paper_ids: string[];
  paper_titles: string[];
  supporting_facts: Array<{
    paper_title: string;
    fact: string;
  }>;
  ground_truth_answer: string;
}

export const HOTPOTQA_MULTI_PAPER_DATASET: HotpotQASample[] = [
  {
    id: "hotpot_01",
    question: "Between Attention Is All You Need and Graph Convolutional Networks, which paper eliminates recurrence entirely in favor of attention, and how does the other paper process graph structures without full Chebyshev polynomials?",
    type: "comparison",
    level: "hard",
    paper_ids: ["1706.03762_Attention_Is_All_You_Need", "1609.02907_GCN"],
    paper_titles: ["Attention Is All You Need", "Semi-Supervised Classification with Graph Convolutional Networks"],
    supporting_facts: [
      {
        paper_title: "Attention Is All You Need",
        fact: "The Transformer replaces recurrence and convolutions entirely with multi-head self-attention, reducing maximum path length between tokens to O(1)."
      },
      {
        paper_title: "Semi-Supervised Classification with Graph Convolutional Networks",
        fact: "GCN simplifies spectral graph convolutions by truncating Chebyshev polynomials at K=1 with lambda_max=2 and introducing the renormalization trick A~ = A + I_N."
      }
    ],
    ground_truth_answer: "Attention Is All You Need replaces recurrence entirely with self-attention for sequence modeling. In contrast, GCN processes graph structures by adopting a first-order localized approximation of spectral convolutions using the renormalization trick rather than higher-order Chebyshev polynomials."
  },
  {
    id: "hotpot_02",
    question: "How do Graph Attention Networks (GAT) and Graph Convolutional Networks (GCN) differ in assigning edge weights to neighboring nodes during message passing?",
    type: "comparison",
    level: "hard",
    paper_ids: ["1710.10903_GAT", "1609.02907_GCN"],
    paper_titles: ["Graph Attention Networks", "Semi-Supervised Classification with Graph Convolutional Networks"],
    supporting_facts: [
      {
        paper_title: "Graph Attention Networks",
        fact: "GAT uses anisotropic multi-head self-attention with LeakyReLU non-linearities to assign dynamic, feature-dependent weights alpha_ij to neighbors."
      },
      {
        paper_title: "Semi-Supervised Classification with Graph Convolutional Networks",
        fact: "GCN relies on fixed, isotropic normalization factors derived strictly from graph degrees D~^(-1/2) A~ D~^(-1/2)."
      }
    ],
    ground_truth_answer: "GCN uses fixed isotropic weights based purely on graph topology (node degrees), whereas GAT uses dynamic anisotropic self-attention coefficients computed over node feature pairs with multi-head attention."
  },
  {
    id: "hotpot_03",
    question: "Comparing GraphSAGE and GCN, which architecture supports inductive generalization on unseen graphs and what neighborhood aggregation technique enables this?",
    type: "bridge",
    level: "medium",
    paper_ids: ["1706.02216_GraphSAGE", "1609.02907_GCN"],
    paper_titles: ["Inductive Representation Learning on Large Graphs", "Semi-Supervised Classification with Graph Convolutional Networks"],
    supporting_facts: [
      {
        paper_title: "Inductive Representation Learning on Large Graphs",
        fact: "GraphSAGE enables inductive representation learning on unseen nodes by training parameterized aggregator functions (such as Mean, LSTM, or Max-Pooling) over sampled local neighborhoods."
      },
      {
        paper_title: "Semi-Supervised Classification with Graph Convolutional Networks",
        fact: "Classic GCN requires full-graph Laplacian evaluation during training, making it inherently transductive."
      }
    ],
    ground_truth_answer: "GraphSAGE enables inductive generalization by learning parameterizable aggregator functions (Mean, Pooling, or LSTM) over uniformly sampled neighborhoods, unlike transductive GCN which relies on full-graph Laplacian evaluation."
  },
  {
    id: "hotpot_04",
    question: "Both Attention Is All You Need and Retrieval-Augmented Generation (RAG) address sequence modeling; how does RAG augment Transformer sequence generation with external non-parametric memory?",
    type: "bridge",
    level: "hard",
    paper_ids: ["1706.03762_Attention_Is_All_You_Need", "2005.11401_RAG"],
    paper_titles: ["Attention Is All You Need", "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"],
    supporting_facts: [
      {
        paper_title: "Attention Is All You Need",
        fact: "The Transformer relies entirely on parametric internal weights learned during pre-training without external retrieval."
      },
      {
        paper_title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
        fact: "RAG combines a pre-trained parametric seq2seq model (BART) with a non-parametric Dense Passage Retriever (DPR) index over 21 million Wikipedia passages using Maximum Inner Product Search."
      }
    ],
    ground_truth_answer: "While the Transformer stores knowledge purely in its internal feed-forward and attention weights, RAG augments the generator with a non-parametric dense passage retriever (DPR) querying 21M Wikipedia passages indexed in FAISS."
  },
  {
    id: "hotpot_05",
    question: "How do DeepWalk and node2vec construct vertex sequences from graphs to learn continuous feature representations, and how does node2vec generalize DeepWalk's random walk strategy?",
    type: "comparison",
    level: "medium",
    paper_ids: ["1403.6652_DeepWalk", "1607.00653_node2vec"],
    paper_titles: ["DeepWalk: Online Learning of Social Representations", "node2vec: Scalable Feature Learning for Networks"],
    supporting_facts: [
      {
        paper_title: "DeepWalk: Online Learning of Social Representations",
        fact: "DeepWalk samples vertex sequences using unbiased uniform random walks and feeds them into the Skip-gram language model."
      },
      {
        paper_title: "node2vec: Scalable Feature Learning for Networks",
        fact: "node2vec introduces 2nd-order biased random walks governed by parameters p (return) and q (in-out) to flexibly interpolate between BFS (microscopic homophily) and DFS (macroscopic structural equivalence)."
      }
    ],
    ground_truth_answer: "DeepWalk uses unbiased uniform random walks, while node2vec generalizes this by parameterizing the walks with return parameter p and in-out parameter q, allowing smooth interpolation between BFS and DFS graph exploration."
  },
  {
    id: "hotpot_06",
    question: "In comparing BERT and Attention Is All You Need, what key masking objective allows BERT to pre-train bidirectional representations without allowing tokens to trivially attend to their own target words?",
    type: "bridge",
    level: "hard",
    paper_ids: ["1810.04805_BERT", "1706.03762_Attention_Is_All_You_Need"],
    paper_titles: ["BERT: Pre-training of Deep Bidirectional Transformers", "Attention Is All You Need"],
    supporting_facts: [
      {
        paper_title: "Attention Is All You Need",
        fact: "Transformer decoders use triangular autoregressive causal masking to prevent attending to future tokens."
      },
      {
        paper_title: "BERT: Pre-training of Deep Bidirectional Transformers",
        fact: "BERT uses a Masked Language Model (MLM) objective where 15% of input tokens are masked or replaced, forcing the model to fuse left-and-right context to predict the corrupted tokens."
      }
    ],
    ground_truth_answer: "Unlike the causal future-masking in the Transformer decoder, BERT introduces the Masked Language Model (MLM) pre-training objective where 15% of tokens are corrupted, allowing bidirectional self-attention without label leakage."
  }
];
