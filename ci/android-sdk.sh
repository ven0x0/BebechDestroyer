#!/usr/bin/env bash
set -euo pipefail

# Published Gradle 8.9 wrapper checksums: https://gradle.org/release-checksums/
printf '%s  %s\n' 498495120a03b9a6ab5d155f5de3c8f0d986a449153702fb80fc80e134484f17 \
  gradle/wrapper/gradle-wrapper.jar | sha256sum --check --status
grep -Fxq 'distributionSha256Sum=d725d707bfabd4dfdc958c624003b3c80accc03f7037b5122c4b1d0ef15cecab' gradle/wrapper/gradle-wrapper.properties
if [[ ! -e "$ANDROID_HOME/platforms/android-35/android.jar" || ! -x "$ANDROID_HOME/build-tools/35.0.0/apksigner" ]]; then
  "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platforms;android-35" "build-tools;35.0.0"
fi
