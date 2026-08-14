module.exports = {
  apps: [
    {
      name: 'yo1cashback-api',
      script: 'dist/server.js',
      cwd: __dirname,
      instances: 2,
      exec_mode: 'cluster',
      instance_var: 'NODE_APP_INSTANCE',
      autorestart: true,
      max_memory_restart: '500M',
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 10000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
