package pl.rozstaw.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import java.util.Locale;

final class AppLanguage {
    private AppLanguage() {}

    static void set(Context context, String language) {
        if (!"pl".equals(language) && !"en".equals(language)) return;
        SharedPreferences preferences = context.getSharedPreferences("app-language", Context.MODE_PRIVATE);
        if (!language.equals(preferences.getString("language", "pl"))) {
            preferences.edit().putString("language", language).apply();
        }
    }

    static String text(Context context, int resource) {
        String language = context.getSharedPreferences("app-language", Context.MODE_PRIVATE)
                .getString("language", "pl");
        Configuration config = new Configuration(context.getResources().getConfiguration());
        config.setLocale(Locale.forLanguageTag(language));
        return context.createConfigurationContext(config).getString(resource);
    }
}
