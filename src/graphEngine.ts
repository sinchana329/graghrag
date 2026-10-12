import { GraphTopology, GraphNode, GraphEdge, SCCDiagnostics } from "./types";

/**
 * Executes Tarjan's Strongly Connected Components (SCC) algorithm on a directed graph.
 * Time Complexity: O(|V| + |E|)
 */
export function runTarjanSCC(nodes: GraphNode[], edges: GraphEdge[]): {
  sccs: string[][];
  nodeToScc: Map<string, number>;
} {
  let index = 0;
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const onStack = new Map<string, boolean>();
  const stack: string[] = [];
  const sccs: string[][] = [];
  const nodeToScc = new Map<string, number>();

  // Build adjacency list for directed edges
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    adj.set(n.id, []);
  }
  for (const e of edges) {
    if (adj.has(e.source)) {
      adj.get(e.source)!.push(e.target);
    }
  }

  function strongConnect(u: string) {
    indices.set(u, index);
    lowlinks.set(u, index);
    index++;
    stack.push(u);
    onStack.set(u, true);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (!indices.has(v)) {
        strongConnect(v);
        lowlinks.set(u, Math.min(lowlinks.get(u)!, lowlinks.get(v)!));
      } else if (onStack.get(v)) {
        lowlinks.set(u, Math.min(lowlinks.get(u)!, indices.get(v)!));
      }
    }

    if (lowlinks.get(u) === indices.get(u)) {
      const scc: string[] = [];
      let w = "";
      while (w !== u) {
        w = stack.pop()!;
        onStack.set(w, false);
        scc.push(w);
      }
      const sccIndex = sccs.length;
      sccs.push(scc);
      for (const member of scc) {
        nodeToScc.set(member, sccIndex);
      }
    }
  }

  for (const n of nodes) {
    if (!indices.has(n.id)) {
      strongConnect(n.id);
    }
  }

  return { sccs, nodeToScc };
}

/**
 * Finds all bridge edges and articulation points using Tarjan / Hopcroft DFS.
 * Considers graph connectivity to protect critical cut-edges.
 */
export function findBridgesAndArticulationPoints(
  nodes: GraphNode[],
  edges: GraphEdge[]
): {
  bridges: [string, string][];
  articulationPoints: string[];
} {
  let timer = 0;
  const tin = new Map<string, number>();
  const low = new Map<string, number>();
  const visited = new Set<string>();
  const bridges: [string, string][] = [];
  const articulationPoints = new Set<string>();

  // Build undirected adjacency list for cut-edge connectivity
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    adj.set(n.id, []);
  }
  for (const e of edges) {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      adj.get(e.target)!.push(e.source);
    }
  }

  function dfs(u: string, p = "") {
    visited.add(u);
    tin.set(u, timer);
    low.set(u, timer);
    timer++;
    let children = 0;

    for (const to of adj.get(u) || []) {
      if (to === p) continue;
      if (visited.has(to)) {
        low.set(u, Math.min(low.get(u)!, tin.get(to)!));
      } else {
        dfs(to, u);
        low.set(u, Math.min(low.get(u)!, low.get(to)!));
        if (low.get(to)! > tin.get(u)!) {
          bridges.push([u, to]);
        }
        if (low.get(to)! >= tin.get(u)! && p !== "") {
          articulationPoints.add(u);
        }
        children++;
      }
    }
    if (p === "" && children > 1) {
      articulationPoints.add(u);
    }
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) {
      dfs(n.id);
    }
  }

  return {
    bridges,
    articulationPoints: Array.from(articulationPoints)
  };
}

/**
 * Condenses a knowledge graph into its Tarjan quotient graph.
 * Any SCC with > 1 node is contracted into a single supernode.
 * Internal cyclic edges are collapsed; boundary edges and bridges are preserved.
 */
export function buildQuotientGraph(
  originalNodes: GraphNode[],
  originalEdges: GraphEdge[],
  supernodeNamePrefix = "SCC"
): GraphTopology {
  const { sccs, nodeToScc } = runTarjanSCC(originalNodes, originalEdges);
  const { bridges, articulationPoints } = findBridgesAndArticulationPoints(originalNodes, originalEdges);

  const nodeMap = new Map<string, GraphNode>();
  for (const n of originalNodes) {
    nodeMap.set(n.id, n);
  }

  const bridgeSet = new Set(bridges.map(([u, v]) => `${u}---${v}`));
  const apSet = new Set(articulationPoints);

  const compressedNodes: GraphNode[] = [];
  const sccIdMap = new Map<number, string>(); // sccIndex -> supernodeId or single nodeId

  // Form nodes
  for (let i = 0; i < sccs.length; i++) {
    const members = sccs[i];
    if (members.length > 1) {
      const memberObjs = members.map((id) => nodeMap.get(id)!).filter(Boolean);
      const superId = `scc_cluster_${i}_${members[0].slice(0, 8)}`;
      sccIdMap.set(i, superId);

      const superName = `${supernodeNamePrefix} [${memberObjs[0]?.name?.split(" ")[0] || "Core"} Cyclic Loop]`;
      compressedNodes.push({
        id: superId,
        name: superName,
        type: "Supernode",
        description: `Contracted quotient supernode containing ${members.length} cyclically interdependent components: ${memberObjs.map((m) => m.name).join(", ")}.`,
        is_supernode: true,
        member_count: members.length,
        member_node_ids: members,
        member_nodes: memberObjs
      });
    } else {
      const singleId = members[0];
      sccIdMap.set(i, singleId);
      const nodeObj = nodeMap.get(singleId);
      if (nodeObj) {
        compressedNodes.push({
          ...nodeObj,
          is_connector: apSet.has(singleId) || nodeObj.is_connector
        });
      }
    }
  }

  // Form edges in quotient graph
  const edgeKeySet = new Set<string>();
  const compressedEdges: GraphEdge[] = [];

  for (const e of originalEdges) {
    const sccU = nodeToScc.get(e.source);
    const sccV = nodeToScc.get(e.target);

    if (sccU === undefined || sccV === undefined) continue;

    // If within same SCC, internal cycle is collapsed into the supernode
    if (sccU === sccV) continue;

    const sourceCompId = sccIdMap.get(sccU)!;
    const targetCompId = sccIdMap.get(sccV)!;

    if (sourceCompId === targetCompId) continue;

    const edgeKey = `${sourceCompId}->${targetCompId}`;
    if (!edgeKeySet.has(edgeKey)) {
      edgeKeySet.add(edgeKey);
      const isBridge =
        bridgeSet.has(`${e.source}---${e.target}`) ||
        bridgeSet.has(`${e.target}---${e.source}`) ||
        e.is_bridge;

      compressedEdges.push({
        source: sourceCompId,
        target: targetCompId,
        type: e.type,
        weight: e.weight || 1.0,
        is_bridge: isBridge
      });
    }
  }

  const sccSizes = sccs.map((s) => s.length);
  const maxSccSize = Math.max(...sccSizes, 1);
  const totalNodes = originalNodes.length;
  const maxSccRatio = totalNodes > 0 ? maxSccSize / totalNodes : 0;
  const compressionRatio = totalNodes > 0 ? compressedNodes.length / totalNodes : 1.0;

  const diagnostics: SCCDiagnostics = {
    total_nodes: totalNodes,
    num_sccs: sccs.length,
    scc_sizes: sccSizes,
    max_scc_size: maxSccSize,
    max_scc_ratio: parseFloat(maxSccRatio.toFixed(3)),
    has_giant_scc: maxSccRatio >= 0.35
  };

  return {
    nodes: compressedNodes,
    edges: compressedEdges,
    node_count: compressedNodes.length,
    edge_count: compressedEdges.length,
    articulation_points: Array.from(apSet),
    bridges,
    compression_ratio: parseFloat(compressionRatio.toFixed(3)),
    diagnostics
  };
}

/**
 * Checks semantic and conceptual similarity between two nodes across different papers.
 */
export function areNodesSimilar(a: GraphNode, b: GraphNode): boolean {
  const nameA = a.name.toLowerCase().trim();
  const nameB = b.name.toLowerCase().trim();

  // 1. Exact match
  if (nameA === nameB) return true;

  // 2. Common concept clusters across machine learning / graph AI
  const conceptClusters = [
    ["attention", "self-attention", "multi-head attention", "scaled dot-product"],
    ["graph convolutional network", "graph convolution", "gcn", "spectral convolution"],
    ["graph attention network", "gat", "attention coefficient"],
    ["random walk", "deepwalk", "node2vec", "biased random walk"],
    ["adam optimizer", "optimizer", "adam", "gradient descent", "optimization"],
    ["cora", "citeseer", "pubmed", "citation network"],
    ["cross-entropy", "cross entropy", "loss", "negative sampling", "objective function"],
    ["layer normalization", "normalization", "renormalization trick", "degree normalization"],
    ["bleu", "accuracy", "f1 score", "micro-f1", "classification accuracy", "benchmark", "evaluation"],
    ["transformer", "encoder", "decoder", "sequence transduction"],
    ["embedding", "representation learning", "latent representation", "feature learning"],
    ["retrieval", "retrieval-augmented generation", "rag", "dense retriever"],
    ["prompting", "chain-of-thought", "reasoning", "cot"],
    ["knowledge graph", "triples", "kg embedding", "transE", "transH", "transR"]
  ];

  for (const cluster of conceptClusters) {
    const hasA = cluster.some(term => nameA.includes(term));
    const hasB = cluster.some(term => nameB.includes(term));
    if (hasA && hasB) return true;
  }

  // 3. Token overlap Jaccard similarity
  const tokensA = new Set(nameA.split(/[\s_\-(),/]+/).filter(w => w.length > 3));
  const tokensB = new Set(nameB.split(/[\s_\-(),/]+/).filter(w => w.length > 3));
  if (tokensA.size > 0 && tokensB.size > 0) {
    let intersection = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersection++;
    }
    const union = new Set([...tokensA, ...tokensB]).size;
    if (union > 0 && intersection / union >= 0.45) return true;
  }

  return false;
}

const PAPER_COLORS = [
  "#38bdf8", // Sky blue (Paper 1)
  "#f43f5e", // Rose (Paper 2)
  "#a855f7", // Violet (Paper 3)
  "#f59e0b", // Amber (Paper 4)
  "#06b6d4"  // Cyan (Paper 5)
];

/**
 * Combines multiple papers into a unified multi-paper graph:
 * - Similar/shared nodes are merged into a single unified shared concept node.
 * - Dissimilar nodes are preserved as distinct, separate nodes tagged with their source paper.
 * - Edges are properly re-routed and cross-paper bridges are established.
 * - Generates topologies for all 4 Graph RAG methods (Ours, Dynamic, Static, Local).
 */
export function combineMultiPaperTopologies(
  paperList: { id: string; title: string; nodes: GraphNode[]; edges: GraphEdge[] }[]
): {
  original_graph: GraphTopology;
  compressed_graph: GraphTopology;
  method_graphs: {
    ours: GraphTopology;
    dynamic: GraphTopology;
    static: GraphTopology;
    local: GraphTopology;
    original: GraphTopology;
  };
} {
  if (paperList.length === 1) {
    const p = paperList[0];
    const original = { nodes: p.nodes, edges: p.edges, node_count: p.nodes.length, edge_count: p.edges.length };
    const compressed = buildQuotientGraph(p.nodes, p.edges, "SCC");
    return {
      original_graph: original,
      compressed_graph: compressed,
      method_graphs: {
        ours: compressed,
        dynamic: compressed,
        static: original,
        local: original,
        original: original
      }
    };
  }

  // Step 1: Tag all original nodes with their originating paper info and assigned color
  const allRawNodes: GraphNode[] = [];
  const allRawEdges: GraphEdge[] = [];

  paperList.forEach((paper, pIdx) => {
    const color = PAPER_COLORS[pIdx % PAPER_COLORS.length];
    paper.nodes.forEach(n => {
      allRawNodes.push({
        ...n,
        paper_id: paper.id,
        paper_title: paper.title,
        color: color,
        is_shared: false
      });
    });
    allRawEdges.push(...paper.edges);
  });

  // Step 2: Cluster similar nodes across DIFFERENT papers
  // Find connected components of similarity
  const nodeMapping = new Map<string, string>(); // oldNodeId -> canonicalMergedNodeId
  const mergedClusters: { canonicalId: string; name: string; type: string; members: GraphNode[]; papers: Set<string> }[] = [];

  for (let i = 0; i < allRawNodes.length; i++) {
    const nodeA = allRawNodes[i];
    if (nodeMapping.has(nodeA.id)) continue;

    const matchedMembers: GraphNode[] = [nodeA];
    const matchedPapers = new Set<string>([nodeA.paper_id!]);

    for (let j = i + 1; j < allRawNodes.length; j++) {
      const nodeB = allRawNodes[j];
      // Only match if from a DIFFERENT paper
      if (nodeA.paper_id !== nodeB.paper_id && !nodeMapping.has(nodeB.id)) {
        if (areNodesSimilar(nodeA, nodeB)) {
          matchedMembers.push(nodeB);
          matchedPapers.add(nodeB.paper_id!);
        }
      }
    }

    if (matchedMembers.length > 1) {
      const slug = nodeA.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 16);
      const canonicalId = `merged_shared_${slug}_${mergedClusters.length}`;
      matchedMembers.forEach(m => nodeMapping.set(m.id, canonicalId));

      const paperTitles = matchedMembers.map(m => m.paper_title || "").filter(Boolean);
      mergedClusters.push({
        canonicalId,
        name: `${nodeA.name} [Shared Concept]`,
        type: "Shared Concept",
        members: matchedMembers,
        papers: matchedPapers
      });
    }
  }

  // Step 3: Construct the combined node list
  // Merged shared nodes + separate individual nodes that had no similarity
  const combinedNodes: GraphNode[] = [];

  // Add merged shared nodes
  mergedClusters.forEach(cluster => {
    const paperTitles = Array.from(new Set(cluster.members.map(m => m.paper_title || "")));
    const descriptions = cluster.members.map(m => `${m.paper_title}: ${m.description || m.name}`).join(" • ");
    combinedNodes.push({
      id: cluster.canonicalId,
      name: cluster.name,
      type: "Shared Concept",
      description: `🔗 Cross-Paper Shared Concept: Connects ${paperTitles.join(" and ")}. Details: ${descriptions}`,
      is_shared: true,
      color: "#10b981", // Emerald highlight for merged shared nodes
      source_papers: paperTitles,
      member_count: cluster.members.length,
      member_nodes: cluster.members
    });
  });

  // Add separate distinct nodes
  allRawNodes.forEach(n => {
    if (!nodeMapping.has(n.id)) {
      combinedNodes.push({
        ...n,
        is_shared: false
      });
    }
  });

  // Step 4: Rewire edges to point to merged nodes and deduplicate
  const edgeKeySet = new Set<string>();
  const combinedEdges: GraphEdge[] = [];

  allRawEdges.forEach(e => {
    const newSource = nodeMapping.get(e.source) || e.source;
    const newTarget = nodeMapping.get(e.target) || e.target;

    // Avoid self-loops created by merging
    if (newSource === newTarget) return;

    const edgeKey = `${newSource}->${newTarget}`;
    if (!edgeKeySet.has(edgeKey)) {
      edgeKeySet.add(edgeKey);
      const isCrossPaper = newSource.startsWith("merged_") || newTarget.startsWith("merged_");
      combinedEdges.push({
        source: newSource,
        target: newTarget,
        type: isCrossPaper ? "SHARED_CROSS_LINK" : e.type,
        weight: e.weight || 1.0,
        is_bridge: isCrossPaper || e.is_bridge,
        is_cross_paper: isCrossPaper,
        description: isCrossPaper ? "Cross-paper topological connection through shared concept" : e.description
      });
    }
  });

  // Step 5: If there are multiple papers and no shared nodes were found, create semantic bridges between central nodes
  if (mergedClusters.length === 0 && paperList.length > 1) {
    for (let p1 = 0; p1 < paperList.length; p1++) {
      for (let p2 = p1 + 1; p2 < paperList.length; p2++) {
        const root1 = paperList[p1].nodes[0];
        const root2 = paperList[p2].nodes[0];
        if (root1 && root2) {
          const edgeKey = `${root1.id}->${root2.id}`;
          if (!edgeKeySet.has(edgeKey)) {
            edgeKeySet.add(edgeKey);
            combinedEdges.push({
              source: root1.id,
              target: root2.id,
              type: "CROSS_PAPER_LINK",
              weight: 1.0,
              is_bridge: true,
              is_cross_paper: true,
              description: `Cross-paper link between ${paperList[p1].title} and ${paperList[p2].title}`
            });
          }
        }
      }
    }
  }

  // Step 6: Generate all 4 Graph RAG method topologies

  // 1. Ours: Tarjan SCC Quotient Graph
  const oursTopology = buildQuotientGraph(combinedNodes, combinedEdges, "SCC");

  // 2. Dynamic Selection: Focus on dynamic high-relevance central clusters & active cross-paper paths
  const dynamicNodes = combinedNodes.filter(n => {
    if (n.is_shared) return true;
    const deg = combinedEdges.filter(e => e.source === n.id || e.target === n.id).length;
    return deg >= 2; // prune low-degree periphery leaves
  });
  const dynNodeIds = new Set(dynamicNodes.map(n => n.id));
  const dynamicEdges = combinedEdges.filter(e => dynNodeIds.has(e.source) && dynNodeIds.has(e.target));
  const dynamicTopology: GraphTopology = {
    nodes: dynamicNodes,
    edges: dynamicEdges,
    node_count: dynamicNodes.length,
    edge_count: dynamicEdges.length,
    compression_ratio: parseFloat((dynamicNodes.length / Math.max(1, combinedNodes.length)).toFixed(2))
  };

  // 3. Static Baseline: Macro-community partition view
  const staticCommunities = new Map<string, GraphNode[]>();
  staticCommunities.set("Shared Concepts", combinedNodes.filter(n => n.is_shared));
  paperList.forEach(p => {
    staticCommunities.set(`${p.title.slice(0, 20)}... Modules`, combinedNodes.filter(n => !n.is_shared && n.paper_id === p.id));
  });

  const staticNodes: GraphNode[] = [];
  let commIdx = 0;
  staticCommunities.forEach((nodesInComm, commName) => {
    if (nodesInComm.length === 0) return;
    staticNodes.push({
      id: `comm_${commIdx++}`,
      name: commName,
      type: "Community Macro-Cluster",
      description: `Static level-1 cluster containing ${nodesInComm.length} member components: ${nodesInComm.slice(0, 3).map(m => m.name).join(", ")}`,
      member_count: nodesInComm.length,
      member_nodes: nodesInComm,
      is_supernode: true,
      color: commName.includes("Shared") ? "#10b981" : PAPER_COLORS[(commIdx - 1) % PAPER_COLORS.length]
    });
  });

  const staticEdges: GraphEdge[] = [];
  for (let i = 0; i < staticNodes.length; i++) {
    for (let j = i + 1; j < staticNodes.length; j++) {
      staticEdges.push({
        source: staticNodes[i].id,
        target: staticNodes[j].id,
        type: "COMMUNITY_INTERACTION",
        weight: 1.0,
        is_bridge: true
      });
    }
  }

  const staticTopology: GraphTopology = {
    nodes: staticNodes,
    edges: staticEdges,
    node_count: staticNodes.length,
    edge_count: staticEdges.length,
    compression_ratio: parseFloat((staticNodes.length / Math.max(1, combinedNodes.length)).toFixed(2))
  };

  // 4. Local Search: 2-Hop ego network around shared/bridge nodes
  const seedIds = new Set(combinedNodes.filter(n => n.is_shared).map(n => n.id));
  if (seedIds.size === 0 && combinedNodes.length > 0) {
    seedIds.add(combinedNodes[0].id);
  }
  // 1-hop
  const hop1Ids = new Set<string>();
  combinedEdges.forEach(e => {
    if (seedIds.has(e.source)) hop1Ids.add(e.target);
    if (seedIds.has(e.target)) hop1Ids.add(e.source);
  });
  // 2-hop
  const hop2Ids = new Set<string>();
  combinedEdges.forEach(e => {
    if (hop1Ids.has(e.source)) hop2Ids.add(e.target);
    if (hop1Ids.has(e.target)) hop2Ids.add(e.source);
  });

  const localNodeIds = new Set([...seedIds, ...hop1Ids, ...hop2Ids]);
  const localNodes = combinedNodes.filter(n => localNodeIds.has(n.id));
  const localEdges = combinedEdges.filter(e => localNodeIds.has(e.source) && localNodeIds.has(e.target));
  const localTopology: GraphTopology = {
    nodes: localNodes,
    edges: localEdges,
    node_count: localNodes.length,
    edge_count: localEdges.length,
    compression_ratio: parseFloat((localNodes.length / Math.max(1, combinedNodes.length)).toFixed(2))
  };

  const rawOriginalTopology: GraphTopology = {
    nodes: combinedNodes,
    edges: combinedEdges,
    node_count: combinedNodes.length,
    edge_count: combinedEdges.length,
    compression_ratio: 1.0
  };

  return {
    original_graph: rawOriginalTopology,
    compressed_graph: oursTopology,
    method_graphs: {
      ours: oursTopology,
      dynamic: dynamicTopology,
      static: staticTopology,
      local: localTopology,
      original: rawOriginalTopology
    }
  };
}
