package pl.rozstaw.app;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import android.os.SystemClock;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InterruptedIOException;
import java.io.OutputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.security.DigestOutputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import javax.net.ssl.HttpsURLConnection;

/** Called by the native updater only. The workout WebView has no network access. */
final class ReleaseDownload {
    static final class Release {
        final String repo;
        final int code;
        final long size;
        final String hash;
        final String name;

        Release(String repo, int code, long size, String hash, String name) {
            this.repo = repo;
            this.code = code;
            this.size = size;
            this.hash = hash;
            this.name = name;
        }
    }

    private ReleaseDownload() {}

    static Release latest(String repo) throws IOException, JSONException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        transfer(UpdatePolicy.apiUrl(repo), bytes, UpdatePolicy.MAX_JSON, true);
        JSONObject data = new JSONObject(bytes.toString("UTF-8"));
        if (data.getBoolean("draft") || data.getBoolean("prerelease")) throw new IOException("unpublished");
        int code = UpdatePolicy.version(data.getString("tag_name"));
        String name = data.optString("name");
        if (!name.matches("[\\p{L}\\p{N} .()_-]{1,70}")) name = "BebechDestroyer #" + code;
        JSONArray assets = data.getJSONArray("assets");
        Release release = null;
        for (int i = 0; i < assets.length(); i++) {
            JSONObject a = assets.getJSONObject(i);
            if (!UpdatePolicy.ASSET.equals(a.optString("name"))) continue;
            long size = a.getLong("size");
            if (release != null || !"uploaded".equals(a.getString("state")) || size < 1
                    || size > UpdatePolicy.MAX_APK) throw new IOException("invalid asset");
            release = new Release(repo, code, size, UpdatePolicy.digest(a.getString("digest")), name);
        }
        if (release == null) throw new IOException("release has no APK");
        return release;
    }

    static void fetchVerified(Context context, Release release) throws IOException, PackageManager.NameNotFoundException {
        File directory = new File(context.getCacheDir(), "updates");
        Files.createDirectories(directory.toPath());
        File[] old = directory.listFiles((dir, name) -> name.matches("[0-9a-f]{64}\\.apk|fetch-.*\\.apk"));
        if (old != null) for (File file : old) {
            if (System.currentTimeMillis() - file.lastModified() > 7L * 86400000) file.delete();
        }
        File tmp = File.createTempFile("fetch-", ".apk", directory);
        try {
            MessageDigest digest = sha256();
            try (OutputStream file = new FileOutputStream(tmp);
                 DigestOutputStream out = new DigestOutputStream(file, digest)) {
                long count = transfer(UpdatePolicy.apkUrl(release.repo, release.code), out, release.size, false);
                if (!UpdatePolicy.matchesAsset(count, release.size, digest.digest(), release.hash)) {
                    throw new IOException("APK digest or size mismatch");
                }
            }
            if (Thread.currentThread().isInterrupted()) throw new InterruptedIOException();
            PackageManager pm = context.getPackageManager();
            int flags = Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
            PackageInfo self = pm.getPackageInfo(context.getPackageName(), flags);
            PackageInfo apk = pm.getPackageArchiveInfo(tmp.getAbsolutePath(), flags);
            if (apk == null || !UpdatePolicy.allowInstall(self.packageName, version(self), signers(self),
                    apk.packageName, version(apk), signers(apk), release.code)) throw new IOException("APK identity");
            Files.move(tmp.toPath(), new File(directory, release.hash + ".apk").toPath(),
                    StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } finally {
            tmp.delete();
        }
    }

    static long version(PackageInfo info) {
        return Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
    }

    private static List<String> signers(PackageInfo info) {
        Signature[] signatures = Build.VERSION.SDK_INT >= 28
                ? info.signingInfo == null ? null : info.signingInfo.getApkContentsSigners() : info.signatures;
        List<String> hashes = new ArrayList<>();
        if (signatures != null) for (Signature signer : signatures) {
            hashes.add(UpdatePolicy.toHex(sha256().digest(signer.toByteArray())));
        }
        Collections.sort(hashes);
        return hashes;
    }

    private static MessageDigest sha256() {
        try { return MessageDigest.getInstance("SHA-256"); }
        catch (NoSuchAlgorithmException impossible) { throw new AssertionError(impossible); }
    }

    private static long transfer(URL initial, OutputStream out, long limit, boolean metadata) throws IOException {
        URL next = initial;
        long deadline = SystemClock.elapsedRealtime() + (metadata ? 30000 : 120000);
        for (int hop = 0; hop < 6; hop++) {
            checkDeadline(deadline);
            if (!UpdatePolicy.trusted(next, metadata)) throw new IOException("untrusted download origin");
            HttpsURLConnection con = (HttpsURLConnection) next.openConnection();
            try {
                con.setConnectTimeout(8000);
                con.setReadTimeout(12000);
                con.setUseCaches(false);
                con.setInstanceFollowRedirects(false);
                con.setRequestProperty("User-Agent", "BebechDestroyer-Android");
                con.setRequestProperty("Accept-Encoding", "identity");
                if (metadata) {
                    con.setRequestProperty("Accept", "application/vnd.github+json");
                    con.setRequestProperty("X-GitHub-Api-Version", "2022-11-28");
                }
                int status = con.getResponseCode();
                if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                    String location = con.getHeaderField("Location");
                    if (location == null) throw new IOException("missing redirect");
                    next = new URL(next, location);
                    continue;
                }
                if (status != 200 || con.getContentLengthLong() > limit) throw new IOException("download response");
                try (InputStream stream = con.getInputStream()) {
                    int read;
                    long count = 0;
                    byte[] chunk = new byte[16384];
                    while ((read = stream.read(chunk)) != -1) {
                        checkDeadline(deadline);
                        count += read;
                        if (count > limit) throw new IOException("download too large");
                        out.write(chunk, 0, read);
                    }
                    return count;
                }
            } finally {
                con.disconnect();
            }
        }
        throw new IOException("too many redirects");
    }

    private static void checkDeadline(long deadline) throws IOException {
        if (Thread.currentThread().isInterrupted() || SystemClock.elapsedRealtime() > deadline) {
            throw new InterruptedIOException();
        }
    }
}
