import { NodeData, Port } from '../types/node';
import { useNodeStore } from '../store/nodeStore';

interface PixelNodeProps {
  node: NodeData;
  canvasScale: number;
  isHighlighted?: boolean;
}

const dataTypeColors: Record<string, string> = {
  string: '#FF6B00',
  number: '#00BFFF',
  boolean: '#39FF14',
  object: '#FF00FF',
  array: '#FFFF00'
};

const dataTypeLabels: Record<string, string> = {
  string: 'STR',
  number: 'NUM',
  boolean: 'BLN',
  object: 'OBJ',
  array: 'ARR'
};

const NODE_WIDTH = 208;
const NODE_HEIGHT = 128;

const PORT_POSITIONS: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];

const pixelNumbers = {
  0: [
    [1,1,1],
    [1,0,1],
    [1,0,1],
    [1,0,1],
    [1,1,1]
  ],
  1: [
    [0,0,1],
    [0,0,1],
    [0,0,1],
    [0,0,1],
    [0,0,1]
  ],
  2: [
    [1,1,1],
    [0,0,1],
    [1,1,1],
    [1,0,0],
    [1,1,1]
  ],
  3: [
    [1,1,1],
    [0,0,1],
    [1,1,1],
    [0,0,1],
    [1,1,1]
  ],
  4: [
    [1,0,1],
    [1,0,1],
    [1,1,1],
    [0,0,1],
    [0,0,1]
  ],
  5: [
    [1,1,1],
    [1,0,0],
    [1,1,1],
    [0,0,1],
    [1,1,1]
  ],
  6: [
    [1,1,1],
    [1,0,0],
    [1,1,1],
    [1,0,1],
    [1,1,1]
  ],
  7: [
    [1,1,1],
    [0,0,1],
    [0,0,1],
    [0,0,1],
    [0,0,1]
  ],
  8: [
    [1,1,1],
    [1,0,1],
    [1,1,1],
    [1,0,1],
    [1,1,1]
  ],
  9: [
    [1,1,1],
    [1,0,1],
    [1,1,1],
    [0,0,1],
    [1,1,1]
  ]
};

const PixelDigit = ({ num }: { num: number }) => {
  const pattern = pixelNumbers[num] || pixelNumbers[0];

  return (
    <div className="relative w-6 h-8 bg-black border-2 border-gray-600" style={{ imageRendering: 'pixelated' }}>
      {pattern.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-0.5">
          {row.map((cell, colIndex) => (
            <div
              key={colIndex}
              className="w-1.5 h-1.5"
              style={{
                backgroundColor: cell ? '#FF3300' : 'transparent',
                boxShadow: cell ? '0 0 3px #FF3300' : 'none'
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default function PixelNode({ node, canvasScale, isHighlighted }: PixelNodeProps) {
  const { selectNode, selectedNodeIds, startConnection, addingConnection, endConnection, addPort, getCategoryColor, getCategoryLabel, theme, updateNode, getRelatedNodeIds } = useNodeStore();
  const darkMode = theme === 'dark';
  
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
    return port ? port.name : position === 'top' ? 'UP' : position === 'bottom' ? 'DN' : position === 'left' ? 'LT' : 'RT';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.pixel-port')) return;
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
        return { left: '50%', top: '-6px', transform: 'translateX(-50%) translateY(-50%)' };
      case 'bottom':
        return { left: '50%', top: '100%', transform: 'translateX(-50%) translateY(50%)' };
      case 'left':
        return { left: '-6px', top: '50%', transform: 'translateX(-50%) translateY(-50%)' };
      case 'right':
        return { left: '100%', top: '50%', transform: 'translateX(50%) translateY(-50%)' };
    }
  };

  const PixelCheckbox = ({ checked, onChange, onMouseDown }: { checked: boolean; onChange: () => void; onMouseDown: () => void }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(); }}
      className="w-5 h-5 border-2 border-white relative"
      style={{
        backgroundColor: checked ? '#39FF14' : 'transparent',
        boxShadow: '2px 2px 0px rgba(0,0,0,0.5)',
        imageRendering: 'pixelated'
      }}
    >
      {checked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-black" />
        </div>
      )}
    </button>
  );

  return (
    <div
      className={`node-wrapper absolute select-none ${node.completed ? 'cursor-default' : 'cursor-move'}`}
      style={{
        left: node.x,
        top: node.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        zIndex: isSelected ? 10 : 1,
        imageRendering: 'pixelated',
        opacity: node.completed ? 0.5 : 1
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleNodeMouseUp}
    >
      <div
        className="transition-all duration-150"
        style={{ 
          border: `4px solid ${nodeColor}`, 
          height: '100%',
          width: '100%',
          backgroundColor: darkMode ? '#0a0a1a' : '#f8f8f8',
          boxShadow: isSelected 
            ? `4px 4px 0px #000000, 8px 8px 0px ${nodeColor}, 12px 12px 0px rgba(0,0,0,0.3)` 
            : '4px 4px 0px rgba(0,0,0,0.3)',
          position: 'relative',
          outline: isHighlighted ? `4px solid #FFFF00` : undefined,
          outlineOffset: '4px'
        }}
      >
        <div
          className="px-4 py-3 font-bold text-xs flex items-center justify-between gap-3"
          style={{
            backgroundColor: nodeColor,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            borderBottom: '4px solid',
            borderBottomColor: '#000000',
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            fontSize: '10px'
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="relative"
              title={`下级节点数（含自身）: ${descendantCount}`}
            >
              <PixelDigit num={descendantCount} />
            </div>
            <span className="flex-1 truncate">{node.title.length > 8 ? node.title.substring(0, 8) + '..' : node.title}</span>
          </div>
          <PixelCheckbox
            checked={node.completed}
            onChange={() => updateNode(node.id, { completed: !node.completed })}
            onMouseDown={() => {}}
          />
        </div>

        <div className="flex-1 flex flex-col p-2" style={{ backgroundColor: darkMode ? '#0a0a1a' : '#f8f8f8', minHeight: '0' }}>
          {node.description && (
            <div className={`px-2 py-1 text-xs border-b ${darkMode ? 'text-gray-400 border-gray-600' : 'text-gray-500 border-gray-300'}`} style={{ fontFamily: '"Courier New", monospace' }}>
              {node.description.length > 18 ? node.description.substring(0, 18) + '..' : node.description}
            </div>
          )}

          <div className="flex-1 flex items-center justify-center">
            {node.ports.length === 0 && (
              <div className={`text-xs font-mono ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} style={{ fontFamily: '"Courier New", monospace' }}>NO PORTS</div>
            )}
          </div>
        </div>

        {isSelected && !node.completed && PORT_POSITIONS.map((position) => {
          const port = getPortAtPosition(position);
          const isOriginating = isOriginatingConnection && addingConnection?.fromPortId === port?.id;

          return (
            <div
              key={position}
              className={`pixel-port absolute cursor-crosshair ${isOriginating ? 'opacity-50' : ''}`}
              style={{
                ...getPortPosition(position),
                zIndex: isSelected ? 11 : 2,
                imageRendering: 'pixelated'
              }}
              onMouseDown={(e) => handlePortMouseDown(e, position)}
              title={`${getPortName(position)} - ${port ? dataTypeLabels[port.dataType] : 'UNK'}`}
            >
              <div
                className="w-6 h-6"
                style={{
                  backgroundColor: getPortColor(position),
                  border: '2px solid #ffffff',
                  boxShadow: '3px 3px 0px rgba(0,0,0,0.5)'
                }}
              />
            </div>
          );
        })}

        <div className="absolute top-0 left-0 w-2 h-2 bg-black" />
        <div className="absolute top-0 right-0 w-2 h-2 bg-black" />
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-black" />
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-black" />
      </div>
    </div>
  );
}