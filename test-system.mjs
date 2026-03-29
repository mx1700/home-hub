// 完整系统测试
import Docker from 'dockerode';
import { DockerMonitor } from './app/lib/docker.js';
import { IconManager } from './app/lib/icons.js';
import { serviceStore } from './app/lib/store.js';

async function testSystem() {
  console.log('🧪 开始完整系统测试...\n');

  try {
    // 1. 测试 Docker 连接
    console.log('1️⃣  测试 Docker 连接...');
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    const info = await docker.info();
    console.log(`   ✅ Docker ${info.ServerVersion} 连接成功`);
    console.log(`   📊 总容器: ${info.Containers}, 运行中: ${info.ContainersRunning}\n`);

    // 2. 测试 DockerMonitor 扫描
    console.log('2️⃣  测试服务扫描...');
    const monitor = new DockerMonitor('/var/run/docker.sock', 'localhost');
    const services = await monitor.scanServices();
    console.log(`   ✅ 扫描到 ${services.length} 个服务:`);
    services.forEach(s => {
      console.log(`      • ${s.name} (${s.category}) - ${s.url} - ${s.status}`);
    });
    console.log();

    // 3. 测试图标管理
    console.log('3️⃣  测试图标管理...');
    const iconManager = new IconManager('./data');
    await iconManager.updateServiceIcons(services);
    console.log(`   ✅ 图标下载完成`);
    console.log(`   📁 图标目录: ./data/icons\n`);

    // 4. 测试服务存储
    console.log('4️⃣  测试状态存储...');
    const servicesWithIcons = services.map(s => ({
      ...s,
      icon: iconManager.getIconPath(s.icon) || s.icon,
    }));
    serviceStore.setServices(servicesWithIcons);
    const storedServices = serviceStore.getServices();
    console.log(`   ✅ 存储了 ${storedServices.length} 个服务\n`);

    // 5. 测试 URL 构建
    console.log('5️⃣  测试 URL 构建逻辑...');
    services.forEach(s => {
      console.log(`   • ${s.name}: ${s.url}`);
    });
    console.log();

    // 6. 测试事件监听启动
    console.log('6️⃣  测试事件监听...');
    await monitor.startEventListener();
    console.log(`   ✅ Docker 事件监听已启动\n`);

    // 总结
    console.log('✅ 所有测试通过！系统工作正常');
    console.log('\n📝 总结:');
    console.log(`   • 发现 ${services.length} 个带 home-hub 标签的容器`);
    console.log(`   • 图标已下载到 ./data/icons`);
    console.log(`   • 实时更新已启用`);
    console.log(`   • 服务已按分类组织`);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testSystem();
