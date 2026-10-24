# Monjaro Odometer DIAG v1.9 — APK recovery

Package: `ack48.monjarodev.odometerdiag`  
Version: `1.9` (`versionCode=19`)  
APK SHA-256: `ca9ab4ce43d7687dd40d25f74a015fba3032831c01127fbbe3839c5fc2905f25`

## Verified from original APK
- APK has `classes.dex` (588 bytes) and `classes2.dex` (38,428 bytes), binary Android manifest, and resources.
- Built-in HTTP interface listens on port `8765`.
- Observed HTTP routes in DEX: `/terminal`, `/output`, `/run?`, `/request`, `/auth`.
- The existing terminal HTML uses a **single-line** `<input id='command' maxlength='600'>`, which explains why multiline shell commands cannot be entered correctly.
- Existing JS submits `command` via POST to `/terminal` and polls `/output` to display the result.
- Existing copy handler tries `navigator.clipboard.writeText`, then `document.execCommand('copy')`.

## Recovery plan
1. Preserve the original signed APK unmodified.
2. Decompile DEX with JADX; decode manifest/resources with apktool or equivalent.
3. Reconstruct an Android Gradle project; compare endpoints and root execution behavior with original.
4. Replace single-line command field with a multiline `textarea`; implement clipboard paste-and-run and auto-copy on the **phone browser**, with user permission/fallback for insecure HTTP origins.
5. Build and test a new APK **without uninstalling v1.9**. Updating in place requires the original signing key; otherwise use a different package ID for testing.

The original APK was supplied in ChatGPT conversation and analyzed; this repository note does not claim that a fully decompiled, buildable project is already committed.
