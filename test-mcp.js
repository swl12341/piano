#!/usr/bin/env node

/**
 * MCP 配置测试脚本
 * 用于验证 MCP 服务器是否正确配置
 */

const fs = require('fs');
const path = require('path');

// 检查配置文件是否存在
function checkConfigFile() {
    const configPaths = [
        '.cursor/mcp.json',
        path.join(process.env.HOME || process.env.USERPROFILE, '.cursor/mcp.json')
    ];
    
    for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
            console.log(`✅ 找到配置文件: ${configPath}`);
            return configPath;
        }
    }
    
    console.log('❌ 未找到 MCP 配置文件');
    return null;
}

// 验证配置文件格式
function validateConfig(configPath) {
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        if (!config.mcpServers) {
            console.log('❌ 配置文件缺少 mcpServers 字段');
            return false;
        }
        
        console.log(`✅ 配置文件格式正确，包含 ${Object.keys(config.mcpServers).length} 个服务器`);
        
        // 列出所有配置的服务器
        Object.keys(config.mcpServers).forEach(serverName => {
            const server = config.mcpServers[serverName];
            console.log(`  📡 ${serverName}: ${server.command} ${server.args?.join(' ') || ''}`);
        });
        
        return true;
    } catch (error) {
        console.log(`❌ 配置文件解析错误: ${error.message}`);
        return false;
    }
}

// 检查必要的依赖
function checkDependencies() {
    const requiredCommands = ['node', 'npx'];
    
    for (const cmd of requiredCommands) {
        try {
            require('child_process').execSync(`${cmd} --version`, { stdio: 'pipe' });
            console.log(`✅ ${cmd} 已安装`);
        } catch (error) {
            console.log(`❌ ${cmd} 未安装或不在 PATH 中`);
        }
    }
}

// 主函数
function main() {
    console.log('🔍 MCP 配置检查开始...\n');
    
    // 检查依赖
    console.log('检查系统依赖:');
    checkDependencies();
    console.log();
    
    // 检查配置文件
    console.log('检查配置文件:');
    const configPath = checkConfigFile();
    if (configPath) {
        validateConfig(configPath);
    }
    
    console.log('\n✨ 检查完成！');
    console.log('\n📝 下一步:');
    console.log('1. 在 Cursor 中打开设置');
    console.log('2. 导航到 Features → Model Context Protocol');
    console.log('3. 启用 MCP 功能');
    console.log('4. 在 Agent 模式中测试 MCP 工具');
}

if (require.main === module) {
    main();
}
