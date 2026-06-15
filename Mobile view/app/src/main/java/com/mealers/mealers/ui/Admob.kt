package com.mealers.mealers.ui

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.FrameLayout
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback

object Admob {

    private var mInterstitialAd: InterstitialAd? = null
    private val handler = Handler(Looper.getMainLooper())
    private var isInterstitialTimerRunning = false

    /**
     * Initializes AdMob SDK if IDs are provided.
     * HOW TO USE: Automatically called in MainActivity.onCreate.
     */
    fun init(activity: Activity) {
        if (!isAdmobEnabled()) return
        
        // Initialize the AdMob SDK
        MobileAds.initialize(activity) {}
        
        // Preload the first interstitial ad
        loadInterstitial(activity)
    }

    /**
     * Loads a Banner Ad into the provided FrameLayout container.
     * HOW TO USE: Automatically called in MainActivity.onCreate.
     */
    fun loadBanner(activity: Activity, adContainer: FrameLayout) {
        if (!isAdmobEnabled() || Config.ADMOB_BANNER_ID.isBlank()) {
            adContainer.visibility = View.GONE
            return
        }

        adContainer.visibility = View.VISIBLE
        val adView = AdView(activity)
        adView.adUnitId = Config.ADMOB_BANNER_ID
        adView.setAdSize(AdSize.BANNER)
        
        adContainer.removeAllViews()
        adContainer.addView(adView)
        
        val adRequest = AdRequest.Builder().build()
        adView.loadAd(adRequest)
    }

    /**
     * Starts the periodic display of Interstitial Ads based on Config interval.
     */
    fun startInterstitialTimer(activity: Activity) {
        if (!isAdmobEnabled() || Config.ADMOB_INTERSTITIAL_ID.isBlank()) return
        
        if (isInterstitialTimerRunning) return
        isInterstitialTimerRunning = true

        val intervalMillis = Config.INTERSTITIAL_INTERVAL_SECONDS * 1000L
        
        val runnable = object : Runnable {
            override fun run() {
                showInterstitial(activity)
                handler.postDelayed(this, intervalMillis)
            }
        }
        handler.postDelayed(runnable, intervalMillis)
    }

    fun stopInterstitialTimer() {
        handler.removeCallbacksAndMessages(null)
        isInterstitialTimerRunning = false
    }

    private fun loadInterstitial(activity: Activity) {
        if (!isAdmobEnabled() || Config.ADMOB_INTERSTITIAL_ID.isBlank()) return

        val adRequest = AdRequest.Builder().build()
        InterstitialAd.load(activity, Config.ADMOB_INTERSTITIAL_ID, adRequest,
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(interstitialAd: InterstitialAd) {
                    mInterstitialAd = interstitialAd
                    mInterstitialAd?.fullScreenContentCallback = object : FullScreenContentCallback() {
                        override fun onAdDismissedFullScreenContent() {
                            mInterstitialAd = null
                            loadInterstitial(activity) // Load the next one
                        }

                        override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                            mInterstitialAd = null
                        }
                    }
                }

                override fun onAdFailedToLoad(loadAdError: LoadAdError) {
                    mInterstitialAd = null
                }
            })
    }

    private fun showInterstitial(activity: Activity) {
        if (mInterstitialAd != null) {
            mInterstitialAd?.show(activity)
        } else {
            // Attempt to load if not ready
            loadInterstitial(activity)
        }
    }

    private fun isAdmobEnabled(): Boolean {
        return Config.ADMOB_APP_ID.isNotBlank()
    }
}
