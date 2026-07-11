import { useEffect, useRef, useState, useCallback } from 'react';
import { useNodeStore } from '../store/nodeStore';
import Node from './Node';
import PixelNode from './PixelNode';
import NodeForm from './NodeForm';
import SettingsPanel from './SettingsPanel';
import { exportData, importData } from '../utils/dataIO';

const NODE_WIDTH = 208;
const NODE_HEIGHT = 128;
const DRAG_THRESHOLD = 5;

const generateId = () => Math.random().toString(36).substr(2, 9);

interface DragState {
  nodeId: string;
  startX: number;
  startY: number;
  nodeStartX: number;
  nodeStartY: number;
  scale: number;
  hasStarted: boolean;
}

export default function NodeEditor() {
  const { nodes, connections, selectNode, selectNodes, selectedNodeIds, addNode, deleteNode, cancelConnection, addingConnection, connectionStyle, setConnectionStyle, moveNode, getRelatedNodeIds, theme, setTheme, copyNodes, pasteNodes, categoryConfigs } = useNodeStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [screenMousePos, setScreenMousePos] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  
  const darkMode = theme === 'dark';
  const pixelStyle = theme === 'pixel';
  
  const panRef = useRef({ startX: 0, startY: 0, offsetStartX: 0, offsetStartY: 0 });
  const dragRef = useRef<DragState | null>(null);
  const selectionRef = useRef({ startX: 0, startY: 0, started: false, endX: 0, endY: 0 });
  const didSelectRef = useRef(false);
  
  const scaleRef = useRef(canvasScale);
  const offsetRef = useRef(canvasOffset);
  
  useEffect(() => {
    scaleRef.current = canvasScale;
  }, [canvasScale]);
  
  useEffect(() => {
    offsetRef.current = canvasOffset;
  }, [canvasOffset]);

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.parentElement?.getBoundingClientRect();
        if (rect) {
          setCanvasSize({ width: rect.width, height: rect.height });
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleCloseStyleMenu = (e: MouseEvent) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(e.target as Node)) {
        setStyleMenuOpen(false);
      }
    };
    document.addEventListener('click', handleCloseStyleMenu);
    return () => document.removeEventListener('click', handleCloseStyleMenu);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (canvasRef.current && !canvasRef.current.contains(e.target as Node)) {
        if (panelRef.current && panelRef.current.contains(e.target as Node)) {
          return;
        }
        selectNode(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [selectNode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.length > 0 && !isInput) {
        e.preventDefault();
        selectedNodeIds.forEach(id => deleteNode(id));
      }
      
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' && selectedNodeIds.length > 0) {
          e.preventDefault();
          copyNodes(selectedNodeIds);
        }
        if (e.key === 'v') {
          e.preventDefault();
          pasteNodes();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, deleteNode, copyNodes, pasteNodes]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const scale = scaleRef.current;
      const offset = offsetRef.current;
      
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - offset.x) / scale;
        const y = (e.clientY - rect.top - offset.y) / scale;
        setMousePos({ x, y });
        setScreenMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }

      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        
        if (!dragRef.current.hasStarted) {
          if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
            dragRef.current.hasStarted = true;
          }
        }
        
        if (dragRef.current.hasStarted) {
          let newX = dragRef.current.nodeStartX + dx / dragRef.current.scale;
          let newY = dragRef.current.nodeStartY + dy / dragRef.current.scale;
          
          // 吸附检测
          const SNAP_THRESHOLD = 12;
          const allNodes = useNodeStore.getState().nodes;
          const draggedNode = allNodes.find(n => n.id === dragRef.current!.nodeId);
          
          if (draggedNode) {
            for (const other of allNodes) {
              if (other.id === dragRef.current.nodeId) continue;
              
              const otherCenterX = other.x + NODE_WIDTH / 2;
              const otherCenterY = other.y + NODE_HEIGHT / 2;
              const dragCenterX = newX + NODE_WIDTH / 2;
              const dragCenterY = newY + NODE_HEIGHT / 2;
              
              // 水平居中对齐（Y轴吸附）
              if (Math.abs(dragCenterY - otherCenterY) < SNAP_THRESHOLD) {
                newY = other.y;
              }
              // 垂直居中对齐（X轴吸附）
              if (Math.abs(dragCenterX - otherCenterX) < SNAP_THRESHOLD) {
                newX = other.x;
              }
              
              // 左边缘对齐
              if (Math.abs(newX - other.x) < SNAP_THRESHOLD) {
                newX = other.x;
              }
              // 右边缘对齐
              if (Math.abs((newX + NODE_WIDTH) - (other.x + NODE_WIDTH)) < SNAP_THRESHOLD) {
                newX = other.x;
              }
              // 上边缘对齐
              if (Math.abs(newY - other.y) < SNAP_THRESHOLD) {
                newY = other.y;
              }
              // 下边缘对齐
              if (Math.abs((newY + NODE_HEIGHT) - (other.y + NODE_HEIGHT)) < SNAP_THRESHOLD) {
                newY = other.y;
              }
              
              // 节点间紧贴吸附（水平方向）
              if (Math.abs((newX + NODE_WIDTH) - other.x) < SNAP_THRESHOLD && Math.abs(dragCenterY - otherCenterY) < NODE_HEIGHT) {
                newX = other.x - NODE_WIDTH;
              }
              if (Math.abs(newX - (other.x + NODE_WIDTH)) < SNAP_THRESHOLD && Math.abs(dragCenterY - otherCenterY) < NODE_HEIGHT) {
                newX = other.x + NODE_WIDTH;
              }
              // 节点间紧贴吸附（垂直方向）
              if (Math.abs((newY + NODE_HEIGHT) - other.y) < SNAP_THRESHOLD && Math.abs(dragCenterX - otherCenterX) < NODE_WIDTH) {
                newY = other.y - NODE_HEIGHT;
              }
              if (Math.abs(newY - (other.y + NODE_HEIGHT)) < SNAP_THRESHOLD && Math.abs(dragCenterX - otherCenterX) < NODE_WIDTH) {
                newY = other.y + NODE_HEIGHT;
              }
            }
          }
          
          moveNode(dragRef.current.nodeId, newX, newY);
        }
      }

      if (isPanning) {
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        setCanvasOffset({
          x: panRef.current.offsetStartX + dx,
          y: panRef.current.offsetStartY + dy
        });
      }

      const selection = selectionRef.current;
      if (!dragRef.current && !isPanning && selection.startX !== 0) {
        const dx = e.clientX - selection.startX;
        const dy = e.clientY - selection.startY;
        
        if (!selection.started) {
          if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
            selection.started = true;
            setIsSelecting(true);
          }
        }
        
        if (selection.started) {
          const startX = selection.startX;
          const startY = selection.startY;
          const endX = e.clientX;
          const endY = e.clientY;
          
          selection.endX = endX;
          selection.endY = endY;
          
          if (endX >= startX && endY >= startY) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
              setSelectionBox({
                x: startX - rect.left,
                y: startY - rect.top,
                width: endX - startX,
                height: endY - startY
              });
            }
          }
        }
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      setIsPanning(false);
      
      const selection = selectionRef.current;
      if (selection.started && selection.startX !== 0) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const boxLeft = Math.min(selection.startX, selection.endX);
          const boxTop = Math.min(selection.startY, selection.endY);
          const boxRight = Math.max(selection.startX, selection.endX);
          const boxBottom = Math.max(selection.startY, selection.endY);
          
          const scale = scaleRef.current;
          const offset = offsetRef.current;
          
          const selected = useNodeStore.getState().nodes.filter(node => {
            const nodeLeft = rect.left + offset.x + node.x * scale;
            const nodeTop = rect.top + offset.y + node.y * scale;
            const nodeRight = nodeLeft + NODE_WIDTH * scale;
            const nodeBottom = nodeTop + NODE_HEIGHT * scale;
            
            return nodeLeft < boxRight && nodeRight > boxLeft &&
                   nodeTop < boxBottom && nodeBottom > boxTop;
          }).map(node => node.id);
          
          if (selected.length > 0) {
            selectNodes(selected);
            didSelectRef.current = true;
          }
        }
      }
      
      setIsSelecting(false);
      setSelectionBox({ x: 0, y: 0, width: 0, height: 0 });
      selectionRef.current = { startX: 0, startY: 0, started: false, endX: 0, endY: 0 };
    };

    const handleMouseLeave = () => {
      dragRef.current = null;
      setIsPanning(false);
      setIsSelecting(false);
      setSelectionBox({ x: 0, y: 0, width: 0, height: 0 });
      selectionRef.current = { startX: 0, startY: 0, started: false, endX: 0, endY: 0 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isPanning, moveNode]);

  useEffect(() => {
    const handleNodeMouseDown = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      dragRef.current = {
        nodeId: detail.nodeId,
        startX: detail.clientX,
        startY: detail.clientY,
        nodeStartX: detail.nodeX,
        nodeStartY: detail.nodeY,
        scale: detail.scale,
        hasStarted: false
      };
    };

    window.addEventListener('node-mousedown', handleNodeMouseDown);
    return () => window.removeEventListener('node-mousedown', handleNodeMouseDown);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(3, canvasScale * delta));

    const worldX = (mouseX - canvasOffset.x) / canvasScale;
    const worldY = (mouseY - canvasOffset.y) / canvasScale;

    const newOffsetX = mouseX - worldX * newScale;
    const newOffsetY = mouseY - worldY * newScale;

    setCanvasScale(newScale);
    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
  }, [canvasScale, canvasOffset]);

  const handleAddNode = () => {
    const categories: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    addNode({
      title: '新节点',
      description: '',
      x: (canvasSize.width / 2 - 100 - canvasOffset.x) / canvasScale,
      y: (canvasSize.height / 2 - 60 - canvasOffset.y) / canvasScale,
      category: randomCategory,
      completed: false,
      ports: []
    });
  };

  const getPortPosition = (nodeId: string, portId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0, position: 'top' };

    const port = node.ports.find(p => p.id === portId);
    if (!port) return { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEIGHT / 2, position: 'top' };

    let x = node.x;
    let y = node.y;

    switch (port.position) {
      case 'top':
        x += NODE_WIDTH / 2;
        y += 0;
        break;
      case 'bottom':
        x += NODE_WIDTH / 2;
        y += NODE_HEIGHT;
        break;
      case 'left':
        x += 0;
        y += NODE_HEIGHT / 2;
        break;
      case 'right':
        x += NODE_WIDTH;
        y += NODE_HEIGHT / 2;
        break;
    }

    return { x, y, position: port.position };
  };

  const getConnectionPath = (fromPos: { x: number; y: number; position?: string }, toPos: { x: number; y: number; position?: string }, style: 'straight' | 'orthogonal' | 'bezier' = 'orthogonal') => {
    const fromPosition = fromPos.position || 'bottom';
    const toPosition = toPos.position || 'top';

    if (style === 'straight') {
      return `M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`;
    }

    if (style === 'bezier') {
      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const controlOffset = Math.max(60, distance * 0.4);

      let cp1x = fromPos.x;
      let cp1y = fromPos.y;
      let cp2x = toPos.x;
      let cp2y = toPos.y;

      switch (fromPosition) {
        case 'top':
          cp1x = fromPos.x;
          cp1y = fromPos.y - controlOffset;
          break;
        case 'bottom':
          cp1x = fromPos.x;
          cp1y = fromPos.y + controlOffset;
          break;
        case 'left':
          cp1x = fromPos.x - controlOffset;
          cp1y = fromPos.y;
          break;
        case 'right':
          cp1x = fromPos.x + controlOffset;
          cp1y = fromPos.y;
          break;
      }

      switch (toPosition) {
        case 'top':
          cp2x = toPos.x;
          cp2y = toPos.y - controlOffset;
          break;
        case 'bottom':
          cp2x = toPos.x;
          cp2y = toPos.y + controlOffset;
          break;
        case 'left':
          cp2x = toPos.x - controlOffset;
          cp2y = toPos.y;
          break;
        case 'right':
          cp2x = toPos.x + controlOffset;
          cp2y = toPos.y;
          break;
      }

      return `M ${fromPos.x} ${fromPos.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toPos.x} ${toPos.y}`;
    }

    if ((fromPosition === 'bottom' && toPosition === 'top') ||
        (fromPosition === 'top' && toPosition === 'bottom')) {
      const midY = (fromPos.y + toPos.y) / 2;
      return `M ${fromPos.x} ${fromPos.y} L ${fromPos.x} ${midY} L ${toPos.x} ${midY} L ${toPos.x} ${toPos.y}`;
    }

    if ((fromPosition === 'right' && toPosition === 'left') ||
        (fromPosition === 'left' && toPosition === 'right')) {
      const midX = (fromPos.x + toPos.x) / 2;
      return `M ${fromPos.x} ${fromPos.y} L ${midX} ${fromPos.y} L ${midX} ${toPos.y} L ${toPos.x} ${toPos.y}`;
    }

    const dx = Math.abs(toPos.x - fromPos.x);
    const dy = Math.abs(toPos.y - fromPos.y);

    if (dx > dy) {
      const midX = (fromPos.x + toPos.x) / 2;
      return `M ${fromPos.x} ${fromPos.y} L ${midX} ${fromPos.y} L ${midX} ${toPos.y} L ${toPos.x} ${toPos.y}`;
    } else {
      const midY = (fromPos.y + toPos.y) / 2;
      return `M ${fromPos.x} ${fromPos.y} L ${fromPos.x} ${midY} L ${toPos.x} ${midY} L ${toPos.x} ${toPos.y}`;
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.node-wrapper')) {
      if (addingConnection) {
        cancelConnection();
      } else if (!didSelectRef.current) {
        selectNode(null);
      }
      didSelectRef.current = false;
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.node-wrapper')) {
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const worldX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
      const worldY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;

      const categories: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];

      addNode({
        title: '新节点',
        description: '双击编辑',
        x: Math.round(worldX),
        y: Math.round(worldY),
        category: randomCategory,
        completed: false,
        ports: [
          { id: generateId(), name: 'top', position: 'top', dataType: 'object' },
          { id: generateId(), name: 'bottom', position: 'bottom', dataType: 'object' },
          { id: generateId(), name: 'left', position: 'left', dataType: 'object' },
          { id: generateId(), name: 'right', position: 'right', dataType: 'object' }
        ]
      });

      selectNode(null);
    }
  };

  const handleResetView = () => {
    setCanvasOffset({ x: 0, y: 0 });
    setCanvasScale(1);
  };

  return (
    <div className={`flex h-screen ${pixelStyle ? (darkMode ? 'bg-gray-950' : 'bg-gray-900') : (darkMode ? 'bg-gray-900' : 'bg-gray-100')}`}>
      <SettingsPanel />
      <div className="flex-1 flex flex-col">
        <header className={`border-b px-4 py-3 flex items-center justify-between ${pixelStyle ? (darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-800 border-gray-600') : (darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}`} style={{ imageRendering: pixelStyle ? 'pixelated' : 'auto' }}>
          <div className="flex items-center gap-4">
            <h1 className={`text-xl font-bold ${pixelStyle ? (darkMode ? 'text-gray-100' : 'text-gray-200') : (darkMode ? 'text-gray-100' : 'text-gray-800')}`} style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '2px' : 'normal' }}>节点编辑器</h1>
            <div className={`text-sm ${pixelStyle ? (darkMode ? 'text-gray-400' : 'text-gray-300') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
              {nodes.length} 个节点 | {connections.length} 条连接
            </div>
            <div className={`text-sm ${pixelStyle ? (darkMode ? 'text-gray-500' : 'text-gray-400') : (darkMode ? 'text-gray-500' : 'text-gray-400')}`}>
              缩放: {Math.round(canvasScale * 100)}%
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 ${pixelStyle ? (darkMode ? 'bg-gray-800' : 'bg-gray-700') : (darkMode ? 'bg-gray-700' : 'bg-gray-100')} ${pixelStyle ? '' : 'rounded-lg'} p-1`}>
              <button
                onClick={() => setConnectionStyle('bezier')}
                className={`px-3 py-1 text-sm transition-colors ${pixelStyle ? '' : 'rounded-md'} ${connectionStyle === 'bezier' ? `${pixelStyle ? (darkMode ? 'bg-gray-600 text-blue-400 border-2 border-blue-500' : 'bg-gray-500 text-blue-300 border-2 border-blue-400') : (darkMode ? 'bg-gray-600 text-blue-400' : 'bg-white shadow-sm text-blue-600')}` : `${pixelStyle ? (darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-300 hover:text-gray-100 hover:bg-gray-600') : (darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800')}`}`}
                title="贝塞尔曲线连接"
                style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}
              >
                曲线
              </button>
              <button
                onClick={() => setConnectionStyle('straight')}
                className={`px-3 py-1 text-sm transition-colors ${pixelStyle ? '' : 'rounded-md'} ${connectionStyle === 'straight' ? `${pixelStyle ? (darkMode ? 'bg-gray-600 text-blue-400 border-2 border-blue-500' : 'bg-gray-500 text-blue-300 border-2 border-blue-400') : (darkMode ? 'bg-gray-600 text-blue-400' : 'bg-white shadow-sm text-blue-600')}` : `${pixelStyle ? (darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-300 hover:text-gray-100 hover:bg-gray-600') : (darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800')}`}`}
                title="直线连接"
                style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}
              >
                直线
              </button>
              <button
                onClick={() => setConnectionStyle('orthogonal')}
                className={`px-3 py-1 text-sm transition-colors ${pixelStyle ? '' : 'rounded-md'} ${connectionStyle === 'orthogonal' ? `${pixelStyle ? (darkMode ? 'bg-gray-600 text-blue-400 border-2 border-blue-500' : 'bg-gray-500 text-blue-300 border-2 border-blue-400') : (darkMode ? 'bg-gray-600 text-blue-400' : 'bg-white shadow-sm text-blue-600')}` : `${pixelStyle ? (darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-300 hover:text-gray-100 hover:bg-gray-600') : (darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800')}`}`}
                title="折线连接"
                style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}
              >
                折线
              </button>
            </div>
            <button
              onClick={handleResetView}
              className={`px-3 py-1.5 transition-colors text-sm ${pixelStyle ? 'border-2' : 'rounded-lg'} ${pixelStyle ? (darkMode ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700' : 'bg-gray-700 text-gray-200 border-gray-500 hover:bg-gray-600') : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}`}
              style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}
            >
              重置视图
            </button>
            <div ref={styleMenuRef} className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setStyleMenuOpen(!styleMenuOpen); }}
                className={`px-3 py-1.5 transition-colors text-sm flex items-center gap-1 ${pixelStyle ? 'border-2' : 'rounded-lg'} ${pixelStyle ? 'bg-gray-700 text-gray-200 border-gray-500 hover:bg-gray-600' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}`}
                title="界面风格"
              >
                <span>{theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🎮'}</span>
                <span className="hidden sm:inline">{theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '像素'}</span>
                <svg className={`w-3 h-3 transition-transform ${styleMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {styleMenuOpen && (
                <div className={`absolute right-0 top-full mt-1 min-w-[120px] py-1 border shadow-lg z-50 ${pixelStyle ? 'border-2 bg-gray-700 border-gray-500' : (darkMode ? 'rounded-lg bg-gray-800 border-gray-700' : 'rounded-lg bg-white border-gray-200')}`}>
                  {(['light', 'dark', 'pixel'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={(e) => { e.stopPropagation(); setTheme(t); setStyleMenuOpen(false); }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${theme === t ? (darkMode || pixelStyle ? 'text-blue-400' : 'text-blue-600') : (darkMode || pixelStyle ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')}`}
                    >
                      <span>{t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '🎮'}</span>
                      <span>{t === 'light' ? '浅色' : t === 'dark' ? '深色' : '像素'}</span>
                      {theme === t && (
                        <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleAddNode}
              className={`px-4 py-2 text-white transition-colors flex items-center gap-2 ${pixelStyle ? 'border-2' : 'rounded-lg'} ${pixelStyle ? 'bg-blue-600 border-blue-400 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'}`}
              style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}
            >
              <span>+</span> 添加节点
            </button>
            <button
              onClick={() => exportData(nodes, connections, categoryConfigs, connectionStyle)}
              className={`px-3 py-2 text-sm transition-colors flex items-center gap-1 ${pixelStyle ? 'border-2' : 'rounded-lg'} ${pixelStyle ? (darkMode ? 'bg-gray-800 text-green-400 border-gray-600 hover:bg-gray-700' : 'bg-gray-700 text-green-300 border-gray-500 hover:bg-gray-600') : (darkMode ? 'bg-gray-700 text-green-400 hover:bg-gray-600' : 'bg-gray-100 text-green-600 hover:bg-gray-200')}`}
              title="导出数据"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span className="hidden sm:inline">导出</span>
            </button>
            <button
              onClick={() => importData()}
              className={`px-3 py-2 text-sm transition-colors flex items-center gap-1 ${pixelStyle ? 'border-2' : 'rounded-lg'} ${pixelStyle ? (darkMode ? 'bg-gray-800 text-orange-400 border-gray-600 hover:bg-gray-700' : 'bg-gray-700 text-orange-300 border-gray-500 hover:bg-gray-600') : (darkMode ? 'bg-gray-700 text-orange-400 hover:bg-gray-600' : 'bg-gray-100 text-orange-600 hover:bg-gray-200')}`}
              title="导入数据"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <span className="hidden sm:inline">导入</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          <div
            ref={canvasRef}
            className={`w-full h-full relative cursor-crosshair ${isPanning ? 'cursor-grabbing' : ''}`}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
            onWheel={handleWheel}
            onMouseDown={(e) => {
              if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
                e.preventDefault();
                setIsPanning(true);
                panRef.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  offsetStartX: canvasOffset.x,
                  offsetStartY: canvasOffset.y
                };
              } else if (e.button === 0) {
                const target = e.target as HTMLElement;
                if (!target.closest('.node-wrapper')) {
                  selectionRef.current = {
                    startX: e.clientX,
                    startY: e.clientY,
                    started: false,
                    endX: 0,
                    endY: 0
                  };
                }
              }
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: pixelStyle 
                  ? (darkMode ? '#1a1a2e' : '#2d2d2d') 
                  : (darkMode ? '#111827' : '#F3F4F6'),
                backgroundImage: pixelStyle
                  ? `
                      linear-gradient(to right, ${darkMode ? '#16213e' : '#3d3d3d'} 1px, transparent 1px),
                      linear-gradient(to bottom, ${darkMode ? '#16213e' : '#3d3d3d'} 1px, transparent 1px)
                    `
                  : `
                      linear-gradient(to right, ${darkMode ? '#374151' : '#e5e7eb'} 1px, transparent 1px),
                      linear-gradient(to bottom, ${darkMode ? '#374151' : '#e5e7eb'} 1px, transparent 1px)
                    `,
                backgroundSize: pixelStyle 
                  ? `${32 * canvasScale}px ${32 * canvasScale}px` 
                  : `${20 * canvasScale}px ${20 * canvasScale}px`,
                backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
                imageRendering: pixelStyle ? 'pixelated' : 'auto'
              }}
            />

            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
                transformOrigin: '0 0',
                zIndex: 3
              }}
            >
              {nodes.map((node) => {
                const relatedNodeIds = new Set<string>();
                selectedNodeIds.forEach(id => {
                  getRelatedNodeIds(id).forEach(relatedId => relatedNodeIds.add(relatedId));
                });
                const isHighlighted = relatedNodeIds.has(node.id) || selectedNodeIds.includes(node.id);
                const NodeComponent = pixelStyle ? PixelNode : Node;
                return (
                  <NodeComponent
                    key={node.id}
                    node={node}
                    canvasScale={canvasScale}
                    isHighlighted={isHighlighted}
                  />
                );
              })}
            </div>

            {isSelecting && selectionBox.width > 0 && selectionBox.height > 0 && (
              <div
                className={`absolute pointer-events-none ${pixelStyle ? 'border-4' : 'border-2'} ${pixelStyle ? 'border-blue-500 bg-blue-500/20' : 'border-blue-500 bg-blue-500/10'}`}
                style={{
                  left: selectionBox.x,
                  top: selectionBox.y,
                  width: selectionBox.width,
                  height: selectionBox.height,
                  zIndex: 4,
                  boxShadow: pixelStyle ? '4px 4px 0px rgba(59, 130, 246, 0.3)' : undefined
                }}
              />
            )}

            <svg className="absolute inset-0" style={{ width: canvasSize.width, height: canvasSize.height, zIndex: 2, overflow: 'visible', pointerEvents: 'none', transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`, transformOrigin: '0 0', imageRendering: pixelStyle ? 'pixelated' : 'auto' }}>
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill={pixelStyle ? '#888888' : '#6B7280'} />
                </marker>
                <marker
                  id="pixelArrowhead"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 0, 8 4, 0 8" fill="#555555" />
                </marker>
              </defs>

              {connections.map((conn) => {
                const fromPos = getPortPosition(conn.fromNodeId, conn.fromPortId);
                const toPos = getPortPosition(conn.toNodeId, conn.toPortId);
                const path = getConnectionPath(fromPos, toPos, conn.style || connectionStyle);
                
                return (
                  <path
                    key={conn.id}
                    d={path}
                    stroke={pixelStyle ? '#555555' : '#6B7280'}
                    strokeWidth={pixelStyle ? 3 : 2}
                    fill="none"
                    markerEnd={pixelStyle ? 'url(#pixelArrowhead)' : 'url(#arrowhead)'}
                    strokeLinecap={pixelStyle ? 'square' : 'round'}
                    strokeLinejoin={pixelStyle ? 'miter' : 'round'}
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    onClick={() => useNodeStore.getState().deleteConnection(conn.id)}
                  />
                );
              })}
            </svg>

            <svg className="absolute inset-0" style={{ width: canvasSize.width, height: canvasSize.height, zIndex: 3, overflow: 'visible', pointerEvents: 'none', imageRendering: pixelStyle ? 'pixelated' : 'auto' }}>
              {addingConnection && (
                <path
                  d={`M ${getPortPosition(addingConnection.fromNodeId, addingConnection.fromPortId).x * canvasScale + canvasOffset.x} ${getPortPosition(addingConnection.fromNodeId, addingConnection.fromPortId).y * canvasScale + canvasOffset.y} L ${screenMousePos.x} ${screenMousePos.y}`}
                  stroke={pixelStyle ? '#4A90D9' : '#3B82F6'}
                  strokeWidth={pixelStyle ? 3 : 2}
                  strokeDasharray={pixelStyle ? '4,4' : '5,5'}
                  fill="none"
                  strokeLinecap={pixelStyle ? 'square' : 'round'}
                />
              )}
            </svg>

            <div className={`absolute bottom-4 right-4 text-xs px-2 py-1 rounded shadow ${darkMode ? 'text-gray-400 bg-gray-800' : 'text-gray-400 bg-white'}`} style={{ zIndex: 1 }}>
              滚轮缩放 | Shift+拖拽平移 | 鼠标中键平移 | 点击选中节点 | 拖动连接点创建连接
            </div>
          </div>
        </div>
      </div>

      <aside ref={panelRef} className={`w-80 border-l overflow-y-auto ${pixelStyle ? (darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-800 border-gray-600') : (darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}`}>
        <NodeForm />
      </aside>
    </div>
  );
}