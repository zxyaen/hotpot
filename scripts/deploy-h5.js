/**
 * 上传 H5 到 CloudBase 静态托管
 */
const path = require('path');
const fs = require('fs');
const CloudBase = require('@cloudbase/manager-node');

const ENV_ID = 'hotpot-d7gn5onbkea76e975';
const BUILD_DIR = path.resolve(__dirname, '../h5/build');

async function deploy() {
  // 从 mcporter 存储的凭证读取密钥
  const authFile = path.join(process.env.HOME || '/root', '.config/.cloudbase/auth.json');
  let secretId, secretKey, token;
  
  try {
    const raw = fs.readFileSync(authFile, 'utf8');
    const auth = JSON.parse(raw);
    const cred = auth.credential || {};
    secretId = cred.secretId;
    secretKey = cred.secretKey;
    token = cred.token;
  } catch(e) {
    console.error('❌ 读取凭证失败:', e.message);
    process.exit(1);
  }

  if (!secretId || !secretKey) {
    console.error('❌ 凭证不完整');
    process.exit(1);
  }

  console.log('✅ 凭证读取成功');
  
  const mgr = new CloudBase({
    secretId,
    secretKey,
    ...(token ? { token } : {}),
    envId: ENV_ID,
  });

  const { hosting } = mgr;

  console.log('🚀 开始上传 H5 到 CloudBase 静态托管...');
  console.log(`   环境ID: ${ENV_ID}`);
  console.log(`   本地目录: ${BUILD_DIR}`);

  let fileCount = 0;
  let errorCount = 0;

  await hosting.uploadFiles({
    localPath: BUILD_DIR,
    cloudPath: '/',
    onFileFinish: (err, res, fileInfo) => {
      if (err) {
        console.error(`  ❌ ${fileInfo.cloudPath}: ${err.message}`);
        errorCount++;
      } else {
        fileCount++;
        if (fileCount % 5 === 0) console.log(`  📦 已上传 ${fileCount} 个文件...`);
      }
    },
  });

  console.log(`\n🎉 上传完成！共 ${fileCount} 个文件，${errorCount} 个失败`);
  console.log(`   访问: https://hotpot-d7gn5onbkea76e975-1307945326.tcloudbaseapp.com/`);
  if (errorCount > 0) process.exit(1);
}

deploy().catch(e => {
  console.error('❌ 部署失败:', e.message);
  process.exit(1);
});
