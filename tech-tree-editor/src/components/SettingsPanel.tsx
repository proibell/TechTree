import { useState } from 'react';
import { useNodeStore } from '../store/nodeStore';

export default function SettingsPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { categoryConfigs, updateCategoryConfig, addCategoryConfig, deleteCategoryConfig, theme } = useNodeStore();
  const darkMode = theme === 'dark';
  const pixelStyle = theme === 'pixel';
  const [addingCategory, setAddingCategory] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#6B7280');

  return (
    <div
      className={`flex flex-col transition-all duration-300 border-r overflow-hidden ${pixelStyle ? (darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-800 border-gray-600') : (darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')} ${
        isCollapsed ? 'w-10' : 'w-64'
      }`}
      style={{ imageRendering: pixelStyle ? 'pixelated' : 'auto' }}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`h-10 flex items-center justify-center border-b transition-colors ${pixelStyle ? (darkMode ? 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-gray-100') : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700')}`}
        title={isCollapsed ? '展开设置' : '收起设置'}
      >
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${
            isCollapsed ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className={`text-lg font-semibold mb-4 ${pixelStyle ? (darkMode ? 'text-gray-100' : 'text-gray-200') : (darkMode ? 'text-gray-100' : 'text-gray-800')}`} style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '2px' : 'normal' }}>系统设置</h2>

          <div className="space-y-4">
            <div>
              <h3 className={`font-medium mb-2 ${pixelStyle ? (darkMode ? 'text-gray-300' : 'text-gray-300') : (darkMode ? 'text-gray-300' : 'text-gray-700')}`} style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}>分类配置</h3>
              <p className={`text-xs mb-3 ${pixelStyle ? (darkMode ? 'text-gray-500' : 'text-gray-400') : (darkMode ? 'text-gray-500' : 'text-gray-500')}`}>
                修改分类标签和颜色，所有同分类节点会同步更新
              </p>
              <div className="space-y-2">
                {categoryConfigs.map((config) => (
                  <div
                    key={config.key}
                    className={`flex items-center gap-2 p-2 ${pixelStyle ? 'border-2' : 'rounded-lg'} ${pixelStyle ? (darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-700 border-gray-500') : (darkMode ? (config.key === 'default' ? 'bg-gray-700' : 'bg-gray-700/50') : (config.key === 'default' ? 'bg-gray-100' : 'bg-gray-50'))}`}
                    style={{ boxShadow: pixelStyle ? '2px 2px 0px rgba(0,0,0,0.3)' : undefined }}
                  >
                    <div
                      className={`w-6 h-6 ${pixelStyle ? 'border-2' : 'rounded border'} flex-shrink-0 ${pixelStyle ? 'border-white' : (darkMode ? 'border-gray-600' : 'border-gray-300')}`}
                      style={{ backgroundColor: config.color }}
                    />
                    <input
                      type="text"
                      value={config.label}
                      onChange={(e) =>
                        updateCategoryConfig(config.key, { label: e.target.value })
                      }
                      className={`w-24 px-2 py-1 text-sm border ${pixelStyle ? '' : 'rounded'} ${pixelStyle ? (darkMode ? 'bg-gray-700 border-gray-500 text-gray-200' : 'bg-gray-600 border-gray-400 text-gray-200') : (darkMode ? 'bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400' : 'border-gray-300')}`}
                      placeholder="分类标签"
                      style={{ textTransform: pixelStyle ? 'uppercase' : 'none' }}
                    />
                    <input
                      type="color"
                      value={config.color}
                      onChange={(e) =>
                        updateCategoryConfig(config.key, { color: e.target.value })
                      }
                      className={`w-10 h-8 border ${pixelStyle ? '' : 'rounded'} cursor-pointer flex-shrink-0 ${pixelStyle ? 'border-gray-500' : (darkMode ? 'border-gray-600' : 'border-gray-300')}`}
                    />
                    {config.key !== 'default' && (
                      <button
                        onClick={() => deleteCategoryConfig(config.key)}
                        className={`w-8 h-8 flex items-center justify-center ${pixelStyle ? 'border-2' : 'rounded'} transition-colors ${pixelStyle ? (darkMode ? 'text-red-400 border-gray-600 hover:bg-red-900/30' : 'text-red-400 border-gray-500 hover:bg-red-800/30') : (darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50')}`}
                        title="删除分类"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap={pixelStyle ? 'square' : 'round'} strokeLinejoin={pixelStyle ? 'miter' : 'round'} strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                
                {addingCategory ? (
                  <div className={`flex items-center gap-2 p-2 border-2 ${pixelStyle ? '' : 'rounded-lg'} ${pixelStyle ? (darkMode ? 'bg-gray-800 border-blue-600' : 'bg-gray-700 border-blue-500') : (darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200')}`} style={{ boxShadow: pixelStyle ? '2px 2px 0px rgba(59, 130, 246, 0.3)' : undefined }}>
                    <div
                      className={`w-6 h-6 ${pixelStyle ? 'border-2' : 'rounded border'} flex-shrink-0 ${pixelStyle ? 'border-white' : (darkMode ? 'border-gray-600' : 'border-gray-300')}`}
                      style={{ backgroundColor: newColor }}
                    />
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className={`w-24 px-2 py-1 text-sm border ${pixelStyle ? '' : 'rounded'} ${pixelStyle ? (darkMode ? 'bg-gray-700 border-gray-500 text-gray-200' : 'bg-gray-600 border-gray-400 text-gray-200') : (darkMode ? 'bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400' : 'border-gray-300')}`}
                      placeholder="新分类标签"
                      autoFocus
                      style={{ textTransform: pixelStyle ? 'uppercase' : 'none' }}
                    />
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className={`w-10 h-8 border ${pixelStyle ? '' : 'rounded'} cursor-pointer flex-shrink-0 ${pixelStyle ? 'border-gray-500' : (darkMode ? 'border-gray-600' : 'border-gray-300')}`}
                    />
                    <button
                      onClick={() => {
                        if (newLabel.trim()) {
                          addCategoryConfig({ label: newLabel.trim(), color: newColor });
                          setNewLabel('');
                          setNewColor('#6B7280');
                          setAddingCategory(false);
                        }
                      }}
                      className={`w-8 h-8 flex items-center justify-center ${pixelStyle ? 'border-2' : 'rounded'} transition-colors ${pixelStyle ? (darkMode ? 'text-green-400 border-gray-600 hover:bg-green-900/30' : 'text-green-400 border-gray-500 hover:bg-green-800/30') : (darkMode ? 'text-green-400 hover:bg-green-900/30' : 'text-green-600 hover:bg-green-100')}`}
                      title="确认添加"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap={pixelStyle ? 'square' : 'round'} strokeLinejoin={pixelStyle ? 'miter' : 'round'} strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setAddingCategory(false);
                        setNewLabel('');
                        setNewColor('#6B7280');
                      }}
                      className={`w-8 h-8 flex items-center justify-center ${pixelStyle ? 'border-2' : 'rounded'} transition-colors ${pixelStyle ? (darkMode ? 'text-gray-400 border-gray-600 hover:bg-gray-600' : 'text-gray-400 border-gray-500 hover:bg-gray-500') : (darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-100')}`}
                      title="取消"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap={pixelStyle ? 'square' : 'round'} strokeLinejoin={pixelStyle ? 'miter' : 'round'} strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingCategory(true)}
                    className={`w-full flex items-center justify-center gap-2 py-2 border-2 ${pixelStyle ? 'border-dashed' : 'border-dashed rounded-lg'} transition-colors ${pixelStyle ? (darkMode ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400' : 'border-gray-500 text-gray-300 hover:border-blue-400 hover:text-blue-300') : (darkMode ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400' : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500')}`}
                    style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap={pixelStyle ? 'square' : 'round'} strokeLinejoin={pixelStyle ? 'miter' : 'round'} strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    添加分类
                  </button>
                )}
              </div>
            </div>

            <div className={`pt-4 border-t ${pixelStyle ? (darkMode ? 'border-gray-700' : 'border-gray-600') : (darkMode ? 'border-gray-700' : 'border-gray-200')}`}>
              <h3 className={`font-medium mb-2 ${pixelStyle ? (darkMode ? 'text-gray-300' : 'text-gray-300') : (darkMode ? 'text-gray-300' : 'text-gray-700')}`} style={{ textTransform: pixelStyle ? 'uppercase' : 'none', letterSpacing: pixelStyle ? '1px' : 'normal' }}>提示</h3>
              <ul className={`text-xs space-y-1 ${pixelStyle ? (darkMode ? 'text-gray-500' : 'text-gray-400') : (darkMode ? 'text-gray-500' : 'text-gray-500')}`}>
                <li>• 双击画布空白处添加节点</li>
                <li>• 选中节点后按 Delete 删除</li>
                <li>• 拖动连接点创建连接线</li>
                <li>• 点击连接线删除连接</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
