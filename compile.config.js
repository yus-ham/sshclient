module.exports = {
  apps: [{
    name: "compile sshclient",
    script: "bun run android",
    watch: ["apps", "deps"],
    ignore_watch: ["deps/svelte"]
  }]
}
