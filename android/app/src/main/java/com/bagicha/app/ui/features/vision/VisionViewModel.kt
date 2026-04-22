package com.bagicha.app.ui.features.vision

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

enum class ScanMode { IDENTIFY, DIAGNOSE }
enum class ScanStatus { IDLE, SCANNING, SUCCESS, ERROR }

@HiltViewModel
class VisionViewModel @Inject constructor() : ViewModel() {

    private val _scanMode = MutableStateFlow(ScanMode.IDENTIFY)
    val scanMode: StateFlow<ScanMode> = _scanMode.asStateFlow()

    private val _scanStatus = MutableStateFlow(ScanStatus.IDLE)
    val scanStatus: StateFlow<ScanStatus> = _scanStatus.asStateFlow()

    fun setScanMode(mode: ScanMode) {
        _scanMode.value = mode
    }

    fun startScan() {
        _scanStatus.value = ScanStatus.SCANNING
    }

    fun resetScan() {
        _scanStatus.value = ScanStatus.IDLE
    }
}
