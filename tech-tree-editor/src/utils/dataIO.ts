import { NodeData, Connection, ConnectionStyle } from '../types/node';
import { CategoryConfig, useNodeStore } from '../store/nodeStore';

interface ExportData {
  version: string;
  exportedAt: string;
  nodes: NodeData[];
  connections: Connection[];
  categoryConfigs: CategoryConfig[];
  connectionStyle: ConnectionStyle;
}

export function exportData(
  nodes: NodeData[],
  connections: Connection[],
  categoryConfigs: CategoryConfig[],
  connectionStyle: ConnectionStyle
) {
  const data: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    nodes,
    connections,
    categoryConfigs,
    connectionStyle,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tech-tree-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ExportData;

        if (!Array.isArray(data.nodes) || !Array.isArray(data.connections)) {
          alert('文件格式不正确：缺少 nodes 或 connections 数据');
          return;
        }

        useNodeStore.setState({
          nodes: data.nodes,
          connections: data.connections,
          categoryConfigs: data.categoryConfigs || useNodeStore.getState().categoryConfigs,
          connectionStyle: data.connectionStyle || 'bezier',
          selectedNodeIds: [],
          addingConnection: null,
        });

        alert(`导入成功：${data.nodes.length} 个节点，${data.connections.length} 条连接`);
      } catch (err) {
        alert('导入失败：文件解析错误');
        console.error('Import error:', err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
