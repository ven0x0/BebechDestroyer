package pl.rozstaw.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.WindowInsets;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.window.OnBackInvokedDispatcher;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class TrainingActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/assets/index.html";
    private static final int CREATE_BACKUP = 1;
    private static final int LOAD_BACKUP = 2;
    private static final int CREATE_PLAN = 3;
    private static final int LOAD_PLAN = 4;
    private static final int MAX_BYTES = 16 * 1024 * 1024;
    private final ExecutorService files = Executors.newSingleThreadExecutor();
    private WebView web;
    private AppUpdates updates;
    private boolean pickerActive;
    private boolean pageReady;
    private String pendingImport;
    private boolean pendingPlan;

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    public void onCreate(Bundle state) {
        super.onCreate(state);
        pickerActive = state != null && state.getBoolean("pickerActive");
        FrameLayout frame = new FrameLayout(this);
        frame.setBackgroundColor(Color.rgb(16, 20, 25));
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            frame.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets edges = insets.getInsets(WindowInsets.Type.systemBars()
                        | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(edges.left, edges.top, edges.right, edges.bottom);
                return WindowInsets.CONSUMED;
            });
        }
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(16, 20, 25));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setBlockNetworkLoads(true);
        web.setWebViewClient(new BundledAssets());
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new BackupBridge(), "AndroidBackup");
        updates = new AppUpdates(this);
        web.addJavascriptInterface(updates.new Bridge(), "AndroidUpdates");
        frame.addView(web);
        setContentView(frame);
        web.loadUrl(START);
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        out.putBoolean("pickerActive", pickerActive);
    }

    private final class BundledAssets extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri destination = request.getUrl().buildUpon().fragment(null).build();
            return !request.isForMainFrame() || !START.equals(destination.toString());
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            String path = uri.getPath();
            if (!"https".equals(uri.getScheme()) || !HOST.equals(uri.getAuthority())
                    || !"GET".equals(request.getMethod()) || path == null
                    || !path.startsWith("/assets/") || path.contains("..")
                    || !path.matches("/[A-Za-z0-9._/-]+")) {
                return missing();
            }
            String file = path.substring("/assets/".length());
            try {
                InputStream stream = getAssets().open(file);
                Map<String, String> headers = new HashMap<>();
                headers.put("X-Content-Type-Options", "nosniff");
                headers.put("Content-Security-Policy", "default-src 'self'; "
                        + "script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
                        + "connect-src 'none'; object-src 'none'; frame-src 'none'; "
                        + "form-action 'none'; base-uri 'none'");
                String mime = mimeType(file);
                String encoding = mime.startsWith("text/") || mime.equals("application/javascript")
                        || mime.equals("application/json") ? "UTF-8" : null;
                return new WebResourceResponse(mime, encoding, 200, "OK", headers, stream);
            } catch (IOException error) {
                return missing();
            }
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            if (START.equals(url)) {
                pageReady = true;
                sendPendingImport();
            }
        }
    }

    private static WebResourceResponse missing() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }

    private static String mimeType(String name) {
        String lower = name.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".html")) return "text/html";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".js")) return "application/javascript";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".webmanifest")) return "application/manifest+json";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".ttf")) return "font/ttf";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".woff")) return "font/woff";
        return "application/octet-stream";
    }

    public final class BackupBridge {
        @JavascriptInterface
        public void setLanguage(String language) {
            AppLanguage.set(TrainingActivity.this, language);
        }

        @JavascriptInterface
        public void save(String json) {
            export(json, CREATE_BACKUP);
        }

        @JavascriptInterface
        public void savePlan(String json) {
            export(json, CREATE_PLAN);
        }

        private void export(String json, int request) {
            runOnUiThread(() -> {
                if (pickerActive || isFinishing() || isDestroyed()) return;
                if (json == null || json.length() > MAX_BYTES) {
                    message(AppLanguage.text(TrainingActivity.this, R.string.backup_too_large));
                    return;
                }
                pickerActive = true;
                files.execute(() -> {
                    try {
                        byte[] content = json.getBytes(StandardCharsets.UTF_8);
                        if (content.length > MAX_BYTES) throw new IOException("size");
                        Files.write(exportFile().toPath(), content);
                        runOnUiThread(() -> showPicker(request));
                    } catch (IOException error) {
                        failed(AppLanguage.text(TrainingActivity.this, R.string.backup_prepare_failed));
                    }
                });
            });
        }

        @JavascriptInterface
        public void open() {
            pick(LOAD_BACKUP);
        }

        @JavascriptInterface
        public void openPlan() {
            pick(LOAD_PLAN);
        }

        private void pick(int request) {
            runOnUiThread(() -> {
                if (pickerActive || isFinishing() || isDestroyed()) return;
                pickerActive = true;
                showPicker(request);
            });
        }
    }

    private File exportFile() {
        return new File(getCacheDir(), "rozstaw-export.json");
    }

    private void showPicker(int request) {
        if (isFinishing() || isDestroyed()) return;
        boolean exporting = request == CREATE_BACKUP || request == CREATE_PLAN;
        Intent intent = new Intent(exporting
                ? Intent.ACTION_CREATE_DOCUMENT : Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        if (exporting) {
            intent.setType("application/json");
            String date = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(new Date());
            intent.putExtra(Intent.EXTRA_TITLE, (request == CREATE_PLAN ? "BebechDestroyer-plan-" : "BebechDestroyer-") + date + ".json");
        } else {
            intent.setType("*/*");
        }
        try {
            startActivityForResult(intent, request);
        } catch (ActivityNotFoundException e) {
            failed(AppLanguage.text(TrainingActivity.this, R.string.picker_missing));
        }
    }

    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == AppUpdates.SOURCE_PERMISSION) {
            updates.permissionReturned();
            return;
        }
        boolean exporting = request == CREATE_BACKUP || request == CREATE_PLAN;
        if (!exporting && request != LOAD_BACKUP && request != LOAD_PLAN) return;
        if (result != RESULT_OK || data == null || data.getData() == null) {
            pickerActive = false;
            if (exporting) exportFile().delete();
            return;
        }
        Uri uri = data.getData();
        if (!"content".equals(uri.getScheme())) {
            failed(AppLanguage.text(TrainingActivity.this, R.string.picker_required));
            return;
        }
        files.execute(() -> {
            if (exporting) {
                try {
                    try (OutputStream output = getContentResolver().openOutputStream(uri, "wt")) {
                        if (output == null) throw new IOException("output");
                        Files.copy(exportFile().toPath(), output);
                    }
                    exportFile().delete();
                    runOnUiThread(() -> { pickerActive = false; message(request == CREATE_PLAN ? AppLanguage.text(TrainingActivity.this, R.string.plan_saved) : AppLanguage.text(TrainingActivity.this, R.string.backup_saved)); });
                } catch (IOException | SecurityException e) {
                    failed(AppLanguage.text(TrainingActivity.this, R.string.file_save_failed));
                }
            } else {
                try (InputStream input = getContentResolver().openInputStream(uri)) {
                    if (input == null) throw new IOException("input");
                    ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                    byte[] chunk = new byte[8192];
                    int count;
                    while ((count = input.read(chunk)) != -1) {
                        if (bytes.size() + count > MAX_BYTES) throw new IOException("size");
                        bytes.write(chunk, 0, count);
                    }
                    String content = bytes.toString("UTF-8");
                    runOnUiThread(() -> {
                        pickerActive = false;
                        pendingImport = content;
                        pendingPlan = request == LOAD_PLAN;
                        sendPendingImport();
                    });
                } catch (IOException | SecurityException e) {
                    failed(AppLanguage.text(TrainingActivity.this, R.string.file_read_failed));
                }
            }
        });
    }

    private void sendPendingImport() {
        if (!pageReady || pendingImport == null || isFinishing() || isDestroyed()) return;
        String literal = JSONObject.quote(pendingImport);
        pendingImport = null;
        String callback = pendingPlan ? "window.receivePlanJSON" : "window.receiveBackup";
        web.evaluateJavascript(callback + "(" + literal + ")", null);
    }

    private void failed(String text) {
        runOnUiThread(() -> {
            pickerActive = false;
            if (!isDestroyed()) message(text);
        });
    }

    private void message(String text) {
        Toast.makeText(this, text, Toast.LENGTH_LONG).show();
    }

    private void handleBack() {
        web.evaluateJavascript("typeof window.appBack === 'function' && window.appBack() === true",
                handled -> { if (!"true".equals(handled)) finish(); });
    }

    @Override
    public void onBackPressed() {
        handleBack();
    }

    @Override
    protected void onResume() {
        super.onResume();
        updates.resume();
    }

    @Override
    protected void onPause() {
        updates.pause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        updates.close();
        web.removeJavascriptInterface("AndroidUpdates");
        web.removeJavascriptInterface("AndroidBackup");
        web.destroy();
        files.shutdown();
        super.onDestroy();
    }
}
