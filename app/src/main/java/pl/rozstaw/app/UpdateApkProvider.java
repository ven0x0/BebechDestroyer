package pl.rozstaw.app;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;

/** Grants the Android package installer temporary, read-only access to one private, verified APK. */
public final class UpdateApkProvider extends ContentProvider {
    static final String AUTHORITY = "pl.rozstaw.app.updates";

    @Override public boolean onCreate() { return true; }

    @Override public String getType(Uri uri) {
        checkPath(uri);
        return "application/vnd.android.package-archive";
    }

    private static String checkPath(Uri uri) {
        if (!AUTHORITY.equals(uri.getAuthority()) || !"content".equals(uri.getScheme())
                || uri.getQuery() != null || uri.getFragment() != null) {
            throw new IllegalArgumentException("Unknown update");
        }
        String digest = uri.getLastPathSegment();
        if (!UpdatePolicy.validHex(digest) || !("/" + digest).equals(uri.getEncodedPath())) {
            throw new IllegalArgumentException("Unknown update");
        }
        return digest;
    }

    private File file(Uri uri) {
        return new File(new File(getContext().getCacheDir(), "updates"), checkPath(uri) + ".apk");
    }

    @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        if (!"r".equals(mode)) throw new FileNotFoundException("Read only");
        return ParcelFileDescriptor.open(file(uri), ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override public Cursor query(Uri uri, String[] projection, String selection, String[] args, String order) {
        File apk = file(uri);
        String[] cols = projection == null ? new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE}
                : projection;
        MatrixCursor cursor = new MatrixCursor(cols);
        if (apk.isFile()) {
            Object[] values = new Object[cols.length];
            for (int i = 0; i < cols.length; i++) {
                if (OpenableColumns.DISPLAY_NAME.equals(cols[i])) values[i] = UpdatePolicy.ASSET;
                if (OpenableColumns.SIZE.equals(cols[i])) values[i] = apk.length();
            }
            cursor.addRow(values);
        }
        return cursor;
    }

    @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException(); }
    @Override public int delete(Uri uri, String selection, String[] args) { throw new UnsupportedOperationException(); }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] args) {
        throw new UnsupportedOperationException();
    }
}
