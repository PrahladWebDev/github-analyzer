module.exports = {
  apps: [
    {
      name: 'github-personality-api',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      max_memory_restart: '300M',
      out_file: '/home/prahlad/.pm2/logs/github-personality-api-out.log',
      error_file: '/home/prahlad/.pm2/logs/github-personality-api-error.log',
      time: true
    }
  ]
};
