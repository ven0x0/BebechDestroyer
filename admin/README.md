# Maintainer guide

## Local Android signing on Windows

The publisher checks the current master commit every five minutes. It accepts a successful android.yml run containing both the required tests and the unsigned APK for that commit. It verifies the artifact origin and SHA-256 digest, application ID, version and signing certificate before publishing BebechDestroyer.apk. The Android signing tools read the PKCS#12 keystore and password on the owner’s computer.

Install Git, GitHub CLI authenticated as the owner, Node.js 22 or later, JDK 17 and Android Build Tools 35. Substitute your local paths in PowerShell.

~~~powershell
.\admin\install-watcher.ps1 -Repository 'OWNER/BebechDestroyer' -Keystore 'D:\Keys\Rozstaw.p12' -PasswordFile 'D:\Keys\password.txt' -BuildToolsDirectory "$env:ANDROID_HOME\build-tools\35.0.0" -JavaHome $env:JAVA_HOME
~~~

For a GitHub credential encrypted for the current Windows user, pass its path with -GitHubCredentialFile. The configuration stores the path. The installer copies reviewed publisher scripts to %LOCALAPPDATA%\BebechDestroyer\Publisher and creates a **BebechDestroyer Publisher** shortcut in Startup. Re-run the installer after reviewing changes to the publisher scripts.

To pause, create an empty file named **paused** in the publisher directory. To resume, remove it and launch the shortcut. Removing the shortcut after pausing disables autostart. Check watcher.log for connection status. Run release-local.ps1 directly with the same local paths for a single diagnostic run.

## Protect master

After the first successful **master-checks** job on master, authenticate as the owner and run the configuration from the project root.

~~~sh
gh auth login --hostname github.com --web
node admin/protect-master.cjs OWNER/REPO
node admin/protect-master.cjs OWNER/REPO --verify
~~~

The script reads the repository and authenticated account. For a personal repository it requires the owner. In an organization it requires the administrator designated to approve merges. Check ruleset availability for your repository visibility and plan. [GitHub ruleset availability](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)

Review the PR under **Files changed** and confirm the merge after CI succeeds. The first ruleset grants one user a pull-request-only exception to the update restriction. A separate ruleset requires the GitHub Actions check and blocks force pushes and deletion, with an empty bypass list. This allows the owner to merge their own PR. Other contributors can submit and review changes. Repository administrators retain control of the settings. Both commands print links to the configured rulesets under **Settings → Rules → Rulesets**. [Ruleset layering](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets#about-rule-layering) · [Required reviews](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/approving-a-pull-request-with-required-reviews)
