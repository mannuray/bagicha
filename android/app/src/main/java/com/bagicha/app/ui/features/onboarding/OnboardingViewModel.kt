package com.bagicha.app.ui.features.onboarding

import android.annotation.SuppressLint
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bagicha.app.core.session.SessionManager
import com.bagicha.app.data.remote.UpdateProfileBody
import com.bagicha.app.domain.repository.AuthRepository
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.Priority
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val fusedLocationClient: FusedLocationProviderClient,
    private val sessionManager: SessionManager
) : ViewModel() {
    
    private val _selectedLanguage = MutableStateFlow("en")
    val selectedLanguage: StateFlow<String> = _selectedLanguage.asStateFlow()

    private val _latitude = MutableStateFlow<Double?>(null)
    private val _longitude = MutableStateFlow<Double?>(null)
    private val _hasLocation = MutableStateFlow(false)
    val hasLocation: StateFlow<Boolean> = _hasLocation.asStateFlow()

    private val _selectedGardenTypes = MutableStateFlow<Set<String>>(emptySet())
    val selectedGardenTypes: StateFlow<Set<String>> = _selectedGardenTypes.asStateFlow()

    private val _phoneNumber = MutableStateFlow("")
    val phoneNumber: StateFlow<String> = _phoneNumber.asStateFlow()

    private val _otp = MutableStateFlow("")
    val otp: StateFlow<String> = _otp.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _authError = MutableStateFlow<String?>(null)
    val authError: StateFlow<String?> = _authError.asStateFlow()

    private fun formattedPhoneNumber(): String {
        val digits = _phoneNumber.value.filter(Char::isDigit)
        return if (digits.length == 10) "+91$digits" else digits
    }

    fun selectLanguage(langCode: String) {
        _selectedLanguage.value = langCode
        _authError.value = null
    }

    @SuppressLint("MissingPermission")
    fun detectLocation(onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _authError.value = null
            fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                .addOnSuccessListener { location ->
                    if (location != null) {
                        _latitude.value = location.latitude
                        _longitude.value = location.longitude
                        _hasLocation.value = true
                        onSuccess()
                    } else {
                        _authError.value = "Unable to detect your location. Turn on location services and try again."
                    }
                    _isLoading.value = false
                }
                .addOnFailureListener {
                    _authError.value = "Unable to detect your location. Check permissions and try again."
                    _isLoading.value = false
                }
        }
    }

    fun onLocationPermissionDenied() {
        _authError.value = "Location permission is required to finish onboarding."
    }

    fun toggleGardenType(type: String) {
        val current = _selectedGardenTypes.value.toMutableSet()
        if (current.contains(type)) {
            current.remove(type)
        } else {
            current.add(type)
        }
        _selectedGardenTypes.value = current
    }

    fun setPhoneNumber(phone: String) {
        _phoneNumber.value = phone.filter(Char::isDigit).take(10)
        _authError.value = null
    }

    fun setOtp(otp: String) {
        if (otp.length <= 6) {
            _otp.value = otp.filter(Char::isDigit)
            _authError.value = null
        }
    }

    fun requestOtp(onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _authError.value = null
            try {
                val response = authRepository.requestOtp(formattedPhoneNumber())
                if (response.success) {
                    onSuccess()
                } else {
                    _authError.value = response.error?.message ?: "Failed to send OTP"
                }
            } catch (e: Exception) {
                _authError.value = e.message ?: "Failed to send OTP"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun verifyOtp(onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _authError.value = null
            try {
                val response = authRepository.verifyOtp(formattedPhoneNumber(), _otp.value)
                if (response.success && response.data != null) {
                    sessionManager.saveAuthToken(response.data.accessToken)
                    if (response.data.user.latitude != null && response.data.user.longitude != null) {
                        sessionManager.setOnboardingComplete(true)
                    }
                    onSuccess()
                } else {
                    _authError.value = response.error?.message ?: "Failed to verify OTP"
                }
            } catch (e: Exception) {
                _authError.value = e.message ?: "Failed to verify OTP"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun completeOnboarding(onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _authError.value = null
            try {
                if (_latitude.value == null || _longitude.value == null) {
                    _authError.value = "Location is required to complete onboarding."
                    return@launch
                }
                val body = UpdateProfileBody(
                    name = null,
                    latitude = _latitude.value,
                    longitude = _longitude.value,
                    district = null,
                    gardenTypes = _selectedGardenTypes.value.toList().sorted(),
                    languagePref = _selectedLanguage.value
                )
                val response = authRepository.updateProfile(body)
                if (response.success) {
                    sessionManager.setOnboardingComplete(true)
                    onSuccess()
                } else {
                    _authError.value = response.error?.message ?: "Failed to complete onboarding"
                }
            } catch (e: Exception) {
                _authError.value = e.message ?: "Failed to complete onboarding"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun getSessionStatus(): Pair<Boolean, Boolean> {
        return (sessionManager.getAuthToken() != null) to sessionManager.isOnboarded()
    }
}
