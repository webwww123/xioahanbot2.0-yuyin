// Deno API 测试脚本
// 使用方法: deno run --allow-net deno-test.js

const API_URL = "https://pink-chat-api.deno.dev/v1";
const API_KEY = "AIzaSyBIDvwIlfUzhQPQQVwPWlAAVv75-E_oxuM";

// 测试获取模型列表
async function testModels() {
  console.log("测试获取模型列表...");
  
  try {
    const url = `${API_URL}/models?key=${API_KEY}`;
    console.log(`请求URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP错误: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("模型列表获取成功:");
    console.log(JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("获取模型列表失败:", error.message);
    return false;
  }
}

// 测试聊天功能
async function testChat() {
  console.log("\n测试聊天功能...");
  
  try {
    const url = `${API_URL}/chat/completions`;
    console.log(`请求URL: ${url}`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gemini-2.0-pro-exp-02-0",
        messages: [
          { role: "user", content: "你好，这是一条测试消息，请用可爱的语气回复" }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP错误: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("聊天请求成功:");
    console.log(`回复内容: ${data.choices[0].message.content}`);
    return true;
  } catch (error) {
    console.error("聊天请求失败:", error.message);
    return false;
  }
}

// 测试嵌入向量功能
async function testEmbeddings() {
  console.log("\n测试嵌入向量功能...");
  
  try {
    const url = `${API_URL}/embeddings`;
    console.log(`请求URL: ${url}`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "embedding-gecko-001",
        input: "这是一条测试文本"
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP错误: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("嵌入向量请求成功:");
    console.log(`向量维度: ${data.data[0].embedding.length}`);
    return true;
  } catch (error) {
    console.error("嵌入向量请求失败:", error.message);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log("开始API测试...\n");
  
  let modelsSuccess = await testModels();
  let chatSuccess = await testChat();
  let embeddingsSuccess = await testEmbeddings();
  
  console.log("\n测试结果汇总:");
  console.log(`- 模型列表测试: ${modelsSuccess ? '✓ 成功' : '✗ 失败'}`);
  console.log(`- 聊天功能测试: ${chatSuccess ? '✓ 成功' : '✗ 失败'}`);
  console.log(`- 嵌入向量测试: ${embeddingsSuccess ? '✓ 成功' : '✗ 失败'}`);
}

// 执行测试
runAllTests(); 