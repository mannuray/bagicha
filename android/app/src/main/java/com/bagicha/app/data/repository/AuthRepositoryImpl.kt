package com.bagicha.app.data.repository

import com.bagicha.app.data.local.AuthTokenStore
import com.bagicha.app.data.remote.*
import com.bagicha.app.data.remote.dto.ApiResponse
import com.bagicha.app.domain.repository.AuthRepository
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val apiService: ApiService,
    private val authTokenStore: AuthTokenStore
) : AuthRepository {
    override suspend fun requestOtp(phoneNumber: String): ApiResponse<String> {
        return apiService.requestOtp(RequestOtpBody(phoneNumber))
    }

    override suspend fun verifyOtp(phoneNumber: String, otp: String): ApiResponse<AuthResponse> {
        val response = apiService.verifyOtp(VerifyOtpBody(phoneNumber, otp))
        if (response.success) {
            response.data?.accessToken?.let(authTokenStore::saveAccessToken)
        }
        return response
    }

    override suspend fun updateProfile(body: UpdateProfileBody): ApiResponse<UserDto> {
        return apiService.updateProfile(body)
    }
}
