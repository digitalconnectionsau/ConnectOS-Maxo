package com.digitalconnections.phonesystem.api

import retrofit2.Response
import retrofit2.http.*

/**
 * API interface for connecting Android app to web platform
 * This allows the app to use existing Twilio configuration and billing
 */
interface PhoneSystemApi {
    
    @POST("api/auth/login")
    suspend fun login(
        @Body credentials: LoginRequest
    ): Response<LoginResponse>
    
    @POST("api/twilio/token")
    suspend fun getTwilioToken(
        @Header("Authorization") authToken: String,
        @Body request: TokenRequest
    ): Response<TwilioTokenResponse>
    
    @POST("api/calls/make")
    suspend fun makeCall(
        @Header("Authorization") authToken: String,
        @Body request: CallRequest
    ): Response<CallResponse>
    
    @GET("api/contacts")
    suspend fun getContacts(
        @Header("Authorization") authToken: String
    ): Response<List<Contact>>
    
    @GET("api/calls")
    suspend fun getCallHistory(
        @Header("Authorization") authToken: String
    ): Response<List<CallRecord>>
    
    @GET("api/billing/balance")
    suspend fun getWalletBalance(
        @Header("Authorization") authToken: String
    ): Response<WalletBalance>
}

// Data classes for API requests/responses
data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val success: Boolean,
    val token: String,
    val user: User
)

data class TokenRequest(
    val userId: String
)

data class TwilioTokenResponse(
    val accessToken: String,
    val identity: String
)

data class CallRequest(
    val to: String,
    val contactName: String? = null
)

data class CallResponse(
    val success: Boolean,
    val callSid: String,
    val message: String
)

data class Contact(
    val id: Int,
    val firstName: String,
    val lastName: String,
    val phone: String,
    val email: String? = null,
    val company: String? = null
)

data class CallRecord(
    val id: Int,
    val twilioSid: String,
    val fromNumber: String,
    val toNumber: String,
    val direction: String,
    val status: String,
    val duration: Int?,
    val createdAt: String
)

data class WalletBalance(
    val balance: Double,
    val currency: String
)

data class User(
    val id: Int,
    val email: String,
    val firstName: String,
    val lastName: String
)