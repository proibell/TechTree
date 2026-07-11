import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { NodeData, Connection, Port, ConnectionStyle } from '../types/node';

export interface CategoryConfig {
  key: string;
  label: string;
  color: string;
}

interface NodeStore {
  nodes: NodeData[];
  connections: Connection[];
  selectedNodeIds: string[];
  selectedConnectionIds: string[];
  draggedNodeId: string | null;
  addingConnection: { fromNodeId: string; fromPortId: string } | null;
  connectionStyle: ConnectionStyle;
  isDragging: boolean;
  categoryConfigs: CategoryConfig[];
  theme: 'light' | 'dark' | 'pixel';
  setTheme: (theme: 'light' | 'dark' | 'pixel') => void;
  copiedNodes: NodeData[];
  copyNodes: (ids: string[]) => void;
  pasteNodes: () => void;
  
  addNode: (node: Omit<NodeData, 'id'>) => void;
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  selectNodes: (ids: string[]) => void;
  moveNode: (id: string, x: number, y: number) => void;
  
  addConnection: (connection: Omit<Connection, 'id'>) => void;
  deleteConnection: (id: string) => void;
  updateConnectionStyle: (id: string, style: ConnectionStyle) => void;
  setConnectionStyle: (style: ConnectionStyle) => void;
  startConnection: (nodeId: string, portId: string) => void;
  endConnection: (nodeId: string, portId: string) => void;
  cancelConnection: () => void;
  selectConnection: (id: string | null) => void;
  selectConnections: (ids: string[]) => void;
  
  addPort: (nodeId: string, port: Omit<Port, 'id'>) => void;
  updatePort: (nodeId: string, portId: string, updates: Partial<Port>) => void;
  deletePort: (nodeId: string, portId: string) => void;
  setIsDragging: (dragging: boolean) => void;
  
  updateCategoryConfig: (key: string, config: Partial<CategoryConfig>) => void;
  addCategoryConfig: (config: Omit<CategoryConfig, 'key'>) => void;
  deleteCategoryConfig: (key: string) => void;
  getCategoryConfig: (key: string) => CategoryConfig | undefined;
  getCategoryColor: (key: string) => string;
  getCategoryLabel: (key: string) => string;
  
  getRelatedNodeIds: (nodeId: string) => string[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useNodeStore = create<NodeStore>()(
  persist(
    (set, get) => ({
  nodes: [
    {
      id: 'node-1',
      title: '输入节点',
      description: '数据源输入',
      x: 400,
      y: 80,
      category: 'A',
      completed: false,
      ports: [
        { id: 'port-1-bottom', name: '输出', position: 'bottom', dataType: 'object' }
      ]
    },
    {
      id: 'node-2',
      title: '处理节点',
      description: '数据处理逻辑',
      x: 400,
      y: 250,
      category: 'B',
      completed: false,
      ports: [
        { id: 'port-2-top', name: '输入', position: 'top', dataType: 'object' },
        { id: 'port-2-bottom', name: '结果', position: 'bottom', dataType: 'object' }
      ]
    },
    {
      id: 'node-3',
      title: '输出节点',
      description: '数据输出',
      x: 400,
      y: 420,
      category: 'C',
      completed: false,
      ports: [
        { id: 'port-3-top', name: '输入', position: 'top', dataType: 'object' }
      ]
    }
  ],
  connections: [
    {
      id: 'conn-1',
      fromNodeId: 'node-1',
      fromPortId: 'port-1-bottom',
      toNodeId: 'node-2',
      toPortId: 'port-2-top'
    },
    {
      id: 'conn-2',
      fromNodeId: 'node-2',
      fromPortId: 'port-2-bottom',
      toNodeId: 'node-3',
      toPortId: 'port-3-top'
    }
  ],
  selectedNodeIds: [],
  selectedConnectionIds: [],
  draggedNodeId: null,
  addingConnection: null,
  connectionStyle: 'bezier',
  isDragging: false,
  categoryConfigs: [
    { key: 'default', label: '默认', color: '#6B7280' },
    { key: 'A', label: 'A类', color: '#3B82F6' },
    { key: 'B', label: 'B类', color: '#10B981' },
    { key: 'C', label: 'C类', color: '#F97316' },
    { key: 'D', label: 'D类', color: '#8B5CF6' }
  ],
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  copiedNodes: [],
  copyNodes: (ids) => set((state) => ({
    copiedNodes: state.nodes.filter(node => ids.includes(node.id)).map(node => ({ ...node }))
  })),
  pasteNodes: () => set((state) => {
    if (state.copiedNodes.length === 0) return state;

    const OFFSET = 30;
    const newNodes: NodeData[] = [];
    const newConnections: Connection[] = [];
    const idMap: Record<string, string> = {};

    const minX = Math.min(...state.copiedNodes.map(n => n.x));
    const minY = Math.min(...state.copiedNodes.map(n => n.y));

    for (const node of state.copiedNodes) {
      const newId = generateId();
      idMap[node.id] = newId;
      newNodes.push({
        ...node,
        id: newId,
        x: node.x - minX + OFFSET,
        y: node.y - minY + OFFSET,
        ports: node.ports.map(port => ({ ...port, id: generateId() }))
      });
    }

    const copiedNodeIds = new Set(state.copiedNodes.map(n => n.id));
    for (const conn of state.connections) {
      if (copiedNodeIds.has(conn.fromNodeId) && copiedNodeIds.has(conn.toNodeId)) {
        const fromNode = state.copiedNodes.find(n => n.id === conn.fromNodeId);
        const toNode = state.copiedNodes.find(n => n.id === conn.toNodeId);
        if (fromNode && toNode) {
          const fromPort = fromNode.ports.find(p => p.id === conn.fromPortId);
          const toPort = toNode.ports.find(p => p.id === conn.toPortId);
          if (fromPort && toPort) {
            const newFromNode = newNodes.find(n => idMap[conn.fromNodeId] === n.id);
            const newToNode = newNodes.find(n => idMap[conn.toNodeId] === n.id);
            if (newFromNode && newToNode) {
              const newFromPort = newFromNode.ports.find(p => p.position === fromPort.position);
              const newToPort = newToNode.ports.find(p => p.position === toPort.position);
              if (newFromPort && newToPort) {
                newConnections.push({
                  id: generateId(),
                  fromNodeId: newFromNode.id,
                  fromPortId: newFromPort.id,
                  toNodeId: newToNode.id,
                  toPortId: newToPort.id,
                  style: conn.style || state.connectionStyle
                });
              }
            }
          }
        }
      }
    }

    return {
      nodes: [...state.nodes, ...newNodes],
      connections: [...state.connections, ...newConnections],
      selectedNodeIds: newNodes.map(n => n.id)
    };
  }),

  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, { ...node, id: generateId() }]
  })),

  updateNode: (id, updates) => set((state) => ({
    nodes: state.nodes.map(node =>
      node.id === id ? { ...node, ...updates } : node
    )
  })),

  deleteNode: (id) => set((state) => ({
    nodes: state.nodes.filter(node => node.id !== id),
    connections: state.connections.filter(
      conn => conn.fromNodeId !== id && conn.toNodeId !== id
    ),
    selectedNodeIds: state.selectedNodeIds.filter(sid => sid !== id)
  })),

  selectNode: (id) => set({ selectedNodeIds: id ? [id] : [] }),
  selectNodes: (ids) => set({ selectedNodeIds: ids }),
  setDraggedNodeId: (id) => set({ draggedNodeId: id }),

  moveNode: (id, x, y) => set((state) => ({
    nodes: state.nodes.map(node =>
      node.id === id ? { ...node, x, y } : node
    )
  })),

  addConnection: (connection) => {
    const newConn = { ...connection, id: generateId() };
    console.log('Adding connection:', newConn);
    set((state) => ({
      connections: [...state.connections, newConn]
    }));
  },

  deleteConnection: (id) => set((state) => ({
    connections: state.connections.filter(conn => conn.id !== id)
  })),

  updateConnectionStyle: (id, style) => set((state) => ({
    connections: state.connections.map(conn =>
      conn.id === id ? { ...conn, style } : conn
    )
  })),

  setConnectionStyle: (style) => set((state) => ({
    connectionStyle: style,
    connections: state.connections.map(conn => ({ ...conn, style }))
  })),

  startConnection: (nodeId, portId) => set({
    addingConnection: { fromNodeId: nodeId, fromPortId: portId }
  }),

  endConnection: (nodeId, portId) => {
    console.log('endConnection called', { nodeId, portId });
    const state = get();
    if (state.addingConnection) {
      if (state.addingConnection.fromNodeId !== nodeId) {
        get().addConnection({
          fromNodeId: state.addingConnection.fromNodeId,
          fromPortId: state.addingConnection.fromPortId,
          toNodeId: nodeId,
          toPortId: portId,
          style: state.connectionStyle
        });
      }
      set({ addingConnection: null });
    }
  },

  cancelConnection: () => set({ addingConnection: null }),

  selectConnection: (id) => set({ selectedConnectionIds: id ? [id] : [] }),
  selectConnections: (ids) => set({ selectedConnectionIds: ids }),

  addPort: (nodeId, port) => set((state) => ({
    nodes: state.nodes.map(node =>
      node.id === nodeId
        ? { ...node, ports: [...node.ports.filter(p => p.position !== port.position), { ...port, id: generateId() }] }
        : node
    )
  })),

  updatePort: (nodeId, portId, updates) => set((state) => ({
    nodes: state.nodes.map(node =>
      node.id === nodeId
        ? {
            ...node,
            ports: node.ports
              .filter(p => !(p.position === updates.position && p.id !== portId))
              .map(p => p.id === portId ? { ...p, ...updates } : p)
          }
        : node
    )
  })),

  deletePort: (nodeId, portId) => set((state) => ({
    nodes: state.nodes.map(node =>
      node.id === nodeId
        ? {
            ...node,
            ports: node.ports.filter(p => p.id !== portId)
          }
        : node
    ),
    connections: state.connections.filter(
      conn => !(conn.fromNodeId === nodeId && conn.fromPortId === portId) &&
              !(conn.toNodeId === nodeId && conn.toPortId === portId)
    )
  })),

  setIsDragging: (dragging) => set({ isDragging: dragging }),

  updateCategoryConfig: (key, config) => set((state) => ({
    categoryConfigs: state.categoryConfigs.map(c =>
      c.key === key ? { ...c, ...config } : c
    )
  })),

  addCategoryConfig: (config: Omit<CategoryConfig, 'key'>) => set((state) => {
    const usedKeys = new Set(state.categoryConfigs.map(c => c.key));
    let nextKey = 'A';
    while (usedKeys.has(nextKey)) {
      nextKey = String.fromCharCode(nextKey.charCodeAt(0) + 1);
    }
    return {
      categoryConfigs: [...state.categoryConfigs, { ...config, key: nextKey }]
    };
  }),

  deleteCategoryConfig: (key: string) => set((state) => {
    if (key === 'default') {
      return state;
    }
    return {
      categoryConfigs: state.categoryConfigs.filter(c => c.key !== key),
      nodes: state.nodes.map(node =>
        node.category === key ? { ...node, category: 'default' } : node
      )
    };
  }),

  getCategoryConfig: (key) => {
    const state = get();
    return state.categoryConfigs.find(c => c.key === key);
  },

  getCategoryColor: (key) => {
    const config = get().getCategoryConfig(key);
    return config?.color || '#6B7280';
  },

  getCategoryLabel: (key) => {
    const config = get().getCategoryConfig(key);
    return config?.label || key;
  },

  getRelatedNodeIds: (nodeId: string) => {
    const state = get();
    const relatedIds = new Set<string>();
    const visited = new Set<string>();
    const queue: string[] = [nodeId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      const outgoingConnections = state.connections.filter(c => c.fromNodeId === currentId);
      for (const conn of outgoingConnections) {
        const targetId = conn.toNodeId;
        if (!relatedIds.has(targetId)) {
          relatedIds.add(targetId);
          queue.push(targetId);
        }
      }
    }
    
    return Array.from(relatedIds);
  }
    }),
    {
      name: 'tech-tree-editor-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        connections: state.connections,
        connectionStyle: state.connectionStyle,
        categoryConfigs: state.categoryConfigs,
        theme: state.theme,
      }),
    }
  )
);