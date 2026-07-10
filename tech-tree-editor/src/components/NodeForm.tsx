import { useState, useEffect } from 'react';
import { useNodeStore } from '../store/nodeStore';
import { Port } from '../types/node';

const dataTypes = [
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔' },
  { value: 'object', label: '对象' },
  { value: 'array', label: '数组' }
];

const portPositions = [
  { value: 'top', label: '上方' },
  { value: 'bottom', label: '下方' },
  { value: 'left', label: '左方' },
  { value: 'right', label: '右方' }
];

export default function NodeForm() {
  const { nodes, selectedNodeIds, updateNode, deleteNode, addPort, updatePort, deletePort, categoryConfigs, theme } = useNodeStore();
  const darkMode = theme === 'dark';
  const pixelStyle = theme === 'pixel';
  const selectedNodeId = selectedNodeIds[0] || null;
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('A');

  const [portName, setPortName] = useState('');
  const [portPosition, setPortPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const [portDataType, setPortDataType] = useState('string');

  const [editingPort, setEditingPort] = useState<{ nodeId: string; portId: string; port: Port } | null>(null);

  useEffect(() => {
    if (selectedNode) {
      setTitle(selectedNode.title);
      setDescription(selectedNode.description);
      setCategory(selectedNode.category);
    } else {
      setTitle('');
      setDescription('');
      setCategory('A');
    }
    setEditingPort(null);
  }, [selectedNodeId]);

  const handleDelete = () => {
    if (selectedNodeId && confirm('确定要删除这个节点吗？')) {
      deleteNode(selectedNodeId);
    }
  };

  const handleAddPort = () => {
    if (selectedNodeId && portName.trim()) {
      addPort(selectedNodeId, { 
        name: portName.trim(), 
        position: portPosition,
        dataType: portDataType as any 
      });
      setPortName('');
    }
  };

  const handleUpdatePort = () => {
    if (editingPort) {
      updatePort(editingPort.nodeId, editingPort.portId, {
        name: editingPort.port.name,
        position: editingPort.port.position,
        dataType: editingPort.port.dataType
      });
      setEditingPort(null);
    }
  };

  const handleDeletePort = (portId: string) => {
    if (selectedNodeId && confirm('确定要删除这个连接点吗？')) {
      deletePort(selectedNodeId, portId);
    }
  };

  const getPositionLabel = (position: string) => {
    return portPositions.find(p => p.value === position)?.label || position;
  };

  if (!selectedNode) {
    return (
      <div className={`p-4 text-center ${pixelStyle ? (darkMode ? 'text-gray-400' : 'text-gray-300') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
        <p>请选择一个节点进行编辑</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${pixelStyle ? (darkMode ? 'text-gray-100' : 'text-gray-200') : (darkMode ? 'text-gray-100' : 'text-gray-800')}`} style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '2px' : 'normal' }}>节点属性</h2>
        <button
          onClick={handleDelete}
          disabled={selectedNode.completed}
          className={`text-sm ${pixelStyle ? (darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-300 hover:text-red-200') : (darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700')} ${selectedNode.completed ? 'opacity-40 cursor-not-allowed hover:text-inherit' : ''}`}
          style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}
        >
          删除节点
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className={`block text-sm font-medium mb-1 ${pixelStyle ? (darkMode ? 'text-gray-300' : 'text-gray-300') : (darkMode ? 'text-gray-300' : 'text-gray-700')}`} style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}>标题</label>
          <input
            type="text"
            value={title}
            disabled={selectedNode.completed}
            onChange={(e) => {
              setTitle(e.target.value);
              if (selectedNodeId) {
                updateNode(selectedNodeId, { title: e.target.value.trim() });
              }
            }}
            className={`w-full px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${pixelStyle ? '' : 'rounded-lg'} ${pixelStyle ? (darkMode ? 'bg-gray-700 border-gray-500 text-gray-200' : 'bg-gray-600 border-gray-400 text-gray-200') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'border-gray-300')} ${selectedNode.completed ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ textTransform: pixelStyle ? 'uppercase' : 'none' }}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${pixelStyle ? (darkMode ? 'text-gray-300' : 'text-gray-300') : (darkMode ? 'text-gray-300' : 'text-gray-700')}`} style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}>描述</label>
          <textarea
            value={description}
            disabled={selectedNode.completed}
            onChange={(e) => {
              setDescription(e.target.value);
              if (selectedNodeId) {
                updateNode(selectedNodeId, { description: e.target.value.trim() });
              }
            }}
            className={`w-full px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${pixelStyle ? '' : 'rounded-lg'} ${pixelStyle ? (darkMode ? 'bg-gray-700 border-gray-500 text-gray-200' : 'bg-gray-600 border-gray-400 text-gray-200') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'border-gray-300')} ${selectedNode.completed ? 'opacity-50 cursor-not-allowed' : ''}`}
            rows={3}
            style={{ textTransform: pixelStyle ? 'uppercase' : 'none' }}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${pixelStyle ? (darkMode ? 'text-gray-300' : 'text-gray-300') : (darkMode ? 'text-gray-300' : 'text-gray-700')}`} style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}>分类</label>
          <div className="flex flex-wrap gap-2">
            {categoryConfigs.map((config) => (
              <button
                key={config.key}
                disabled={selectedNode.completed}
                onClick={() => {
                  setCategory(config.key);
                  if (selectedNodeId) {
                    updateNode(selectedNodeId, { category: config.key });
                  }
                }}
                className={`px-3 py-1.5 border-2 text-sm font-medium transition-all hover:scale-105 ${pixelStyle ? '' : 'rounded-lg'} ${category === config.key ? (pixelStyle ? 'border-white' : 'border-gray-800 dark:border-gray-200') : (pixelStyle ? 'border-gray-500' : 'border-gray-200 dark:border-gray-600')} ${selectedNode.completed ? 'opacity-40 cursor-not-allowed hover:scale-100' : ''}`}
                style={{ backgroundColor: config.color, color: '#FFFFFF', boxShadow: category === config.key ? (pixelStyle ? '2px 2px 0px rgba(0,0,0,0.3)' : `0 0 0 2px ${config.color}`) : undefined }}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="node-completed"
            checked={selectedNode.completed}
            onChange={(e) => {
              if (selectedNodeId) {
                updateNode(selectedNodeId, { completed: e.target.checked });
              }
            }}
            className="w-4 h-4 cursor-pointer"
          />
          <label
            htmlFor="node-completed"
            className={`text-sm font-medium cursor-pointer ${pixelStyle ? (darkMode ? 'text-gray-300' : 'text-gray-300') : (darkMode ? 'text-gray-300' : 'text-gray-700')}`}
            style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}
          >
            标记为已完成
          </label>
          {selectedNode.completed && (
            <span className={`text-xs ml-auto ${pixelStyle ? (darkMode ? 'text-yellow-400' : 'text-yellow-300') : (darkMode ? 'text-yellow-400' : 'text-yellow-600')}`} style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}>
              已锁定
            </span>
          )}
        </div>
      </div>

      <hr className={`${pixelStyle ? (darkMode ? 'border-gray-700' : 'border-gray-600') : (darkMode ? 'border-gray-700' : 'border-gray-200')}`} />

      <div className="space-y-3">
        <h3 className={`font-medium ${pixelStyle ? (darkMode ? 'text-gray-200' : 'text-gray-200') : (darkMode ? 'text-gray-100' : 'text-gray-800')}`} style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}>连接点</h3>
        
        <div className="space-y-2">
          {selectedNode.ports.map((port) => (
            <div key={port.id} className={`flex items-center gap-2 p-2 ${pixelStyle ? 'border-2' : 'rounded-lg'} ${pixelStyle ? (darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-700 border-gray-500') : (darkMode ? 'bg-gray-700' : 'bg-gray-50')}`} style={{ boxShadow: pixelStyle ? '2px 2px 0px rgba(0,0,0,0.3)' : undefined }}>
              {editingPort?.portId === port.id ? (
                <>
                  <input
                    type="text"
                    value={editingPort.port.name}
                    onChange={(e) => setEditingPort({ ...editingPort, port: { ...editingPort.port, name: e.target.value } })}
                    className={`flex-1 px-2 py-1 text-sm border ${pixelStyle ? '' : 'rounded'} ${pixelStyle ? (darkMode ? 'bg-gray-700 border-gray-500 text-gray-200' : 'bg-gray-600 border-gray-400 text-gray-200') : (darkMode ? 'bg-gray-600 border-gray-500 text-gray-100' : 'border-gray-300')}`}
                    style={{ textTransform: pixelStyle ? 'uppercase' : 'none' }}
                  />
                  <select
                    value={editingPort.port.position}
                    onChange={(e) => setEditingPort({ ...editingPort, port: { ...editingPort.port, position: e.target.value as any } })}
                    className={`px-2 py-1 text-sm border ${pixelStyle ? '' : 'rounded'} ${pixelStyle ? (darkMode ? 'bg-gray-700 border-gray-500 text-gray-200' : 'bg-gray-600 border-gray-400 text-gray-200') : (darkMode ? 'bg-gray-600 border-gray-500 text-gray-100' : 'border-gray-300')}`}
                  >
                    {portPositions.map((pos) => (
                      <option key={pos.value} value={pos.value}>{pos.label}</option>
                    ))}
                  </select>
                  <select
                    value={editingPort.port.dataType}
                    onChange={(e) => setEditingPort({ ...editingPort, port: { ...editingPort.port, dataType: e.target.value as any } })}
                    className={`px-2 py-1 text-sm border ${pixelStyle ? '' : 'rounded'} ${pixelStyle ? (darkMode ? 'bg-gray-700 border-gray-500 text-gray-200' : 'bg-gray-600 border-gray-400 text-gray-200') : (darkMode ? 'bg-gray-600 border-gray-500 text-gray-100' : 'border-gray-300')}`}
                  >
                    {dataTypes.map((dt) => (
                      <option key={dt.value} value={dt.value}>{pixelStyle ? dt.label.substring(0, 4) : dt.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleUpdatePort}
                    className={`${pixelStyle ? 'border-2' : ''} ${pixelStyle ? (darkMode ? 'text-green-400 border-gray-600 hover:bg-green-900/30' : 'text-green-400 border-gray-500 hover:bg-green-800/30') : (darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-500 hover:text-green-700')}`}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingPort(null)}
                    className={`${pixelStyle ? 'border-2' : ''} ${pixelStyle ? (darkMode ? 'text-gray-400 border-gray-600 hover:bg-gray-600' : 'text-gray-400 border-gray-500 hover:bg-gray-500') : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <span className={`flex-1 text-sm ${pixelStyle ? (darkMode ? 'text-gray-200' : 'text-gray-200') : (darkMode ? 'text-gray-200' : 'text-gray-700')}`} style={{ textTransform: pixelStyle ? 'uppercase' : 'none' }}>{port.name}</span>
                  <span className={`text-xs px-2 py-0.5 ${pixelStyle ? 'border-2' : 'rounded'} ${pixelStyle ? (darkMode ? 'bg-gray-700 text-gray-300 border-gray-500' : 'bg-gray-600 text-gray-300 border-gray-400') : (darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600')}`}>
                    {getPositionLabel(port.position)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 ${pixelStyle ? 'border-2' : 'rounded'} text-white`} style={{ backgroundColor: getDataTypeColor(port.dataType) }}>
                    {pixelStyle ? getDataTypeLabel(port.dataType).substring(0, 4) : getDataTypeLabel(port.dataType)}
                  </span>
                  <button
                    onClick={() => setEditingPort({ nodeId: selectedNodeId, portId: port.id, port })}
                    disabled={selectedNode.completed}
                    className={`${pixelStyle ? 'border-2' : ''} ${pixelStyle ? (darkMode ? 'text-blue-400 border-gray-600 hover:bg-blue-900/30' : 'text-blue-400 border-gray-500 hover:bg-blue-800/30') : (darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-700')} ${selectedNode.completed ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDeletePort(port.id)}
                    disabled={selectedNode.completed}
                    className={`${pixelStyle ? 'border-2' : ''} ${pixelStyle ? (darkMode ? 'text-red-400 border-gray-600 hover:bg-red-900/30' : 'text-red-400 border-gray-500 hover:bg-red-800/30') : (darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700')} ${selectedNode.completed ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={portName}
            disabled={selectedNode.completed}
            onChange={(e) => setPortName(e.target.value)}
            placeholder="连接点名称"
            className={`flex-1 px-2 py-1 text-sm border ${pixelStyle ? '' : 'rounded'} ${pixelStyle ? (darkMode ? 'bg-gray-700 border-gray-500 text-gray-200' : 'bg-gray-600 border-gray-400 text-gray-200') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'border-gray-300')} ${selectedNode.completed ? 'opacity-50 cursor-not-allowed' : ''}`}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPort()}
            style={{ textTransform: pixelStyle ? 'uppercase' : 'none' }}
          />
          <select
            value={portPosition}
            disabled={selectedNode.completed}
            onChange={(e) => setPortPosition(e.target.value as any)}
            className={`px-2 py-1 text-sm border ${pixelStyle ? '' : 'rounded'} ${pixelStyle ? (darkMode ? 'bg-gray-700 border-gray-500 text-gray-200' : 'bg-gray-600 border-gray-400 text-gray-200') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border-gray-300')} ${selectedNode.completed ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {portPositions.map((pos) => (
              <option key={pos.value} value={pos.value}>{pos.label}</option>
            ))}
          </select>
          <select
            value={portDataType}
            disabled={selectedNode.completed}
            onChange={(e) => setPortDataType(e.target.value)}
            className={`px-2 py-1 text-sm border ${pixelStyle ? '' : 'rounded'} ${pixelStyle ? (darkMode ? 'bg-gray-700 border-gray-500 text-gray-200' : 'bg-gray-600 border-gray-400 text-gray-200') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border-gray-300')} ${selectedNode.completed ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {dataTypes.map((dt) => (
              <option key={dt.value} value={dt.value}>{pixelStyle ? dt.label.substring(0, 4) : dt.label}</option>
            ))}
          </select>
          <button
            onClick={handleAddPort}
            disabled={selectedNode.completed}
            className={`px-3 py-1 text-sm text-white transition-colors ${pixelStyle ? 'border-2 bg-green-600 border-green-400 hover:bg-green-500' : 'bg-green-500 rounded hover:bg-green-600'} ${selectedNode.completed ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function getDataTypeColor(type: string): string {
  const colors: Record<string, string> = {
    string: '#F97316',
    number: '#3B82F6',
    boolean: '#10B981',
    object: '#8B5CF6',
    array: '#EC4899'
  };
  return colors[type] || '#6B7280';
}

function getDataTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    string: '字符串',
    number: '数字',
    boolean: '布尔',
    object: '对象',
    array: '数组'
  };
  return labels[type] || type;
}