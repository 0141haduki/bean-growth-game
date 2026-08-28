#!/bin/zsh
set -e
cd "$(dirname "$0")"
node tools/sync-web.mjs
echo ""
echo "同期完了。Enterで閉じます。"
read
