// 测试脚本 - 用于检查本地API代理是否工作
const fetch = require('node-fetch');

// 在开发服务器中访问API端点
const BASE_URL = 'http://localhost:3000/api/gemini-local';

async function testGet() {
  try {
    console.log('测试GET /models 端点...');
    const response = await fetch(`${BASE_URL}/models`);
    const status = response.status;
    console.log(`状态码: ${status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('响应数据:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('错误响应:', text);
    }
  } catch (error) {
    console.error('GET请求错误:', error.message);
  }
}

async function testPost() {
  try {
    console.log('\n测试POST /chat/completions 端点...');
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gemini-2.0-pro-exp-02-05',
        messages: [
          { role: 'user', content: '你好，这是一条测试消息，请用中文回复' }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    const status = response.status;
    console.log(`状态码: ${status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('响应数据:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('错误响应:', text);
    }
  } catch (error) {
    console.error('POST请求错误:', error.message);
  }
}

// 运行测试
async function runTests() {
  await testGet();
  await testPost();
}

runTests(); 