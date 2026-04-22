package com.bagicha.app.domain.repository

import com.bagicha.app.data.remote.AuthResponse
import com.bagicha.app.data.remote.UpdateProfileBody
import com.bagicha.app.data.remote.UserDto
import com.bagicha.app.data.remote.dto.ApiResponse

interface AuthRepository {
    suspend fun requestOtp(phoneNumber: String): ApiResponse<String>
    suspend fun verifyOtp(phoneNumber: String, otp: String): ApiResponse<AuthResponse>
    suspend fun updateProfile(body: UpdateProfileBody): ApiResponse<UserDto>
}
