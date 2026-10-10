module.exports = {
  apps: [
    {
      name: "cardstudio-api",
      cwd: "/var/www/cardstudio/backend",
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "cardstudio-frontend",
      cwd: "/var/www/cardstudio/frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
