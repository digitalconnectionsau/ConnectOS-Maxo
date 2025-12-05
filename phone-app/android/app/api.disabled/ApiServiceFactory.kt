package com.digitalconnections.phonesystem.api

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor

/**
 * API service factory for connecting to the web platform
 * Handles authentication and API communication
 */
object ApiServiceFactory {
    
    private const val DEFAULT_BASE_URL = "https://digital-connections-crm-production.up.railway.app/"
    
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }
    
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .build()
    
    fun createApiService(baseUrl: String = DEFAULT_BASE_URL): PhoneSystemApi {
        val retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .addConverterFactory(GsonConverterFactory.create())
            .client(okHttpClient)
            .build()
        
        return retrofit.create(PhoneSystemApi::class.java)
    }
}

/**
 * Repository for managing API calls and local storage
 */
class PhoneSystemRepository(
    private val api: PhoneSystemApi,
    private val settingsManager: SettingsManager
) {
    
    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            val response = api.login(LoginRequest(email, password))
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                // Store auth token locally
                settingsManager.saveAuthToken(loginResponse.token)
                settingsManager.saveUserInfo(loginResponse.user)
                Result.success(loginResponse)
            } else {
                Result.failure(Exception("Login failed: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getTwilioToken(userId: String): Result<TwilioTokenResponse> {
        val authToken = settingsManager.getAuthToken()
        if (authToken.isNullOrEmpty()) {
            return Result.failure(Exception("Not authenticated"))
        }
        
        return try {
            val response = api.getTwilioToken("Bearer $authToken", TokenRequest(userId))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Token request failed: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun makeCall(phoneNumber: String, contactName: String? = null): Result<CallResponse> {
        val authToken = settingsManager.getAuthToken()
        if (authToken.isNullOrEmpty()) {
            return Result.failure(Exception("Not authenticated"))
        }
        
        return try {
            val response = api.makeCall("Bearer $authToken", CallRequest(phoneNumber, contactName))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Call failed: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getContacts(): Result<List<Contact>> {
        val authToken = settingsManager.getAuthToken()
        if (authToken.isNullOrEmpty()) {
            return Result.failure(Exception("Not authenticated"))
        }
        
        return try {
            val response = api.getContacts("Bearer $authToken")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch contacts: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getWalletBalance(): Result<WalletBalance> {
        val authToken = settingsManager.getAuthToken()
        if (authToken.isNullOrEmpty()) {
            return Result.failure(Exception("Not authenticated"))
        }
        
        return try {
            val response = api.getWalletBalance("Bearer $authToken")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch balance: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}