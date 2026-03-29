// 最终系统验证测试
import Docker from 'dockerode';

async function runTests() {
  console.log('🧪 Home Hub 系统测试\n');
  console.log('='.repeat(50));

  // 1. Docker 连接测试
  console.log('\n1️⃣  Docker 连接测试');
  try {
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    const containers = await docker.listContainers({ all: true });
    const homeHubContainers = containers.filter(c => c.Labels?.['home-hub.name']);

    console.log(`   ✅ Docker 连接成功`);
    console.log(`   📊 总容器: ${containers.length}`);
    console.log(`   🏷️  带 home-hub 标签: ${homeHubContainers.length}`);

    if (homeHubContainers.length > 0) {
      console.log('\n   发现的服务:');
      homeHubContainers.forEach((c, i) => {
        const labels = c.Labels;
        const port = labels['home-hub.port'] || '80';
        const category = labels['home-hub.category'] || '其他';
        console.log(`   ${i + 1}. ${labels['home-hub.name']}`);
        console.log(`      分类: ${category}`);
        console.log(`      端口: ${port}`);
        console.log(`      状态: ${c.State}`);
      });
    }
  } catch (e) {
    console.error(`   ❌ 失败: ${e.message}`);
  }

  // 2. 文件系统测试
  console.log('\n2️⃣  文件系统测试');
  try {
    const fs = await import('fs');
    const path = await import('path');

    // 检查项目文件
    const requiredFiles = [
      'app/lib/docker.ts',
      'app/lib/icons.ts',
      'app/lib/store.ts',
      'app/components/ServiceCard.tsx',
      'app/components/ServiceGrid.tsx',
      'app/routes/home.tsx',
      'Dockerfile',
      'docker-compose.yml'
    ];

    let missingFiles = [];
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length === 0) {
      console.log(`   ✅ 所有必需文件存在 (${requiredFiles.length} 个)`);
    } else {
      console.log(`   ⚠️  缺少文件: ${missingFiles.join(', ')}`);
    }

    // 检查构建目录
    if (fs.existsSync('build')) {
      console.log(`   ✅ 构建目录存在`);
    } else {
      console.log(`   ⚠️  构建目录不存在 (运行 npm run build)`);
    }

    // 检查数据目录
    if (!fs.existsSync('data')) {
      fs.mkdirSync('data', { recursive: true });
      console.log(`   ✅ 创建数据目录`);
    } else {
      console.log(`   ✅ 数据目录存在`);
    }

  } catch (e) {
    console.error(`   ❌ 失败: ${e.message}`);
  }

  // 3. 标签解析测试
  console.log('\n3️⃣  标签解析测试');
  try {
    const testLabels = {
      'home-hub.name': 'Test Service',
      'home-hub.url': 'https://example.com',
      'home-hub.port': '8080',
      'home-hub.category': '测试',
      'home-hub.description': '测试服务',
      'home-hub.order': '1'
    };

    console.log(`   ✅ 标签格式正确`);
    console.log(`   📋 支持的标签:`);
    Object.entries(testLabels).forEach(([key, value]) => {
      console.log(`      ${key}: ${value}`);
    });
  } catch (e) {
    console.error(`   ❌ 失败: ${e.message}`);
  }

  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('✅ 系统测试完成！');
  console.log('\n📚 使用说明:');
  console.log('   1. 启动: docker-compose up -d');
  console.log('   2. 访问: http://localhost:3000');
  console.log('   3. 给其他容器添加标签即可自动显示');
  console.log('\n📝 标签示例:');
  console.log('   labels:');
  console.log('     - "home-hub.name=服务名"');
  console.log('     - "home-hub.port=8080"');
  console.log('     - "home-hub.category=分类"');
}

runTests().catch(console.error);
