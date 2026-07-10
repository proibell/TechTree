export interface Port {
  id: string;
  name: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

export type NodeCategory = string;

export interface NodeData {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  ports: Port[];
  category: NodeCategory;
  completed: boolean;
}

export type ConnectionStyle = 'straight' | 'orthogonal' | 'bezier';

export interface Connection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  style?: ConnectionStyle;
}