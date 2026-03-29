// 测试 Docker 连接
const Docker = require('dockerode');

async function testDocker() {
  console.log('Testing Docker connection...');

  try {
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });

    // 测试连接
    const info = await docker.info();
    console.log('✅ Docker connected successfully');
    console.log('Docker version:', info.ServerVersion);
    console.log('Containers:', info.Containers);
    console.log('Running:', info.ContainersRunning);

    // 列出所有容器
    console.log('\n--- All Containers ---');
    const containers = await docker.listContainers({ all: true });

    if (containers.length === 0) {
      console.log('No containers found');
    } else {
      containers.forEach((container, i) => {
        const labels = container.Labels || {};
        const hasHomeHub = labels['home-hub.name'];

        console.log(`\n${i + 1}. ${container.Names[0]}`);
        console.log('   ID:', container.Id.substring(0, 12));
        console.log('   State:', container.State);
        console.log('   Image:', container.Image);

        if (hasHomeHub) {
          console.log('   🏷️  home-hub.name:', hasHomeHub);
          console.log('   home-hub.url:', labels['home-hub.url'] || 'N/A');
          console.log('   home-hub.port:', labels['home-hub.port'] || '80');
          console.log('   home-hub.category:', labels['home-hub.category'] || '其他');
        } else {
          console.log('   Labels:', Object.keys(labels).length > 0 ? Object.keys(labels).join(', ') : 'None');
        }
      });
    }

    // 统计带 home-hub 标签的容器
    const homeHubContainers = containers.filter(c => c.Labels && c.Labels['home-hub.name']);
    console.log(`\n✅ Found ${homeHubContainers.length} containers with home-hub labels`);

  } catch (error) {
    console.error('❌ Docker connection failed:', error.message);
    process.exit(1);
  }
}

testDocker();
