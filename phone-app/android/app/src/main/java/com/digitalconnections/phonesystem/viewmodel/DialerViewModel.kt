package com.digitalconnections.phonesystem.viewmodel

import android.content.Context
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.digitalconnections.phonesystem.service.VoiceService
import com.digitalconnections.phonesystem.utils.SettingsManager

class DialerViewModel : ViewModel() {
    
    private val _phoneNumber = MutableLiveData<String>("")
    val phoneNumber: LiveData<String> = _phoneNumber
    
    private val _connectionStatus = MutableLiveData<String>("Disconnected")
    val connectionStatus: LiveData<String> = _connectionStatus
    
    private var voiceService: VoiceService? = null
    
    fun addDigit(digit: String) {
        val current = _phoneNumber.value ?: ""
        _phoneNumber.value = current + digit
    }
    
    fun deleteDigit() {
        val current = _phoneNumber.value ?: ""
        if (current.isNotEmpty()) {
            _phoneNumber.value = current.dropLast(1)
        }
    }
    
    fun clearNumber() {
        _phoneNumber.value = ""
    }
    
    fun initializeVoiceService(context: Context) {
        voiceService = VoiceService(context) { status ->
            _connectionStatus.postValue(status)
        }
        
        val settingsManager = SettingsManager(context)
        val providerType = settingsManager.getProviderType()
        
        when (providerType) {
            "twilio" -> initializeTwilioService(context)
            "maxotel" -> initializeMaxotelService(context)
            else -> _connectionStatus.postValue("No provider configured")
        }
    }
    
    private fun initializeTwilioService(context: Context) {
        _connectionStatus.postValue("Connecting to Twilio...")
        voiceService?.initializeTwilio()
    }
    
    private fun initializeMaxotelService(context: Context) {
        _connectionStatus.postValue("Connecting to MaxoTel...")
        voiceService?.initializeMaxotel()
    }
    
    fun refreshConnection() {
        voiceService?.let { service ->
            val context = service.context
            initializeVoiceService(context)
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        voiceService?.cleanup()
    }
}