package pl.rozstaw.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.widget.EditText;
import android.widget.Toast;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/** All UI and state below are confined to the main thread. Background jobs return through that thread. */
final class AppUpdates {
    static final int SOURCE_PERMISSION = 602;
    private static final long PERIOD = 15 * 60_000L;
    private final Activity activity;
    private final SharedPreferences prefs;
    private final String bakedChannel;
    private final Handler ui = new Handler(Looper.getMainLooper());
    private final ExecutorService network = Executors.newSingleThreadExecutor();
    private final Runnable poll = this::poll;
    private boolean resumed;
    private boolean closed;
    private boolean checking;
    private boolean manual;
    private long lastAttempt = -PERIOD;
    private long generation;
    private Future<?> job;
    private AlertDialog dialog;
    private ReleaseDownload.Release offer;
    private ReleaseDownload.Release pendingPermission;
    private ReleaseDownload.Release ready;

    AppUpdates(Activity activity) {
        this.activity = activity;
        prefs = activity.getSharedPreferences("release-updates", Context.MODE_PRIVATE);
        int id = activity.getResources().getIdentifier("update_repository", "string", activity.getPackageName());
        bakedChannel = id == 0 ? "" : activity.getString(id).trim();
    }

    public final class Bridge {
        @JavascriptInterface public void check() { ui.post(() -> checkForRelease(true)); }
        @JavascriptInterface public void configure() { ui.post(() -> configureChannel()); }
    }

    private String channel() {
        return bakedChannel.isEmpty() ? prefs.getString("repository", "") : bakedChannel;
    }

    void resume() {
        resumed = true;
        if (ready != null) {
            ReleaseDownload.Release apk = ready;
            ready = null;
            install(apk);
        } else if (offer != null && dialog == null) {
            showOffer();
        }
        poll();
    }

    private void poll() {
        ui.removeCallbacks(poll);
        if (!resumed || closed) return;
        if (SystemClock.elapsedRealtime() - lastAttempt >= PERIOD) checkForRelease(false);
        ui.postDelayed(poll, PERIOD);
    }

    void pause() {
        resumed = false;
        ui.removeCallbacks(poll);
    }

    void close() {
        closed = true;
        resumed = false;
        generation++;
        ui.removeCallbacks(poll);
        if (job != null) job.cancel(true);
        if (dialog != null) dialog.dismiss();
        network.shutdownNow();
    }

    private boolean visible() {
        return resumed && !closed && !activity.isFinishing() && !activity.isDestroyed();
    }

    private void configureChannel() {
        if (!visible() || dialog != null || pendingPermission != null || ready != null || checking || job != null) return;
        if (!bakedChannel.isEmpty()) {
            show(new AlertDialog.Builder(activity).setTitle(AppLanguage.text(activity, R.string.update_channel))
                    .setMessage("GitHub · " + bakedChannel)
                    .setPositiveButton(AppLanguage.text(activity, R.string.check_now), (d,w) -> ui.post(() -> checkForRelease(true)))
                    .setNegativeButton(AppLanguage.text(activity, R.string.close), null).create());
            return;
        }
        EditText field = new EditText(activity);
        field.setSingleLine(true);
        field.setHint(AppLanguage.text(activity, R.string.repo_hint));
        field.setText(channel());
        field.setSelectAllOnFocus(true);
        AlertDialog form = new AlertDialog.Builder(activity).setTitle(AppLanguage.text(activity, R.string.update_repo))
                .setMessage(AppLanguage.text(activity, R.string.repo_description))
                .setView(field).setPositiveButton(AppLanguage.text(activity, R.string.save), null).setNegativeButton(AppLanguage.text(activity, R.string.cancel), null).create();
        show(form);
        form.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String repo = field.getText().toString().trim();
            if (!UpdatePolicy.validRepository(repo)) {
                field.setError(AppLanguage.text(activity, R.string.repo_invalid));
                return;
            }
            prefs.edit().putString("repository", repo).remove("laterCode").remove("laterAt").apply();
            offer = null;
            form.dismiss();
            ui.post(() -> checkForRelease(true));
        });
    }

    private void checkForRelease(boolean explicit) {
        if (!visible()) return;
        if (checking) {
            if (explicit) manual = true;
            return;
        }
        if (dialog != null || pendingPermission != null || job != null || ready != null) return;
        String repo = channel();
        if (repo == null || repo.isEmpty()) {
            if (explicit) configureChannel();
            return;
        }
        if (offer != null) {
            showOffer();
            return;
        }
        checking = true;
        manual = explicit;
        lastAttempt = SystemClock.elapsedRealtime();
        long token = ++generation;
        network.execute(() -> {
            try {
                ReleaseDownload.Release found = ReleaseDownload.latest(repo);
                long installed = installedVersion();
                ui.post(() -> {
                    if (closed || generation != token) return;
                    checking = false;
                    if (found.code <= installed) {
                        if (manual && visible()) message(AppLanguage.text(activity, R.string.up_to_date));
                        return;
                    }
                    if (!manual && prefs.getInt("laterCode", 0) == found.code
                            && System.currentTimeMillis() < prefs.getLong("laterAt", 0)) return;
                    offer = found;
                    if (visible()) showOffer();
                });
            } catch (Exception error) {
                ui.post(() -> {
                    if (closed || generation != token) return;
                    checking = false;
                    if (manual && visible()) message(AppLanguage.text(activity, R.string.release_read_failed));
                });
            }
        });
    }

    private long installedVersion() throws PackageManager.NameNotFoundException {
        PackageInfo app = activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0);
        return ReleaseDownload.version(app);
    }

    private void showOffer() {
        if (!visible() || dialog != null || offer == null) return;
        final ReleaseDownload.Release update = offer;
        offer = null;
        AlertDialog view = new AlertDialog.Builder(activity).setTitle(AppLanguage.text(activity, R.string.update_available))
                .setMessage(update.name + "\nGitHub · " + update.repo + "\n\n" + AppLanguage.text(activity, R.string.update_prompt))
                .setPositiveButton(AppLanguage.text(activity, R.string.download), (d, w) -> ui.post(() -> authorize(update)))
                .setNegativeButton(AppLanguage.text(activity, R.string.later), (d, w) -> later(update)).create();
        view.setOnCancelListener(d -> later(update));
        show(view);
    }

    private void later(ReleaseDownload.Release update) {
        prefs.edit().putInt("laterCode", update.code)
                .putLong("laterAt", System.currentTimeMillis() + 24 * 60 * 60_000L).apply();
    }

    private void authorize(ReleaseDownload.Release update) {
        if (!visible()) return;
        if (activity.getPackageManager().canRequestPackageInstalls()) {
            download(update);
            return;
        }
        AlertDialog permission = new AlertDialog.Builder(activity).setTitle(AppLanguage.text(activity, R.string.permission_title))
                .setMessage(AppLanguage.text(activity, R.string.permission_prompt))
                .setPositiveButton(AppLanguage.text(activity, R.string.android_settings), (d,w) -> {
                    try {
                        pendingPermission = update;
                        activity.startActivityForResult(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                Uri.parse("package:" + activity.getPackageName())), SOURCE_PERMISSION);
                    } catch (ActivityNotFoundException | SecurityException e) {
                        pendingPermission = null;
                        message(AppLanguage.text(activity, R.string.settings_failed));
                    }
                }).setNegativeButton(AppLanguage.text(activity, R.string.cancel), null).create();
        show(permission);
    }

    void permissionReturned() {
        ReleaseDownload.Release update = pendingPermission;
        pendingPermission = null;
        if (update == null || closed) return;
        if (!activity.getPackageManager().canRequestPackageInstalls()) {
            message(AppLanguage.text(activity, R.string.permission_required));
            return;
        }
        // onActivityResult can precede onResume. The check+download resume only with the Activity visible.
        ui.post(() -> {
            if (visible()) download(update);
            else offer = update;
        });
    }

    private void download(ReleaseDownload.Release update) {
        if (!visible() || job != null) return;
        long token = ++generation;
        AlertDialog progress = new AlertDialog.Builder(activity).setTitle(AppLanguage.text(activity, R.string.update_downloading))
                .setMessage(update.name + "\n" + AppLanguage.text(activity, R.string.checking_signature))
                .setNegativeButton(AppLanguage.text(activity, R.string.cancel), (d,w) -> cancelDownload()).create();
        progress.setOnCancelListener(d -> cancelDownload());
        show(progress);
        job = network.submit(() -> {
            try {
                ReleaseDownload.fetchVerified(activity.getApplicationContext(), update);
                ui.post(() -> {
                    if (closed || token != generation) return;
                    job = null;
                    progress.dismiss();
                    if (visible()) install(update);
                    else ready = update;
                });
            } catch (Exception error) {
                ui.post(() -> {
                    if (closed || token != generation) return;
                    job = null;
                    progress.dismiss();
                    if (visible()) message(AppLanguage.text(activity, R.string.apk_invalid));
                });
            }
        });
    }

    private void cancelDownload() {
        generation++;
        if (job != null) job.cancel(true);
        job = null;
    }

    private void install(ReleaseDownload.Release update) {
        if (!visible()) return;
        try {
            if (installedVersion() >= update.code) return;
            if (!activity.getPackageManager().canRequestPackageInstalls()) {
                message(AppLanguage.text(activity, R.string.installer_denied));
                return;
            }
            Uri uri = new Uri.Builder().scheme("content").authority(UpdateApkProvider.AUTHORITY)
                    .appendPath(update.hash).build();
            Intent intent = new Intent(Intent.ACTION_INSTALL_PACKAGE, uri);
            intent.setClipData(ClipData.newRawUri(UpdatePolicy.ASSET, uri));
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(intent);
        } catch (ActivityNotFoundException | SecurityException | PackageManager.NameNotFoundException e) {
            message(AppLanguage.text(activity, R.string.installer_missing));
        }
    }

    private void show(AlertDialog view) {
        dialog = view;
        view.setOnDismissListener(d -> { if (dialog == view) dialog = null; });
        view.show();
    }

    private void message(String text) {
        Toast.makeText(activity, text, Toast.LENGTH_LONG).show();
    }
}
