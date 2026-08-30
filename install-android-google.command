#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "Bean Growth v5.1 Android Google認証セットアップ"
echo "------------------------------------------------"

if [ ! -d "android/app" ]; then
  echo "ERROR: android/app が見つかりません。"
  echo "bean-growth-game のプロジェクト直下でこのファイルを実行してください。"
  exit 1
fi

GOOGLE_JSON="android/app/google-services.json"
if [ ! -f "$GOOGLE_JSON" ]; then
  echo ""
  echo "STOP: $GOOGLE_JSON がまだありません。"
  echo "Firebase Console > プロジェクト設定 > Androidアプリ com.beangrowth.app"
  echo "から最新の google-services.json をダウンロードし、"
  echo "android/app/google-services.json に置いてから、もう一度実行してください。"
  exit 2
fi

mkdir -p android/app/src/main/java/com/beangrowth/app
cp android-google/app/src/main/java/com/beangrowth/app/GoogleCredentialPlugin.java \
   android/app/src/main/java/com/beangrowth/app/GoogleCredentialPlugin.java
cp android-google/app/src/main/java/com/beangrowth/app/MainActivity.java \
   android/app/src/main/java/com/beangrowth/app/MainActivity.java

python3 <<'PY'
from pathlib import Path
import re

app = Path("android/app/build.gradle")
root = Path("android/build.gradle")

app_text = app.read_text()

deps = [
    'implementation "androidx.credentials:credentials:1.3.0"',
    'implementation "androidx.credentials:credentials-play-services-auth:1.3.0"',
    'implementation "com.google.android.libraries.identity.googleid:googleid:1.1.1"',
]

for dep in deps:
    if dep not in app_text:
        m = re.search(r'dependencies\s*\{', app_text)
        if not m:
            raise SystemExit("ERROR: android/app/build.gradle の dependencies ブロックが見つかりません。")
        pos = m.end()
        app_text = app_text[:pos] + "\n    " + dep + app_text[pos:]

if "com.google.gms.google-services" not in app_text:
    app_text += '\n\n// Bean Growth v5.1 Google Authentication\napply plugin: "com.google.gms.google-services"\n'

app.write_text(app_text)

root_text = root.read_text()
classpath_line = 'classpath "com.google.gms:google-services:4.4.4"'
if classpath_line not in root_text:
    dep_match = re.search(r'dependencies\s*\{', root_text)
    if not dep_match:
        raise SystemExit("ERROR: android/build.gradle の buildscript dependencies が見つかりません。")
    pos = dep_match.end()
    root_text = root_text[:pos] + "\n        " + classpath_line + root_text[pos:]
    root.write_text(root_text)

print("Android Gradle / MainActivity / native plugin patch: OK")
PY

echo ""
echo "SHA-1 / SHA-256を確認します..."
(
  cd android
  ./gradlew signingReport
) | tee /tmp/bean-growth-signing-report.txt

echo ""
echo "------------------------------------------------"
echo "Android Google認証パッチの適用が完了しました。"
echo ""
echo "Firebase Console > プロジェクト設定 > Androidアプリ"
echo "に、上の debug SHA-1 と SHA-256 を登録してください。"
echo "登録後は google-services.json を再ダウンロードして"
echo "android/app/google-services.json をもう一度置き換えてください。"
echo ""
echo "その後:"
echo "  ./sync-web.command"
echo "  Android StudioでGradle Sync"
echo "  Xiaomi XIG04を選択して ▶ Run"
echo ""
