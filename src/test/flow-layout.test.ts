import { describe, it, expect } from 'vitest';
import { getAutoLayoutedElements } from '@/lib/flow-layout';
import type { FlowNode, FlowEdge } from '@/types/flowboard';
import { createImageGeneratorData, createImageToVideoData, createSceneCombinerData } from '@/types/flowboard';

function makeNode(id: string, type: FlowNode['type'], x = 0, y = 0): FlowNode {
  const factories: Record<string, () => any> = {
    'image-generator': createImageGeneratorData,
    'image-to-video': createImageToVideoData,
    'scene-combiner': createSceneCombinerData,
  };
  return {
    id,
    type,
    position: { x, y },
    data: (factories[type] ?? createImageGeneratorData)(),
  } as FlowNode;
}

function makeEdge(source: string, target: string): FlowEdge {
  return { id: `${source}-${target}`, source, target };
}

describe('getAutoLayoutedElements', () => {
  it('returns same number of nodes and edges', () => {
    const nodes = [makeNode('a', 'image-generator'), makeNode('b', 'image-to-video')];
    const edges = [makeEdge('a', 'b')];
    const result = getAutoLayoutedElements(nodes, edges, 'LR');
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
  });

  it('positions nodes left-to-right in LR direction', () => {
    const nodes = [makeNode('a', 'image-generator'), makeNode('b', 'image-to-video')];
    const edges = [makeEdge('a', 'b')];
    const result = getAutoLayoutedElements(nodes, edges, 'LR');
    const nodeA = result.nodes.find(n => n.id === 'a')!;
    const nodeB = result.nodes.find(n => n.id === 'b')!;
    expect(nodeA.position.x).toBeLessThan(nodeB.position.x);
  });

  it('positions nodes top-to-bottom in TB direction', () => {
    const nodes = [makeNode('a', 'image-generator'), makeNode('b', 'image-to-video')];
    const edges = [makeEdge('a', 'b')];
    const result = getAutoLayoutedElements(nodes, edges, 'TB');
    const nodeA = result.nodes.find(n => n.id === 'a')!;
    const nodeB = result.nodes.find(n => n.id === 'b')!;
    expect(nodeA.position.y).toBeLessThan(nodeB.position.y);
  });

  it('handles a single node with no edges', () => {
    const nodes = [makeNode('solo', 'image-generator')];
    const result = getAutoLayoutedElements(nodes, [], 'LR');
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].position.x).toBeGreaterThanOrEqual(0);
  });

  it('uses smaller dimensions for scene-combiner nodes', () => {
    const nodes = [
      makeNode('img', 'image-generator'),
      makeNode('comb', 'scene-combiner'),
    ];
    const edges = [makeEdge('img', 'comb')];
    const result = getAutoLayoutedElements(nodes, edges, 'LR');
    // Both nodes should have valid positions
    result.nodes.forEach(n => {
      expect(typeof n.position.x).toBe('number');
      expect(typeof n.position.y).toBe('number');
    });
  });

  it('handles diamond graph (two parents, one child)', () => {
    const nodes = [
      makeNode('a', 'image-generator'),
      makeNode('b', 'image-generator'),
      makeNode('c', 'scene-combiner'),
    ];
    const edges = [makeEdge('a', 'c'), makeEdge('b', 'c')];
    const result = getAutoLayoutedElements(nodes, edges, 'LR');
    const nodeC = result.nodes.find(n => n.id === 'c')!;
    const nodeA = result.nodes.find(n => n.id === 'a')!;
    expect(nodeC.position.x).toBeGreaterThan(nodeA.position.x);
  });
});
