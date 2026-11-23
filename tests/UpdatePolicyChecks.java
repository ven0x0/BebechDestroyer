package pl.rozstaw.app;

import java.io.IOException;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public final class UpdatePolicyChecks {
    private static final String REPO = "example/BebechDestroyer";
    private static final String PACKAGE = "pl.rozstaw.app";

    private static void expect(boolean value, String message) {
        if (!value) throw new AssertionError(message);
    }

    public static void main(String[] args) throws Exception {
        switch (args[0]) {
            case "channel":
                expect(UpdatePolicy.validRepository(REPO), "valid repo");
                for (String invalid : Arrays.asList(null, "example/..", "example/.", "evil.test/a/b", "a/b?x=1",
                        "a/b%2Fother", "https://github.com/example/name", " user/test", "-owner/repo", "a/é")) {
                    expect(!UpdatePolicy.validRepository(invalid), "invalid channel: " + invalid);
                }
                expect(UpdatePolicy.apiUrl(REPO).toString().equals(
                        "https://api.github.com/repos/example/BebechDestroyer/releases/latest"), "fixed manifest");
                expect(UpdatePolicy.apkUrl(REPO, 1001).toString().equals(
                        "https://github.com/example/BebechDestroyer/releases/download/android-1001/BebechDestroyer.apk"),
                        "fixed immutable artifact");
                expect(UpdatePolicy.version("android-1001") == 1001, "tag code");
                for (String bad : Arrays.asList("v1.3", "android--45", "android-00", "android-1.0", "android-2147483648")) {
                    try { UpdatePolicy.version(bad); throw new AssertionError(bad); }
                    catch (IOException ok) { }
                }
                break;
            case "redirects":
                expect(UpdatePolicy.trusted(new URL("https://api.github.com/repos/example/app/releases/latest"), true), "API");
                for (String host : Arrays.asList("github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com")) {
                    expect(UpdatePolicy.trusted(new URL("https://" + host + "/file?token=public-signed-url"), false), "asset CDN");
                }
                for (String bad : Arrays.asList("http://github.com/a", "https://github.com.bad.test/a",
                        "https://github.com@evil.test/a", "https://user@github.com/a", "https://github.com:8443/x",
                        "file:///release.apk", "https://raw.githubusercontent.com/x/y/app", "https://github.com/x#redirection")) {
                    expect(!UpdatePolicy.trusted(new URL(bad), false), "redirect: " + bad);
                }
                expect(!UpdatePolicy.trusted(new URL("https://github.com/path"), true), "separate API endpoint");
                break;
            case "integrity":
                byte[] bytes = "abc".getBytes("UTF-8");
                byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
                String hash = UpdatePolicy.digest("sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
                expect(UpdatePolicy.matchesAsset(3, 3, digest, hash), "matching size and digest");
                expect(!UpdatePolicy.matchesAsset(2, 3, digest, hash), "short download");
                expect(!UpdatePolicy.matchesAsset(4, 3, digest, hash), "excess bytes");
                expect(!UpdatePolicy.matchesAsset(3, 3, new byte[32], hash), "wrong digest");
                expect(!UpdatePolicy.matchesAsset(0, 0, digest, hash), "empty download");
                long large = (long) UpdatePolicy.MAX_APK + 1;
                expect(!UpdatePolicy.matchesAsset(large, large, digest, hash), "over budget");
                for (String bad : Arrays.asList(null, "", hash, "md5:" + hash, "sha256:12xz", "sha256:" + hash + "/")) {
                    try { UpdatePolicy.digest(bad); throw new AssertionError("invalid digest"); }
                    catch (IOException ok) { }
                }
                break;
            case "install":
                List<String> signers = Arrays.asList("fingerprint-A", "fingerprint-B");
                expect(UpdatePolicy.allowInstall(PACKAGE, 3, signers, PACKAGE, 1001, signers, 1001), "1.2 upgrade");
                expect(!UpdatePolicy.allowInstall(PACKAGE, 1001, signers, PACKAGE, 1001, signers, 1001), "same version");
                expect(!UpdatePolicy.allowInstall(PACKAGE, 1002, signers, PACKAGE, 1001, signers, 1001), "downgrade");
                expect(!UpdatePolicy.allowInstall(PACKAGE, 3, signers, PACKAGE, 1001, signers, 1002), "mislabelled release");
                expect(!UpdatePolicy.allowInstall(PACKAGE, 3, signers, "pl.other.app", 1001, signers, 1001), "wrong package");
                expect(!UpdatePolicy.allowInstall(PACKAGE, 3, signers, PACKAGE, 1001, Arrays.asList("fingerprint-A"), 1001), "partial signer set");
                expect(!UpdatePolicy.allowInstall(PACKAGE, 3, signers, PACKAGE, 1001, Arrays.asList("another"), 1001), "unrelated signing key");
                expect(!UpdatePolicy.allowInstall(PACKAGE, 3, Collections.emptyList(), PACKAGE, 1001, Collections.emptyList(), 1001), "unsigned");
                break;
            default: throw new AssertionError("Unknown suite");
        }
    }
}
