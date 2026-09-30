import React, { useMemo, useState } from 'react';
import { GitGraphData, GitGraphNode } from '../../types/repository.js';
import { GitMerge, GitBranch, Copy, Check, Tag, Clock } from 'lucide-react';

interface GitGraphCanvasProps {
  graphData: GitGraphData;
  selectedCommit: GitGraphNode | null;
  onSelectCommit: (node: GitGraphNode) => void;
  hoveredCommit: GitGraphNode | null;
  onHoverCommit: (node: GitGraphNode | null) => void;
  filterBranch?: string;
  searchQuery?: string;
}

const ROW_HEIGHT = 48;
const COL_WIDTH = 28;
const GRAPH_PAD_LEFT = 32;
const GRAPH_PAD_TOP = 24;

const AVATAR_GRADIENTS = [
  'from-blue-600 to-indigo-600',
  'from-purple-600 to-pink-600',
  'from-emerald-600 to-teal-600',
  'from-amber-600 to-orange-600',
  'from-rose-600 to-red-600',
];

const getAvatarGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  }
  return AVATAR_GRADIENTS[hash];
};

export const GitGraphCanvas: React.FC<GitGraphCanvasProps> = ({
  graphData,
  selectedCommit,
  onSelectCommit,
  hoveredCommit,
  onHoverCommit,
  filterBranch = 'ALL',
  searchQuery = '',
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1800);
  };

  const { nodes, links } = graphData;

  // Compute maximum column used
  const maxCol = useMemo(() => {
    let max = 1;
    nodes.forEach((n) => {
      if (n.column > max) max = n.column;
    });
    return max + 1;
  }, [nodes]);

  const svgWidth = Math.max(180, GRAPH_PAD_LEFT + maxCol * COL_WIDTH + 32);
  const svgHeight = Math.max(480, GRAPH_PAD_TOP + nodes.length * ROW_HEIGHT + 36);

  // Quick lookup for row index by commit hash
  const rowIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    nodes.forEach((n, idx) => map.set(n.hash, idx));
    return map;
  }, [nodes]);

  // Filter nodes matching search query or branch filter
  const filteredIndices = useMemo(() => {
    const hasSearch = !!searchQuery.trim();
    const hasBranchFilter = filterBranch !== 'ALL';

    if (!hasSearch && !hasBranchFilter) return null;

    const q = searchQuery.toLowerCase().trim();
    const set = new Set<string>();

    nodes.forEach((n) => {
      let matchesSearch = true;
      if (hasSearch) {
        matchesSearch =
          n.message.toLowerCase().includes(q) ||
          n.shortHash.toLowerCase().includes(q) ||
          n.author.name.toLowerCase().includes(q) ||
          n.branches.some((b) => b.toLowerCase().includes(q));
      }

      let matchesBranch = true;
      if (hasBranchFilter) {
        matchesBranch =
          n.branches.some((b) => b.toLowerCase() === filterBranch.toLowerCase()) ||
          (n.isMerge && n.mergeInfo?.sourceBranch === filterBranch) ||
          (n.isMerge && n.mergeInfo?.targetBranch === filterBranch);
      }

      if (matchesSearch && matchesBranch) {
        set.add(n.hash);
      }
    });

    return set;
  }, [nodes, searchQuery, filterBranch]);

  // Determine connected commit hashes for hover highlight
  const activeHoverConnections = useMemo(() => {
    if (!hoveredCommit && !selectedCommit) return null;
    const target = hoveredCommit || selectedCommit;
    if (!target) return null;

    const connected = new Set<string>();
    connected.add(target.hash);

    // Add parents
    target.parents.forEach((p) => connected.add(p));

    // Add children
    nodes.forEach((n) => {
      if (n.parents.includes(target.hash)) {
        connected.add(n.hash);
      }
    });

    return connected;
  }, [hoveredCommit, selectedCommit, nodes]);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[#8b949e]">
        <div className="w-14 h-14 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-3 text-[#58a6ff]">
          <GitBranch className="w-6 h-6 opacity-75" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">No Commits in Repository</h3>
        <p className="text-xs max-w-sm leading-relaxed">
          This repository doesn't have any commits yet. Make a commit or branch to visualize the DAG tree.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-x-auto overflow-y-auto select-none bg-[#0d1117] h-full min-h-[500px]">
      <div className="min-w-[960px]">
        {/* Table Header */}
        <div className="sticky top-0 z-20 flex items-center border-b border-[#30363d] bg-[#161b22]/95 backdrop-blur-md text-[11px] font-mono uppercase tracking-wider text-[#8b949e] px-4 py-2.5 shadow-xs">
          <div style={{ width: `${svgWidth}px` }} className="shrink-0 px-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#58a6ff]/70" />
            <span>DAG Rails</span>
          </div>
          <div className="w-28 shrink-0 px-2">Commit</div>
          <div className="flex-1 min-w-[320px] px-3">Message & Branches</div>
          <div className="w-40 shrink-0 px-2">Author</div>
          <div className="w-32 shrink-0 px-3 text-right">Time</div>
        </div>

        {/* Content Container */}
        <div className="relative">
          {/* SVG Overlay for DAG Lines and Nodes */}
          <svg
            className="absolute top-0 left-0 pointer-events-none z-10"
            width={svgWidth}
            height={svgHeight}
            style={{ minHeight: `${nodes.length * ROW_HEIGHT + 30}px` }}
          >
            <defs>
              {/* Radial glow for merge convergence nodes */}
              <filter id="merge-halo" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. DAG Links / Branch Rails */}
            {links.map((link, idx) => {
              const x1 = GRAPH_PAD_LEFT + link.fromColumn * COL_WIDTH;
              const y1 = GRAPH_PAD_TOP + link.fromRow * ROW_HEIGHT;
              const toRow = rowIndexMap.get(link.toHash) ?? link.toRow;
              const x2 = GRAPH_PAD_LEFT + link.toColumn * COL_WIDTH;
              const y2 = GRAPH_PAD_TOP + toRow * ROW_HEIGHT;

              const isDirectlyConnected =
                activeHoverConnections !== null &&
                activeHoverConnections.has(link.fromHash) &&
                activeHoverConnections.has(link.toHash);

              const isDimmed = activeHoverConnections !== null && !isDirectlyConnected;

              // Bezier curve computation:
              // Both endpoints have vertical tangents (dx/dt = 0), guaranteeing seamless convergence at (x1, y1)
              let pathData = '';
              if (x1 === x2) {
                pathData = `M ${x1} ${y1} L ${x2} ${y2}`;
              } else {
                const dy = y2 - y1;
                const cp1x = x1;
                const cp1y = y1 + dy * 0.45;
                const cp2x = x2;
                const cp2y = y2 - dy * 0.45;
                pathData = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
              }

              return (
                <g
                  key={`link-${idx}-${link.fromHash.slice(0, 6)}-${link.toHash.slice(0, 6)}`}
                  className="transition-opacity duration-200"
                  style={{ opacity: isDimmed ? 0.2 : 1 }}
                >
                  {/* Subtle outer glow on merge line or highlighted rail */}
                  {(link.isMerge || isDirectlyConnected) && (
                    <path
                      d={pathData}
                      fill="none"
                      stroke={link.color}
                      strokeWidth={isDirectlyConnected ? 6.5 : 4}
                      strokeOpacity={isDirectlyConnected ? 0.45 : 0.2}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Primary Solid Track */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={link.color}
                    strokeWidth={isDirectlyConnected ? 3.8 : 2.4}
                    strokeOpacity={isDirectlyConnected ? 1 : link.isMerge ? 0.95 : 0.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}

            {/* 2. Commit Nodes */}
            {nodes.map((node, rowIdx) => {
              const cx = GRAPH_PAD_LEFT + node.column * COL_WIDTH;
              const cy = GRAPH_PAD_TOP + rowIdx * ROW_HEIGHT;
              const isSelected = selectedCommit?.hash === node.hash;
              const isHovered = hoveredCommit?.hash === node.hash;
              const isConnected = activeHoverConnections !== null && activeHoverConnections.has(node.hash);
              const isDimmed =
                (filteredIndices !== null && !filteredIndices.has(node.hash)) ||
                (activeHoverConnections !== null && !isConnected);

              return (
                <g
                  key={`node-${node.hash}`}
                  className="transition-all duration-150 cursor-pointer pointer-events-auto"
                  onClick={() => onSelectCommit(node)}
                  onMouseEnter={() => onHoverCommit(node)}
                  onMouseLeave={() => onHoverCommit(null)}
                  style={{ opacity: isDimmed ? 0.25 : 1 }}
                >
                  {/* Selection / Hover Glow Aura */}
                  {(isSelected || isHovered) && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={14}
                      fill="none"
                      stroke={isSelected ? '#58a6ff' : node.color}
                      strokeWidth={2}
                      strokeOpacity={0.6}
                      className="animate-pulse"
                    />
                  )}

                  {node.isMerge ? (
                    /* Clean Merge Commit Node (Double Concentric Ring Signifying 2 Branches Converging) */
                    <g filter={isSelected || isHovered ? 'url(#merge-halo)' : undefined}>
                      {/* Outer Ring */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={9}
                        fill="#0d1117"
                        stroke={node.color}
                        strokeWidth={2.6}
                      />
                      {/* Inner Core */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4.2}
                        fill={node.color}
                      />
                    </g>
                  ) : node.isHead ? (
                    /* HEAD Commit Node */
                    <g>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={8}
                        fill={node.color}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={3.2}
                        fill="#ffffff"
                      />
                    </g>
                  ) : (
                    /* Standard Commit Node */
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6.5}
                      fill={node.color}
                      stroke="#0d1117"
                      strokeWidth={2.2}
                      className="transition-transform duration-100 hover:scale-125"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* HTML Rows aligned with graph SVG rows */}
          <div className="divide-y divide-[#21262d]/40">
            {nodes.map((node, rowIdx) => {
              const isSelected = selectedCommit?.hash === node.hash;
              const isHovered = hoveredCommit?.hash === node.hash;
              const isConnected = activeHoverConnections !== null && activeHoverConnections.has(node.hash);
              const isDimmed =
                (filteredIndices !== null && !filteredIndices.has(node.hash)) ||
                (activeHoverConnections !== null && !isConnected);

              return (
                <div
                  key={node.hash}
                  style={{ height: `${ROW_HEIGHT}px` }}
                  onClick={() => onSelectCommit(node)}
                  onMouseEnter={() => onHoverCommit(node)}
                  onMouseLeave={() => onHoverCommit(null)}
                  className={`flex items-center px-4 cursor-pointer transition-all duration-150 relative ${
                    isSelected
                      ? 'bg-[#1f2937]/70 border-l-4 border-[#58a6ff]'
                      : isHovered
                      ? 'bg-[#161b22]/80 border-l-4 border-[#a371f7]/50'
                      : 'border-l-4 border-transparent hover:bg-[#161b22]/40'
                  } ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
                >
                  {/* Left spacer matching graph SVG column width */}
                  <div style={{ width: `${svgWidth}px` }} className="shrink-0 pointer-events-none" />

                  {/* Commit SHA Badge */}
                  <div className="w-28 shrink-0 px-2 flex items-center gap-1.5">
                    <span className="font-mono text-xs font-medium text-[#79c0ff] bg-[#58a6ff]/10 hover:bg-[#58a6ff]/20 px-2 py-0.5 rounded border border-[#58a6ff]/25 transition-colors">
                      {node.shortHash}
                    </span>
                    <button
                      onClick={(e) => handleCopy(node.hash, e)}
                      title="Copy full commit SHA"
                      className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-colors"
                    >
                      {copiedHash === node.hash ? (
                        <Check className="w-3.5 h-3.5 text-[#3fb950]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Description, Merge Pill & Branch Badges */}
                  <div className="flex-1 min-w-[320px] px-3 flex items-center gap-2 overflow-hidden">
                    {/* Merge Badge */}
                    {node.isMerge && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-linear-to-r from-[#a371f7]/25 to-[#58a6ff]/25 text-[#d2a8ff] border border-[#a371f7]/40 shadow-xs">
                        <GitMerge className="w-3 h-3 text-[#a371f7]" />
                        <span>MERGE</span>
                      </span>
                    )}

                    {/* HEAD Badge */}
                    {node.isHead && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#3fb950]/20 text-[#56d364] border border-[#3fb950]/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
                        <span>HEAD</span>
                      </span>
                    )}

                    {/* Branch Pills */}
                    {node.branches.map((branch) => {
                      const isMainOrMaster = branch === 'main' || branch === 'master';
                      return (
                        <span
                          key={branch}
                          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                            isMainOrMaster
                              ? 'bg-[#58a6ff]/15 text-[#79c0ff] border-[#58a6ff]/35'
                              : 'bg-[#a371f7]/15 text-[#d2a8ff] border-[#a371f7]/35'
                          }`}
                        >
                          <GitBranch className="w-2.5 h-2.5" />
                          <span>{branch}</span>
                        </span>
                      );
                    })}

                    {/* Tag Pills */}
                    {node.tags.map((tag) => (
                      <span
                        key={tag}
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#d29922]/20 text-[#e3b341] border border-[#d29922]/40"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>{tag}</span>
                      </span>
                    ))}

                    {/* Commit Message */}
                    <span
                      title={node.message}
                      className={`text-xs truncate transition-colors ${
                        node.isMerge
                          ? 'font-medium text-white'
                          : isSelected
                          ? 'text-white'
                          : 'text-[#c9d1d9]'
                      }`}
                    >
                      {node.message}
                    </span>
                  </div>

                  {/* Author Avatar & Name */}
                  <div className="w-40 shrink-0 px-2 flex items-center gap-2 overflow-hidden text-xs text-[#8b949e]">
                    <div
                      className={`w-6 h-6 rounded-full bg-linear-to-br ${getAvatarGradient(
                        node.author.name
                      )} flex items-center justify-center text-[10px] font-bold text-white shadow-xs shrink-0`}
                    >
                      {node.author.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate text-[#c9d1d9]" title={`${node.author.name} <${node.author.email}>`}>
                      {node.author.name}
                    </span>
                  </div>

                  {/* Relative Time */}
                  <div className="w-32 shrink-0 px-3 text-right text-xs text-[#8b949e] font-mono flex items-center justify-end gap-1.5">
                    <Clock className="w-3 h-3 text-[#6e7681]" />
                    <span title={new Date(node.date).toLocaleString()}>{node.relativeDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
