#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Generating native iOS project via Expo Prebuild..."
CI=1 npx expo prebuild --platform ios --clean --no-install

echo "export NODE_BINARY=$(command -v node)" > ios/.xcode.env.local

if [ -f "ios/Podfile" ]; then
  echo "==> Patching Podfile to disable code signing on Pod resource bundles..."
  node -e '
    const fs = require("fs");
    const file = "ios/Podfile";
    let content = fs.readFileSync(file, "utf8");
    const snippet = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings["CODE_SIGNING_ALLOWED"] = "NO"
        config.build_settings["CODE_SIGNING_REQUIRED"] = "NO"
        config.build_settings["CODE_SIGN_IDENTITY"] = ""
      end
    end`;
    if (content.includes("post_install do |installer|")) {
      content = content.replace(
        "post_install do |installer|",
        "post_install do |installer|" + snippet
      );
      fs.writeFileSync(file, content, "utf8");
    }
  '

  echo "==> Installing CocoaPods..."
  (cd ios && LANG=en_US.UTF-8 pod install)
fi

WORKSPACE=$(find ios -maxdepth 1 -name "*.xcworkspace" | head -n 1 || true)
PROJECT=$(find ios -maxdepth 1 -name "*.xcodeproj" | head -n 1 || true)

if [ -n "$WORKSPACE" ]; then
  SCHEME=$(basename "$WORKSPACE" .xcworkspace)
  TARGET_ARGS=(-workspace "$WORKSPACE" -scheme "$SCHEME")
elif [ -n "$PROJECT" ]; then
  SCHEME=$(basename "$PROJECT" .xcodeproj)
  TARGET_ARGS=(-project "$PROJECT" -scheme "$SCHEME")
else
  echo "Error: Could not find generated .xcworkspace or .xcodeproj in app/ios"
  exit 1
fi

echo "==> Compiling Release iOS scheme: $SCHEME"
xcodebuild build \
  "${TARGET_ARGS[@]}" \
  -configuration Release \
  -sdk iphoneos \
  -destination "generic/platform=iOS" \
  -derivedDataPath "ios/build" \
  COMPILER_INDEX_STORE_ENABLE=NO \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" \
  AD_HOC_CODE_SIGNING_ALLOWED=YES \
  DEVELOPMENT_TEAM=""

APP_PATH=$(find "ios/build/Build/Products/Release-iphoneos" -maxdepth 1 -name "*.app" | head -n 1 || true)
if [ -z "$APP_PATH" ] || [ ! -d "$APP_PATH" ]; then
  echo "Error: Compiled .app bundle not found!"
  exit 1
fi

echo "==> Packaging $APP_PATH into AussieSpecials.ipa..."
rm -rf build-ipa AussieSpecials.ipa
mkdir -p build-ipa/Payload
cp -R "$APP_PATH" build-ipa/Payload/

APP_BASENAME=$(basename "$APP_PATH")
codesign --force --deep --sign - "build-ipa/Payload/$APP_BASENAME"

(cd build-ipa && zip -qry "../AussieSpecials.ipa" Payload)
ls -lh AussieSpecials.ipa
echo "==> Successfully created app/AussieSpecials.ipa"
