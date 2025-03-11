'use client';

import { useState } from 'react';

export default function ApiTestPage() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testGetModels = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('测试 GET /api/gemini-local/models');
      const res = await fetch('/api/gemini-local/models');
      if (!res.ok) {
        throw new Error(`请求失败: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('请求错误:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const testChatCompletions = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('测试 POST /api/gemini-local/chat/completions');
      const res = await fetch('/api/gemini-local/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemini-2.0-pro-exp-02-05',
          messages: [
            { role: 'user', content: '你好，这是一条测试消息，请用中文回复' },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`请求失败: ${res.status} ${res.statusText}\n${text}`);
      }
      
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('请求错误:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const testApiRoute = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('测试 GET /api/test');
      const res = await fetch('/api/test');
      if (!res.ok) {
        throw new Error(`请求失败: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('请求错误:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API 路由测试</h1>
      
      <div className="flex space-x-2 mb-4">
        <button
          onClick={testGetModels}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          测试 GET /api/gemini-local/models
        </button>
        
        <button
          onClick={testChatCompletions}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={loading}
        >
          测试 POST /api/gemini-local/chat/completions
        </button>
        
        <button
          onClick={testApiRoute}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          disabled={loading}
        >
          测试 GET /api/test
        </button>
      </div>
      
      {loading && <p className="text-gray-600 mb-4">加载中...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">错误:</p>
          <p className="whitespace-pre-wrap">{error}</p>
        </div>
      )}
      
      {response && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">响应:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 