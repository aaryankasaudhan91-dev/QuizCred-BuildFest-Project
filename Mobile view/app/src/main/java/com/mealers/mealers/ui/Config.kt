package com.mealers.mealers.ui

/**
 * CONFIGURATION TEMPLATE
 * Replace the values below to customize your application.
 */
object Config {
    // ==========================================
    // 1. APP MODE CONFIGURATION
    // ==========================================
    // HOW TO REPLACE: 
    // Set to false to load a live website from the internet (Mode 1).
    // Set to true to load from the LOCAL assets folder instead (Mode 2).
    const val USE_LOCAL_ASSETS = true
    
    // ==========================================
    // 2. LIVE URL CONFIGURATION (Used if USE_LOCAL_ASSETS is false)
    // ==========================================
    // HOW TO REPLACE: Replace the string below with your website URL.
    const val LIVE_WEB_URL = "https://www.google.com"

    // ==========================================
    // 3. LOCAL ASSETS CONFIGURATION (Used if USE_LOCAL_ASSETS is true)
    // ==========================================
    // HOW TO REPLACE: Place your frontend files in 'app/src/main/assets/'
    // The default start file is 'index.html'. Change if your entry file is different.
    const val LOCAL_HTML_PATH = "file:///android_asset/index.html"

    // ==========================================
    // 4. ADMOB CONFIGURATION
    // ==========================================
    // HOW TO REPLACE: Put your AdMob App ID here. If you leave it empty (""), Ads are completely disabled.
    // NOTE: You must also update the AdMob App ID in AndroidManifest.xml when publishing.
    const val ADMOB_APP_ID = ""
    
    // HOW TO REPLACE: Put your AdMob Banner Ad Unit ID here.
    // Example test ID: "ca-app-pub-3940256099942544/6300978111"
    const val ADMOB_BANNER_ID = ""
    
    // HOW TO REPLACE: Put your AdMob Interstitial Ad Unit ID here.
    // Example test ID: "ca-app-pub-3940256099942544/1033173712"
    const val ADMOB_INTERSTITIAL_ID = ""
    
    // HOW TO REPLACE: Set the interval (in seconds) to automatically show the interstitial ad.
    // Default is 60 seconds.
    const val INTERSTITIAL_INTERVAL_SECONDS = 60L
}
