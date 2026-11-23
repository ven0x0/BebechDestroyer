package pl.rozstaw.app;

import java.io.IOException;
import java.net.URL;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;

/** The server chooses the release number and bytes, never an arbitrary install URL or app identity. */
final class UpdatePolicy {
    static final String ASSET = "BebechDestroyer.apk";
    static final int MAX_APK = 64 * 1024 * 1024;
    static final int MAX_JSON = 256 * 1024;
    private static final Pattern REPO = Pattern.compile(
            "[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?/[A-Za-z0-9._-]{1,100}");
    private static final Pattern DIGEST = Pattern.compile("[0-9a-f]{64}");

    private UpdatePolicy() {}

    static boolean validRepository(String slug) {
        if (slug == null || !REPO.matcher(slug).matches()) return false;
        String name = slug.substring(slug.indexOf('/') + 1);
        return !name.equals(".") && !name.equals("..");
    }

    static int version(String tag) throws IOException {
        if (tag == null || !tag.matches("android-[1-9][0-9]{0,9}")) throw new IOException("tag");
        long code = Long.parseLong(tag.substring(8));
        if (code > Integer.MAX_VALUE) throw new IOException("versionCode");
        return (int) code;
    }

    static String digest(String field) throws IOException {
        if (field == null || !field.startsWith("sha256:") || !validHex(field.substring(7))) {
            throw new IOException("release digest");
        }
        return field.substring(7);
    }

    static boolean validHex(String digest) {
        return digest != null && DIGEST.matcher(digest).matches();
    }

    static String toHex(byte[] bytes) {
        char[] hex = "0123456789abcdef".toCharArray();
        StringBuilder out = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) out.append(hex[(value & 255) >>> 4]).append(hex[value & 15]);
        return out.toString();
    }

    static URL apiUrl(String repo) throws IOException {
        if (!validRepository(repo)) throw new IOException("repository");
        return new URL("https://api.github.com/repos/" + repo + "/releases/latest");
    }

    static URL apkUrl(String repo, int version) throws IOException {
        if (!validRepository(repo) || version < 1) throw new IOException("release");
        return new URL("https://github.com/" + repo + "/releases/download/android-" + version + "/" + ASSET);
    }

    static boolean trusted(URL url, boolean metadata) {
        if (!"https".equalsIgnoreCase(url.getProtocol()) || url.getUserInfo() != null
                || url.getRef() != null || (url.getPort() != -1 && url.getPort() != 443)) return false;
        String host = url.getHost();
        if (metadata) return "api.github.com".equalsIgnoreCase(host);
        return "github.com".equalsIgnoreCase(host) || "release-assets.githubusercontent.com".equalsIgnoreCase(host)
                || "objects.githubusercontent.com".equalsIgnoreCase(host);
    }

    static boolean allowInstall(String selfPackage, long installed, List<String> selfSigners,
                                String apkPackage, long apkVersion, List<String> apkSigners, int offered) {
        return selfPackage != null && Objects.equals(selfPackage, apkPackage)
                && apkVersion > installed && apkVersion == offered
                && selfSigners != null && !selfSigners.isEmpty() && selfSigners.equals(apkSigners);
    }

    static boolean matchesAsset(long size, long expectedSize, byte[] actualDigest, String expectedHash) {
        return expectedSize > 0 && expectedSize <= MAX_APK && size == expectedSize
                && validHex(expectedHash) && toHex(actualDigest).equals(expectedHash);
    }
}
