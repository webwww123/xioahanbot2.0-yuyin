'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface PermissionGuideProps {
  isVisible: boolean
  onClose: () => void
}

// 检查权限状态
const checkPermissionStatus = async () => {
  let status = "unknown";
  
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      status = result.state;
    }
  } catch (err) {
    console.error('检查权限状态出错', err);
  }
  
  return status;
};

const PermissionGuide: React.FC<PermissionGuideProps> = ({ isVisible, onClose }) => {
  const [permissionStatus, setPermissionStatus] = useState<string>("检查中...");
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  // 当组件显示时，检查权限状态
  useEffect(() => {
    if (isVisible) {
      const checkStatus = async () => {
        const status = await checkPermissionStatus();
        setPermissionStatus(status);
        
        // 收集调试信息
        let info = "";
        
        // 检查浏览器信息
        info += `浏览器: ${navigator.userAgent}\n`;
        
        // 检查音频设备
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioDevices = devices.filter(device => device.kind === 'audioinput');
            info += `检测到 ${audioDevices.length} 个音频输入设备\n`;
            audioDevices.forEach((device, index) => {
              info += `${index + 1}. ${device.label || '未命名设备'}\n`;
            });
          } catch (err) {
            info += `无法枚举音频设备: ${err}\n`;
          }
        } else {
          info += "浏览器不支持设备枚举API\n";
        }
        
        // 检查是否支持常用的MIME类型
        if (window.MediaRecorder) {
          info += "\nMIME类型支持:\n";
          ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg', 'audio/mp4'].forEach(mimeType => {
            info += `${mimeType}: ${MediaRecorder.isTypeSupported(mimeType) ? '✓' : '✗'}\n`;
          });
        } else {
          info += "\n浏览器不支持MediaRecorder API\n";
        }
        
        setDebugInfo(info);
      };
      
      checkStatus();
    }
  }, [isVisible]);
  
  if (!isVisible) return null
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-pink-500">麦克风权限指南</h2>
        
        <div className="mb-4 text-gray-700">
          <div className="bg-gray-100 p-3 rounded-lg mb-4">
            <p className="font-semibold">当前权限状态: 
              <span className={`ml-2 ${
                permissionStatus === 'granted' ? 'text-green-500' : 
                permissionStatus === 'denied' ? 'text-red-500' : 
                'text-yellow-500'
              }`}>
                {permissionStatus === 'granted' ? '已授权' : 
                 permissionStatus === 'denied' ? '已拒绝' : 
                 permissionStatus === 'prompt' ? '等待询问' : 
                 permissionStatus}
              </span>
            </p>
          </div>
          
          <p className="mb-3">以下是启用麦克风权限的步骤：</p>
          
          <h3 className="font-bold text-lg mb-2 text-pink-400">Chrome/Edge 浏览器</h3>
          <ol className="list-decimal pl-5 mb-3 space-y-1">
            <li>点击地址栏左侧的锁定/感叹号图标</li>
            <li>查找"麦克风"或"麦克风和摄像头"选项</li>
            <li>选择"允许"并刷新页面</li>
            <li>如果没有看到权限选项，点击"网站设置"进入详细设置</li>
          </ol>
          
          <h3 className="font-bold text-lg mb-2 text-pink-400">Firefox 浏览器</h3>
          <ol className="list-decimal pl-5 mb-3 space-y-1">
            <li>点击地址栏左侧的权限图标</li>
            <li>确保麦克风权限设置为"允许"</li>
            <li>或者打开菜单，选择"选项" → "隐私与安全" → "权限"</li>
            <li>找到麦克风权限并修改设置</li>
          </ol>
          
          <p className="mt-4 text-sm text-gray-500">如果您已经拒绝了权限，可能需要点击地址栏中的锁定图标，然后手动重置权限设置，或者点击下面的刷新按钮。</p>
        </div>
        
        <div className="mb-4">
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer mb-2">显示调试信息（如需技术支持请提供此信息）</summary>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
              {debugInfo}
            </pre>
          </details>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            刷新页面
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
          >
            我知道了
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PermissionGuide 