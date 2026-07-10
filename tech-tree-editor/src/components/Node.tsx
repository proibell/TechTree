import { NodeData, Port } from '../types/node';
import { useNodeStore } from '../store/nodeStore';

interface NodeProps {
  node: NodeData;
  canvasScale: number;
  isHighlighted?: boolean;
}

const dataTypeColors: Record<string, string> = {
  string: '#F97316',
  number: '#3B82F6',
  boolean: '#10B981',
  object: '#8B5CF6',
  array: '#EC4899'
};

const dataTypeLabels: Record<string, string> = {
  string: '字符串',
  number: '数字',
  boolean: '布尔',
  object: '对象',
  array: '数组'
};

const NODE_WIDTH = 200;
const NODE_HEIGHT = 120;

const PORT_POSITIONS: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];

export default function Node({ node, canvasScale, isHighlighted }: NodeProps) {
  const { selectNode, selectedNodeIds, startConnection, addingConnection, endConnection, addPort, getCategoryColor, getCategoryLabel, theme, updateNode, getRelatedNodeIds } = useNodeStore();
  const darkMode = theme === 'dark';
  const pixelStyle = theme === 'pixel';
  
  const nodeColor = getCategoryColor(node.category);
  const descendantCount = getRelatedNodeIds(node.id).length + 1;

  const isSelected = selectedNodeIds.includes(node.id);
  const isOriginatingConnection = addingConnection?.fromNodeId === node.id;

  const getPortAtPosition = (position: 'top' | 'bottom' | 'left' | 'right'): Port | undefined => {
    return node.ports.find(p => p.position === position);
  };

  const getPortColor = (position: 'top' | 'bottom' | 'left' | 'right') => {
    const port = getPortAtPosition(position);
    return port ? dataTypeColors[port.dataType] : '#6B7280';
  };

  const getPortName = (position: 'top' | 'bottom' | 'left' | 'right') => {
    const port = getPortAtPosition(position);
    return port ? port.name : position === 'top' ? '上方' : position === 'bottom' ? '下方' : position === 'left' ? '左方' : '右方';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.port')) return;
    e.stopPropagation();
    selectNode(node.id);

    // 已完成节点锁定，不可拖动
    if (node.completed) return;

    window.dispatchEvent(new CustomEvent('node-mousedown', {
      detail: {
        nodeId: node.id,
        clientX: e.clientX,
        clientY: e.clientY,
        nodeX: node.x,
        nodeY: node.y,
        scale: canvasScale
      },
      bubbles: true,
      cancelable: true
    }));
  };

  const handlePortMouseDown = (e: React.MouseEvent, position: 'top' | 'bottom' | 'left' | 'right') => {
    if (node.completed) return;
    e.stopPropagation();
    let port = getPortAtPosition(position);
    if (!port) {
      addPort(node.id, {
        name: getPortName(position),
        position: position,
        dataType: 'object'
      });
      const updatedNode = useNodeStore.getState().nodes.find(n => n.id === node.id);
      port = updatedNode?.ports.find(p => p.position === position);
    }
    if (port) {
      startConnection(node.id, port.id);
    }
  };

  const handleNodeMouseUp = (e: React.MouseEvent) => {
    if (node.completed) return;
    if (addingConnection && addingConnection.fromNodeId !== node.id) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let targetPosition: 'top' | 'bottom' | 'left' | 'right';

      const horizontalCenter = NODE_WIDTH / 2;
      const verticalCenter = NODE_HEIGHT / 2;

      const dx = Math.abs(mouseX - horizontalCenter);
      const dy = Math.abs(mouseY - verticalCenter);

      if (dy > dx) {
        targetPosition = mouseY < verticalCenter ? 'top' : 'bottom';
      } else {
        targetPosition = mouseX < horizontalCenter ? 'left' : 'right';
      }

      let targetPort = getPortAtPosition(targetPosition);
      if (!targetPort) {
        addPort(node.id, {
          name: getPortName(targetPosition),
          position: targetPosition,
          dataType: 'object'
        });
        const updatedNode = useNodeStore.getState().nodes.find(n => n.id === node.id);
        if (updatedNode?.ports.length > 0) {
          const newPort = updatedNode.ports.find(p => p.position === targetPosition);
          if (newPort) {
            endConnection(node.id, newPort.id);
          }
        }
      } else {
        endConnection(node.id, targetPort.id);
      }
    }
  };

  const getPortPosition = (position: 'top' | 'bottom' | 'left' | 'right') => {
    switch (position) {
      case 'top':
        return { left: '50%', top: '0', transform: 'translateX(-50%) translateY(-50%)' };
      case 'bottom':
        return { left: '50%', top: '100%', transform: 'translateX(-50%) translateY(50%)' };
      case 'left':
        return { left: '0', top: '50%', transform: 'translateX(-50%) translateY(-50%)' };
      case 'right':
        return { left: '100%', top: '50%', transform: 'translateX(50%) translateY(-50%)' };
    }
  };

  return (
    <div
      className={`node-wrapper absolute select-none ${node.completed ? 'cursor-default' : 'cursor-move'}`}
      style={{
        left: node.x,
        top: node.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        zIndex: isSelected ? 10 : 1,
        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
        opacity: node.completed ? 0.5 : 1,
        boxSizing: 'border-box'
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleNodeMouseUp}
    >
      <div
        className={`rounded-lg shadow-lg transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-400' : ''} ${isHighlighted ? 'ring-2' : ''}`}
        style={{ 
          border: `2px solid ${nodeColor}`, 
          height: '100%',
          width: '100%',
          backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
          boxShadow: isHighlighted ? `0 0 30px ${nodeColor}80, 0 0 60px ${nodeColor}40, 0 4px 6px -1px rgba(0, 0, 0, 0.3)` : '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          outline: isHighlighted ? `3px solid ${nodeColor}` : undefined,
          outlineOffset: '4px',
          boxSizing: 'border-box'
        }}
      >
        <div
          className="px-3 py-2 text-white font-semibold text-sm flex items-center justify-between gap-2"
          style={{ backgroundColor: nodeColor }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 flex items-center justify-center text-xs font-bold rounded"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              title={`下级节点数（含自身）: ${descendantCount}`}
            >
              {descendantCount}
            </span>
            <span className="flex-1 truncate">{node.title}</span>
          </div>
          <input
            type="checkbox"
            checked={node.completed}
            onChange={(e) => { e.stopPropagation(); updateNode(node.id, { completed: e.target.checked }); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-4 h-4 cursor-pointer flex-shrink-0"
            title={node.completed ? '标记为未完成' : '标记为已完成'}
          />
        </div>

        <div className="flex-1 flex flex-col" style={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', minHeight: '0' }}>
          {node.description && (
            <div className={`px-3 py-1 text-xs border-b ${darkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-100'}`}>
              {node.description}
            </div>
          )}

          <div className="flex-1 flex items-center justify-center">
            {node.ports.length === 0 && (
              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>无连接点</div>
            )}
          </div>
        </div>

        {isSelected && !node.completed && PORT_POSITIONS.map((position) => {
          const port = getPortAtPosition(position);
          const isOriginating = isOriginatingConnection && addingConnection?.fromPortId === port?.id;

          return (
            <div
              key={position}
              className={`port absolute cursor-crosshair transition-transform hover:scale-110 ${isOriginating ? 'opacity-50' : ''}`}
              style={{
                ...getPortPosition(position),
                zIndex: isSelected ? 11 : 2
              }}
              onMouseDown={(e) => handlePortMouseDown(e, position)}
              title={`${getPortName(position)} - ${port ? dataTypeLabels[port.dataType] : '未配置'}`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shadow-sm ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                style={{
                  borderColor: getPortColor(position)
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getPortColor(position) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}