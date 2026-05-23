package com.digitalconnections.phonesystem

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.digitalconnections.phonesystem.utils.SettingsManager

class SettingsActivity : AppCompatActivity() {
    
    private lateinit var settingsManager: SettingsManager
    private lateinit var rgProvider: RadioGroup
    private lateinit var rbTwilio: RadioButton
    private lateinit var rbMaxotel: RadioButton
    private lateinit var etTwilioAccountSid: EditText
    private lateinit var etTwilioAuthToken: EditText
    private lateinit var etTwilioPhoneNumber: EditText
    private lateinit var btnSave: Button
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)
        
        settingsManager = SettingsManager(this)
        
        initViews()
        loadSettings()
    }
    
    private fun initViews() {
        rgProvider = findViewById(R.id.rg_provider)
        rbTwilio = findViewById(R.id.rb_twilio)
        rbMaxotel = findViewById(R.id.rb_maxotel)
        etTwilioAccountSid = findViewById(R.id.et_twilio_account_sid)
        etTwilioAuthToken = findViewById(R.id.et_twilio_auth_token)
        etTwilioPhoneNumber = findViewById(R.id.et_twilio_phone_number)
        btnSave = findViewById(R.id.btn_save_settings)
        
        btnSave.setOnClickListener {
            saveSettings()
        }
        
        rgProvider.setOnCheckedChangeListener { _, checkedId ->
            when (checkedId) {
                R.id.rb_twilio -> showTwilioSettings()
                R.id.rb_maxotel -> showMaxotelSettings()
            }
        }
    }
    
    private fun loadSettings() {
        val provider = settingsManager.getProviderType()
        when (provider) {
            "twilio" -> {
                rbTwilio.isChecked = true
                showTwilioSettings()
                etTwilioAccountSid.setText(settingsManager.getTwilioAccountSid())
                etTwilioAuthToken.setText(settingsManager.getTwilioApiSecret())
                etTwilioPhoneNumber.setText(settingsManager.getTwilioFromNumber())
            }
            "maxotel" -> {
                rbMaxotel.isChecked = true
                showMaxotelSettings()
            }
        }
    }
    
    private fun showTwilioSettings() {
        // For now, Twilio settings are always visible
        // In a full implementation, we'd show/hide different setting groups
    }
    
    private fun showMaxotelSettings() {
        // MaxoTel settings would be shown here
        Toast.makeText(this, "MaxoTel configuration coming soon", Toast.LENGTH_SHORT).show()
    }
    
    private fun saveSettings() {
        val selectedProvider = if (rbTwilio.isChecked) "twilio" else "maxotel"
        settingsManager.setProviderType(selectedProvider)
        
        if (selectedProvider == "twilio") {
            val accountSid = etTwilioAccountSid.text.toString().trim()
            val authToken = etTwilioAuthToken.text.toString().trim()
            val phoneNumber = etTwilioPhoneNumber.text.toString().trim()
            
            if (accountSid.isEmpty() || authToken.isEmpty() || phoneNumber.isEmpty()) {
                Toast.makeText(this, "Please fill in all Twilio fields", Toast.LENGTH_SHORT).show()
                return
            }
            
            settingsManager.setTwilioAccountSid(accountSid)
            settingsManager.setTwilioApiSecret(authToken)
            settingsManager.setTwilioFromNumber(phoneNumber)
            
            Toast.makeText(this, "Twilio settings saved!", Toast.LENGTH_SHORT).show()
        }
        
        finish()
    }
}