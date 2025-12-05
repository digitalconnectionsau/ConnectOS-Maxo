package com.digitalconnections.phonesystem.service

import android.content.Context
import android.util.Log
import com.digitalconnections.phonesystem.utils.SettingsManager
import com.twilio.voice.*
import org.json.JSONObject
import java.util.*

class VoiceService(
    val context: Context,
    private val statusCallback: (String) -> Unit
) {
    private val TAG = "VoiceService"
    private var call: Call? = null
    private var settingsManager = SettingsManager(context)
    
    private val callListener = object : Call.Listener {
        override fun onConnectFailure(call: Call, callException: CallException) {
            Log.e(TAG, "Call failed: ${callException.message}")
            statusCallback("Call failed: ${callException.message}")
            this@VoiceService.call = null
        }

        override fun onConnected(call: Call) {
            Log.i(TAG, "Call connected")
            statusCallback("Call connected")
        }

        override fun onDisconnected(call: Call, callException: CallException?) {
            Log.i(TAG, "Call disconnected")
            statusCallback("Call disconnected")
            this@VoiceService.call = null
        }

        override fun onReconnecting(call: Call, callException: CallException) {
            Log.i(TAG, "Call reconnecting")
            statusCallback("Reconnecting...")
        }

        override fun onReconnected(call: Call) {
            Log.i(TAG, "Call reconnected")
            statusCallback("Call reconnected")
        }
    }
    
    fun initializeTwilio() {
        try {
            val accessToken = getTwilioAccessToken()
            if (accessToken.isNotEmpty()) {
                Voice.register(accessToken, Voice.RegistrationChannel.FCM, null, registrationListener)
                statusCallback("Connecting to Twilio...")
            } else {
                statusCallback("Twilio token not configured")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Twilio", e)
            statusCallback("Twilio initialization failed")
        }
    }
    
    fun initializeMaxotel() {
        try {
            val username = settingsManager.getMaxotelUsername()
            val password = settingsManager.getMaxotelPassword()
            val server = settingsManager.getMaxotelServer()
            
            if (username.isNotEmpty() && password.isNotEmpty() && server.isNotEmpty()) {
                // For MaxoTel, we'll use SIP credentials to generate a Twilio-compatible token
                val accessToken = generateMaxotelToken(username, password, server)
                Voice.register(accessToken, Voice.RegistrationChannel.FCM, null, registrationListener)
                statusCallback("Connecting to MaxoTel PBX...")
            } else {
                statusCallback("MaxoTel credentials not configured")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize MaxoTel", e)
            statusCallback("MaxoTel initialization failed")
        }
    }
    
    private val registrationListener = object : RegistrationListener {
        override fun onRegistered(accessToken: String, fcmToken: String) {
            Log.i(TAG, "Successfully registered for VoIP calls")
            statusCallback("Connected")
        }

        override fun onError(registrationException: RegistrationException, accessToken: String, fcmToken: String) {
            Log.e(TAG, "Registration error: ${registrationException.message}")
            statusCallback("Connection failed: ${registrationException.message}")
        }
    }
    
    fun makeCall(phoneNumber: String): Boolean {
        return try {
            val providerType = settingsManager.getProviderType()
            val params = when (providerType) {
                "twilio" -> createTwilioCallParams(phoneNumber)
                "maxotel" -> createMaxotelCallParams(phoneNumber)
                else -> {
                    statusCallback("No provider configured")
                    return false
                }
            }
            
            val accessToken = when (providerType) {
                "twilio" -> getTwilioAccessToken()
                "maxotel" -> generateMaxotelToken(
                    settingsManager.getMaxotelUsername(),
                    settingsManager.getMaxotelPassword(),
                    settingsManager.getMaxotelServer()
                )
                else -> ""
            }
            
            if (accessToken.isEmpty()) {
                statusCallback("Access token not available")
                return false
            }
            
            call = Voice.call(context, accessToken, params, callListener)
            statusCallback("Calling $phoneNumber...")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to make call", e)
            statusCallback("Call failed: ${e.message}")
            false
        }
    }
    
    private fun createTwilioCallParams(phoneNumber: String): Map<String, String> {
        return mapOf(
            "To" to phoneNumber,
            "From" to settingsManager.getTwilioFromNumber()
        )
    }
    
    private fun createMaxotelCallParams(phoneNumber: String): Map<String, String> {
        return mapOf(
            "To" to phoneNumber,
            "From" to settingsManager.getMaxotelExtension(),
            "Provider" to "maxotel"
        )
    }
    
    private fun getTwilioAccessToken(): String {
        // In a real app, this should fetch the token from your server
        // For now, return the stored token from settings
        return settingsManager.getTwilioAccessToken()
    }
    
    private fun generateMaxotelToken(username: String, password: String, server: String): String {
        // In a real implementation, you would call your backend API
        // to generate a Twilio-compatible token that routes through MaxoTel
        // For now, we'll create a basic token structure
        
        val tokenData = JSONObject().apply {
            put("username", username)
            put("password", password)
            put("server", server)
            put("provider", "maxotel")
            put("timestamp", System.currentTimeMillis())
        }
        
        // This should be replaced with actual token generation from your backend
        return Base64.getEncoder().encodeToString(tokenData.toString().toByteArray())
    }
    
    fun hangupCall() {
        call?.disconnect()
        call = null
        statusCallback("Call ended")
    }
    
    fun muteCall(muted: Boolean) {
        call?.mute(muted)
    }
    
    fun holdCall(onHold: Boolean) {
        call?.hold(onHold)
    }
    
    fun isCallActive(): Boolean {
        return call != null
    }
    
    fun cleanup() {
        call?.disconnect()
        call = null
        Voice.unregister(getTwilioAccessToken(), Voice.RegistrationChannel.FCM, null, object : UnregistrationListener {
            override fun onUnregistered(accessToken: String, fcmToken: String) {
                Log.i(TAG, "Unregistered from voice calls")
            }

            override fun onError(registrationException: RegistrationException, accessToken: String, fcmToken: String) {
                Log.e(TAG, "Unregistration error: ${registrationException.message}")
            }
        })
    }
}