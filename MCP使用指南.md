# MCP (Model Context Protocol) 使用指南

## 🚀 快速开始

### 1. 基本配置
```bash
# 运行测试脚本验证配置
node test-mcp.js
```

### 2. 在 Cursor 中使用 MCP

#### 启用 Agent 模式
1. 打开 Cursor 的 Chat 面板
2. 选择 "Agent" 模式
3. MCP 工具将自动可用

#### 常用命令示例
```
# 搜索网络信息
请使用 Brave 搜索查找关于 "React 18 新特性" 的信息

# 访问文件系统
请读取当前目录下的 package.json 文件内容

# GitHub 操作
请查看我的 GitHub 仓库列表

# 网页抓取
请抓取 https://example.com 的页面内容
```

## 📋 可用的 MCP 服务器

### 文件系统服务器
- **功能**: 读取、写入、搜索文件
- **配置**: 指定允许访问的目录路径
- **使用**: 自动在 Agent 中可用

### 网页抓取服务器
- **功能**: 抓取网页内容和 API 数据
- **配置**: 无需额外配置
- **使用**: 直接提供 URL 即可

### 搜索服务器
- **功能**: 使用 Brave 搜索引擎
- **配置**: 需要 Brave API 密钥
- **使用**: 提供搜索关键词

### GitHub 服务器
- **功能**: 访问 GitHub 仓库和代码
- **配置**: 需要 GitHub 个人访问令牌
- **使用**: 自动识别 GitHub 相关操作

## 🔧 故障排除

### 常见问题

#### 1. 服务器启动失败
```bash
# 检查命令是否正确
npx @modelcontextprotocol/server-fetch --help

# 检查权限
ls -la /path/to/your/directory
```

#### 2. 环境变量未找到
```bash
# 检查环境变量
echo $API_KEY

# 验证 .env 文件
cat .env
```

#### 3. 权限错误
```bash
# 检查文件权限
chmod +x /path/to/server

# 检查目录权限
chmod 755 /path/to/directory
```

### 调试模式
在配置文件中添加调试选项：
```json
{
  "mcpServers": {
    "debug-server": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "DEBUG": "true",
        "LOG_LEVEL": "verbose"
      }
    }
  }
}
```

## 📚 高级配置

### 自定义 MCP 服务器
创建自己的 MCP 服务器：

```javascript
// custom-server.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server({
  name: 'custom-server',
  version: '1.0.0'
});

// 添加工具
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [{
      name: 'custom-tool',
      description: '自定义工具',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string' }
        }
      }
    }]
  };
});

// 启动服务器
server.connect();
```

### 负载均衡配置
```json
{
  "mcpServers": {
    "load-balanced": {
      "command": "npx",
      "args": ["-y", "load-balancer"],
      "env": {
        "BACKEND_SERVERS": "server1:3000,server2:3000,server3:3000"
      }
    }
  }
}
```

## 🔒 安全注意事项

1. **API 密钥管理**
   - 使用环境变量存储敏感信息
   - 不要在代码中硬编码密钥
   - 定期轮换 API 密钥

2. **文件系统访问**
   - 限制可访问的目录范围
   - 避免给予根目录访问权限
   - 使用最小权限原则

3. **网络安全**
   - 使用 HTTPS 连接
   - 验证 SSL 证书
   - 限制网络访问范围

## 📞 获取帮助

- [MCP 官方文档](https://modelcontextprotocol.io/docs)
- [Cursor MCP 指南](https://cursor.sh/docs/mcp)
- [GitHub Issues](https://github.com/modelcontextprotocol/issues)

---

**提示**: 定期更新 MCP 服务器以获取最新功能和安全修复。
