package com.digitalconnections.phonesystem.viewmodel

import android.content.Context
import android.media.AudioManager
import android.os.Handler
import android.os.Looper
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.digitalconnections.phonesystem.service.VoiceService

class CallViewModel : ViewModel() {
    
    private val _callStatus = MutableLiveData<String>()
    val callStatus: LiveData<String> = _callStatus
    
    private val _isMuted = MutableLiveData<Boolean>(false)
    val isMuted: LiveData<Boolean> = _isMuted
    
    private val _isSpeakerOn = MutableLiveData<Boolean>(false)
    val isSpeakerOn: LiveData<Boolean> = _isSpeakerOn
    
    private val _isOnHold = MutableLiveData<Boolean>(false)
    val isOnHold: LiveData<Boolean> = _isOnHold
    
    private val _callDuration = MutableLiveData<Long>(0)
    val callDuration: LiveData<Long> = _callDuration
    
    private var voiceService: VoiceService? = null
    private var audioManager: AudioManager? = null
    private var callStartTime: Long = 0
    private var durationHandler: Handler? = null
    private var durationRunnable: Runnable? = null
    
    fun makeCall(context: Context, phoneNumber: String) {
        audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        
        voiceService = VoiceService(context) { status ->
            _callStatus.postValue(status)
            
            if (status.contains("connected", ignoreCase = true)) {
                startDurationTimer()
            }
        }
        
        val success = voiceService?.makeCall(phoneNumber) ?: false
        if (!success) {
            _callStatus.postValue("Call failed")
        }
    }
    
    private fun startDurationTimer() {
        callStartTime = System.currentTimeMillis()
        durationHandler = Handler(Looper.getMainLooper())
        
        durationRunnable = object : Runnable {
            override fun run() {
                val duration = (System.currentTimeMillis() - callStartTime) / 1000
                _callDuration.postValue(duration)
                durationHandler?.postDelayed(this, 1000)
            }
        }
        
        durationHandler?.post(durationRunnable!!)
    }
    
    private fun stopDurationTimer() {
        durationHandler?.removeCallbacks(durationRunnable!!)
        durationHandler = null
        durationRunnable = null
    }
    
    fun hangupCall() {
        voiceService?.hangupCall()
        stopDurationTimer()
        _callStatus.postValue("Call ended")
    }
    
    fun toggleMute() {
        val currentMuted = _isMuted.value ?: false
        val newMuted = !currentMuted
        
        voiceService?.muteCall(newMuted)
        _isMuted.postValue(newMuted)
    }
    
    fun toggleSpeaker() {
        audioManager?.let { am ->
            val currentSpeaker = _isSpeakerOn.value ?: false
            val newSpeaker = !currentSpeaker
            
            am.isSpeakerphoneOn = newSpeaker
            _isSpeakerOn.postValue(newSpeaker)
            
            // Adjust audio mode
            if (newSpeaker) {
                am.mode = AudioManager.MODE_IN_COMMUNICATION
            } else {
                am.mode = AudioManager.MODE_IN_CALL
            }
        }
    }
    
    fun toggleHold() {
        val currentHold = _isOnHold.value ?: false
        val newHold = !currentHold
        
        voiceService?.holdCall(newHold)
        _isOnHold.postValue(newHold)
        
        if (newHold) {
            stopDurationTimer()
            _callStatus.postValue("Call on hold")
        } else {
            startDurationTimer()
            _callStatus.postValue("Connected")
        }
    }
    
    fun sendDTMF(digit: String) {
        // DTMF functionality would be implemented here
        // This depends on the Twilio SDK capabilities
        _callStatus.postValue("Sent: $digit")
    }
    
    override fun onCleared() {
        super.onCleared()
        stopDurationTimer()
        voiceService?.cleanup()
        
        // Reset audio settings
        audioManager?.let { am ->
            am.isSpeakerphoneOn = false
            am.mode = AudioManager.MODE_NORMAL
        }
    }
}