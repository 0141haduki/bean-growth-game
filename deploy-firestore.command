#!/bin/zsh
set -e
cd "$(dirname "$0")"
firebase deploy --only firestore:rules,firestore:indexes
echo ""
echo "Firestore rules/indexes deployment complete. Enterで閉じます。"
read
