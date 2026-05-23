package com.digitalconnections.phonesystem

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.digitalconnections.phonesystem.utils.SettingsManager

class MainActivity : AppCompatActivity() {
    
    private lateinit var settingsManager: SettingsManager
    private lateinit var etPhoneNumber: EditText
    private lateinit var btnCall: Button
    private lateinit var btnSettings: Button
    private lateinit var tvStatus: TextView
    
    companion object {
        private const val PERMISSION_REQUEST_CODE = 1
        private val REQUIRED_PERMISSIONS = arrayOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.MODIFY_AUDIO_SETTINGS
        )
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        settingsManager = SettingsManager(this)
        
        initViews()
        requestPermissions()
        updateStatus()
    }
    
    private fun initViews() {
        etPhoneNumber = findViewById(R.id.et_phone_number)
        btnCall = findViewById(R.id.btn_call)
        btnSettings = findViewById(R.id.btn_settings)
        tvStatus = findViewById(R.id.tv_status)
        
        btnCall.setOnClickListener {
            val phoneNumber = etPhoneNumber.text.toString().trim()
            if (phoneNumber.isNotEmpty()) {
                makeCall(phoneNumber)
            } else {
                Toast.makeText(this, "Please enter a phone number", Toast.LENGTH_SHORT).show()
            }
        }
        
        btnSettings.setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }
    }
    
    private fun requestPermissions() {
        val permissionsToRequest = REQUIRED_PERMISSIONS.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        
        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        }
    }
    
    private fun makeCall(phoneNumber: String) {
        if (!settingsManager.isCurrentProviderConfigured()) {
            Toast.makeText(this, "Please configure your provider settings first", Toast.LENGTH_LONG).show()
            startActivity(Intent(this, SettingsActivity::class.java))
            return
        }
        
        // For now, just show a toast - we'll implement actual calling later
        Toast.makeText(this, "Calling $phoneNumber...", Toast.LENGTH_SHORT).show()
        
        // TODO: Implement actual calling functionality
        // This would integrate with Twilio or MaxoTel based on settings
    }
    
    private fun updateStatus() {
        val provider = settingsManager.getProviderType()
        val isConfigured = settingsManager.isCurrentProviderConfigured()
        
        val status = if (isConfigured) {
            "Ready - Using $provider"
        } else {
            "Not configured - Tap Settings"
        }
        
        tvStatus.text = status
    }
    
    override fun onResume() {
        super.onResume()
        updateStatus()
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            val deniedPermissions = permissions.filterIndexed { index, _ ->
                grantResults[index] != PackageManager.PERMISSION_GRANTED
            }
            
            if (deniedPermissions.isNotEmpty()) {
                Toast.makeText(
                    this,
                    "Some permissions were denied. App may not work properly.",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }
}