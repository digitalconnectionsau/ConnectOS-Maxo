package com.digitalconnections.phonesystem.utils

import android.content.Context
import android.content.SharedPreferences

class SettingsManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    companion object {
        private const val PREFS_NAME = "phone_system_prefs"
        
        // Provider settings
        private const val KEY_PROVIDER_TYPE = "provider_type"
        
        // Twilio settings
        private const val KEY_TWILIO_ACCESS_TOKEN = "twilio_access_token"
        private const val KEY_TWILIO_FROM_NUMBER = "twilio_from_number"
        private const val KEY_TWILIO_ACCOUNT_SID = "twilio_account_sid"
        private const val KEY_TWILIO_API_KEY = "twilio_api_key"
        private const val KEY_TWILIO_API_SECRET = "twilio_api_secret"
        
        // MaxoTel settings
        private const val KEY_MAXOTEL_USERNAME = "maxotel_username"
        private const val KEY_MAXOTEL_PASSWORD = "maxotel_password"
        private const val KEY_MAXOTEL_SERVER = "maxotel_server"
        private const val KEY_MAXOTEL_PORT = "maxotel_port"
        private const val KEY_MAXOTEL_EXTENSION = "maxotel_extension"
        
        // General settings
        private const val KEY_AUTO_ANSWER = "auto_answer"
        private const val KEY_SPEAKER_ENABLED = "speaker_enabled"
        private const val KEY_NOTIFICATIONS_ENABLED = "notifications_enabled"
        
        // API Authentication
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_FIRST_NAME = "user_first_name"
        private const val KEY_USER_LAST_NAME = "user_last_name"
    }
    
    // Provider Type
    fun getProviderType(): String = prefs.getString(KEY_PROVIDER_TYPE, "twilio") ?: "twilio"
    fun setProviderType(type: String) = prefs.edit().putString(KEY_PROVIDER_TYPE, type).apply()
    
    // Twilio Settings
    fun getTwilioAccessToken(): String = prefs.getString(KEY_TWILIO_ACCESS_TOKEN, "") ?: ""
    fun setTwilioAccessToken(token: String) = prefs.edit().putString(KEY_TWILIO_ACCESS_TOKEN, token).apply()
    
    fun getTwilioFromNumber(): String = prefs.getString(KEY_TWILIO_FROM_NUMBER, "") ?: ""
    fun setTwilioFromNumber(number: String) = prefs.edit().putString(KEY_TWILIO_FROM_NUMBER, number).apply()
    
    fun getTwilioAccountSid(): String = prefs.getString(KEY_TWILIO_ACCOUNT_SID, "") ?: ""
    fun setTwilioAccountSid(sid: String) = prefs.edit().putString(KEY_TWILIO_ACCOUNT_SID, sid).apply()
    
    fun getTwilioApiKey(): String = prefs.getString(KEY_TWILIO_API_KEY, "") ?: ""
    fun setTwilioApiKey(key: String) = prefs.edit().putString(KEY_TWILIO_API_KEY, key).apply()
    
    fun getTwilioApiSecret(): String = prefs.getString(KEY_TWILIO_API_SECRET, "") ?: ""
    fun setTwilioApiSecret(secret: String) = prefs.edit().putString(KEY_TWILIO_API_SECRET, secret).apply()
    
    // MaxoTel Settings
    fun getMaxotelUsername(): String = prefs.getString(KEY_MAXOTEL_USERNAME, "") ?: ""
    fun setMaxotelUsername(username: String) = prefs.edit().putString(KEY_MAXOTEL_USERNAME, username).apply()
    
    fun getMaxotelPassword(): String = prefs.getString(KEY_MAXOTEL_PASSWORD, "") ?: ""
    fun setMaxotelPassword(password: String) = prefs.edit().putString(KEY_MAXOTEL_PASSWORD, password).apply()
    
    fun getMaxotelServer(): String = prefs.getString(KEY_MAXOTEL_SERVER, "") ?: ""
    fun setMaxotelServer(server: String) = prefs.edit().putString(KEY_MAXOTEL_SERVER, server).apply()
    
    fun getMaxotelPort(): Int = prefs.getInt(KEY_MAXOTEL_PORT, 5060)
    fun setMaxotelPort(port: Int) = prefs.edit().putInt(KEY_MAXOTEL_PORT, port).apply()
    
    fun getMaxotelExtension(): String = prefs.getString(KEY_MAXOTEL_EXTENSION, "") ?: ""
    fun setMaxotelExtension(extension: String) = prefs.edit().putString(KEY_MAXOTEL_EXTENSION, extension).apply()
    
    // General Settings
    fun isAutoAnswerEnabled(): Boolean = prefs.getBoolean(KEY_AUTO_ANSWER, false)
    fun setAutoAnswerEnabled(enabled: Boolean) = prefs.edit().putBoolean(KEY_AUTO_ANSWER, enabled).apply()
    
    fun isSpeakerEnabled(): Boolean = prefs.getBoolean(KEY_SPEAKER_ENABLED, false)
    fun setSpeakerEnabled(enabled: Boolean) = prefs.edit().putBoolean(KEY_SPEAKER_ENABLED, enabled).apply()
    
    fun areNotificationsEnabled(): Boolean = prefs.getBoolean(KEY_NOTIFICATIONS_ENABLED, true)
    fun setNotificationsEnabled(enabled: Boolean) = prefs.edit().putBoolean(KEY_NOTIFICATIONS_ENABLED, enabled).apply()
    
    // Validation methods
    fun isTwilioConfigured(): Boolean {
        return getTwilioAccessToken().isNotEmpty() && getTwilioFromNumber().isNotEmpty()
    }
    
    fun isMaxotelConfigured(): Boolean {
        return getMaxotelUsername().isNotEmpty() && 
               getMaxotelPassword().isNotEmpty() && 
               getMaxotelServer().isNotEmpty() &&
               getMaxotelExtension().isNotEmpty()
    }
    
    fun isCurrentProviderConfigured(): Boolean {
        return when (getProviderType()) {
            "twilio" -> isTwilioConfigured()
            "maxotel" -> isMaxotelConfigured()
            else -> false
        }
    }
    
    // API Authentication methods
    fun saveAuthToken(token: String) = prefs.edit().putString(KEY_AUTH_TOKEN, token).apply()
    fun getAuthToken(): String? = prefs.getString(KEY_AUTH_TOKEN, null)
    
    fun saveServerUrl(url: String) = prefs.edit().putString(KEY_SERVER_URL, url).apply()
    fun getServerUrl(): String = prefs.getString(KEY_SERVER_URL, "https://digital-connections-crm-production.up.railway.app/") ?: 
                                 "https://digital-connections-crm-production.up.railway.app/"
    
    fun saveUserInfo(userId: String, email: String, firstName: String, lastName: String) {
        prefs.edit().apply {
            putString(KEY_USER_ID, userId)
            putString(KEY_USER_EMAIL, email)
            putString(KEY_USER_FIRST_NAME, firstName)
            putString(KEY_USER_LAST_NAME, lastName)
            apply()
        }
    }
    
    fun getUserId(): String? = prefs.getString(KEY_USER_ID, null)
    fun getUserEmail(): String? = prefs.getString(KEY_USER_EMAIL, null)
    fun getUserFirstName(): String? = prefs.getString(KEY_USER_FIRST_NAME, null)
    fun getUserLastName(): String? = prefs.getString(KEY_USER_LAST_NAME, null)
    
    fun isLoggedIn(): Boolean = !getAuthToken().isNullOrEmpty()
    
    fun logout() {
        prefs.edit().apply {
            remove(KEY_AUTH_TOKEN)
            remove(KEY_USER_ID)
            remove(KEY_USER_EMAIL)
            remove(KEY_USER_FIRST_NAME)
            remove(KEY_USER_LAST_NAME)
            apply()
        }
    }
}