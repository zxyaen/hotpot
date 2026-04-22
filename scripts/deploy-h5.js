/**
 * 上传 H5 到 CloudBase 静态托管
 * 用法: TCB_SECRET_ID=xxx TCB_SECRET_KEY=xxx node scripts/deploy-h5.js
 */
const path = require('path');
const CloudBase = require('@cloudbase/manager-node');

const SECRET_ID = process.env.TCB_SECRET_ID;
const SECRET_KEY = process.env.TCB_SECRET_KEY;
const ENV_ID = process.env.TCB_ENV_ID || 'hotpot-d7gn5onbkea76e975';
const BUILD_DIR = path.resolve(__dirname, '../h5/build');

if (!SECRET_ID || !SECRET_KEY) {
  console.error('❌ 请设置 TCB_SECRET_ID 和 TCB_SECRET_KEY');
  process.exit(1);
}

const { hosting } = new CloudBase({
  secretId: SECRET_ID,
  secretKey: SECRET_KEY,
  envId: ENV_ID,
});

async function deploy() {
  console.log('🚀 开始上传 H5 到 CloudBase 静态托管...');
  console.log(`   环境ID: ${ENV_ID}`);
  console.log(`   本地目录: ${BUILD_DIR}`);
  
  let fileCount = 0;

  await hosting.uploadFiles({
    localPath: BUILD_DIR,
    cloudPath: '/',   // 上传到静态托管根目录
    onFileFinish: (err, res, fileInfo) => {
      if (err) {
        console.error(`  ❌ ${fileInfo.cloudPath}: ${err.message}`);
      } else {
        fileCount++;
        console.log(`  ✅ ${fileInfo.cloudPath}`);
      }
    },
  });

  console.log(`\n🎉 上传完成！共 ${fileCount} 个文件`);
  console.log('   访问: https://hotpot-d7gn5onbkea76e975.tcloudbaseapp.com/');
}

deploy().catch(e => {
  console.error('❌ 部署失败:', e.message);
  process.exit(1);
});
