package com.bagicha.app.ui.features.vision

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bagicha.app.data.remote.DiagnosePlantResponseDto
import com.bagicha.app.data.remote.IdentifyPlantDto
import com.bagicha.app.data.remote.VisionRequestBody
import com.bagicha.app.domain.repository.LedgerRepository
import com.bagicha.app.domain.repository.VisionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class ScanMode { IDENTIFY, DIAGNOSE }
enum class ScanStatus { IDLE, SCANNING, SUCCESS, ERROR }

data class VisionTreeOption(
    val id: String,
    val title: String,
    val subtitle: String
)

data class IdentifyResultUi(
    val commonName: String,
    val scientificName: String?,
    val description: String,
    val careSummary: String
)

data class DiagnoseResultUi(
    val primaryIssue: String,
    val secondaryIssues: List<String>,
    val symptoms: List<String>,
    val confidence: String,
    val severity: String,
    val affectedPart: String?,
    val reasoningSummary: String,
    val recommendedActions: List<String>,
    val needsFollowUp: Boolean,
    val followUpDays: Int?,
    val persisted: Boolean,
    val sessionId: String?,
    val outcomeId: String?,
    val logIds: List<String>,
    val taskId: String?
)

@HiltViewModel
class VisionViewModel @Inject constructor(
    private val visionRepository: VisionRepository,
    private val ledgerRepository: LedgerRepository,
) : ViewModel() {

    private val _scanMode = MutableStateFlow(ScanMode.IDENTIFY)
    val scanMode: StateFlow<ScanMode> = _scanMode.asStateFlow()

    private val _scanStatus = MutableStateFlow(ScanStatus.IDLE)
    val scanStatus: StateFlow<ScanStatus> = _scanStatus.asStateFlow()

    private val _trees = MutableStateFlow<List<VisionTreeOption>>(emptyList())
    val trees: StateFlow<List<VisionTreeOption>> = _trees.asStateFlow()

    private val _selectedTreeId = MutableStateFlow<String?>(null)
    val selectedTreeId: StateFlow<String?> = _selectedTreeId.asStateFlow()

    private val _diagnosisNote = MutableStateFlow("")
    val diagnosisNote: StateFlow<String> = _diagnosisNote.asStateFlow()

    private val _diagnosisEventAt = MutableStateFlow("")
    val diagnosisEventAt: StateFlow<String> = _diagnosisEventAt.asStateFlow()

    private val _identifyResult = MutableStateFlow<IdentifyResultUi?>(null)
    val identifyResult: StateFlow<IdentifyResultUi?> = _identifyResult.asStateFlow()

    private val _diagnoseResult = MutableStateFlow<DiagnoseResultUi?>(null)
    val diagnoseResult: StateFlow<DiagnoseResultUi?> = _diagnoseResult.asStateFlow()

    private val _latestImageDataUri = MutableStateFlow<String?>(null)
    val latestImageDataUri: StateFlow<String?> = _latestImageDataUri.asStateFlow()

    private val _pendingImageBase64 = MutableStateFlow<String?>(null)
    val pendingImageBase64: StateFlow<String?> = _pendingImageBase64.asStateFlow()

    private val _pendingImageDataUri = MutableStateFlow<String?>(null)
    val pendingImageDataUri: StateFlow<String?> = _pendingImageDataUri.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        loadTrees()
    }

    fun setScanMode(mode: ScanMode) {
        _scanMode.value = mode
    }

    fun selectTree(plantId: String?) {
        _selectedTreeId.value = plantId
    }

    fun updateDiagnosisNote(value: String) {
        _diagnosisNote.value = value
    }

    fun updateDiagnosisEventAt(value: String) {
        _diagnosisEventAt.value = value
    }

    fun clearError() {
        _error.value = null
    }

    fun reportError(message: String) {
        _error.value = message
        _scanStatus.value = ScanStatus.ERROR
        _isLoading.value = false
    }

    fun resetScan() {
        _scanStatus.value = ScanStatus.IDLE
        _error.value = null
    }

    fun stageImage(imageBase64: String) {
        _pendingImageBase64.value = imageBase64
        _pendingImageDataUri.value = imageBase64.toImageDataUri()
        _error.value = null
    }

    fun clearStagedImage() {
        _pendingImageBase64.value = null
        _pendingImageDataUri.value = null
    }

    fun submitStagedImage(onNavigate: (ScanMode) -> Unit) {
        val imageBase64 = _pendingImageBase64.value
        if (imageBase64.isNullOrBlank()) {
            reportError("Capture or select an image first")
            return
        }
        if (_scanMode.value == ScanMode.IDENTIFY) {
            startIdentify(imageBase64)
        } else {
            startDiagnosis(imageBase64)
        }
        onNavigate(_scanMode.value)
    }

    fun startIdentify(imageBase64: String) {
        _scanStatus.value = ScanStatus.SCANNING
        _isLoading.value = true
        _error.value = null
        _identifyResult.value = null
        _latestImageDataUri.value = imageBase64.toImageDataUri()
        clearStagedImage()
        viewModelScope.launch {
            try {
                val response = visionRepository.identifyPlant(
                    VisionRequestBody(imageBase64 = imageBase64)
                )
                if (response.success && response.data != null) {
                    _identifyResult.value = response.data.toUiModel()
                    _scanStatus.value = ScanStatus.SUCCESS
                } else {
                    _scanStatus.value = ScanStatus.ERROR
                    _error.value = response.error?.message ?: "Failed to identify plant"
                }
            } catch (e: Exception) {
                _scanStatus.value = ScanStatus.ERROR
                _error.value = e.message ?: "Failed to identify plant"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun startDiagnosis(imageBase64: String) {
        _scanStatus.value = ScanStatus.SCANNING
        _isLoading.value = true
        _error.value = null
        _diagnoseResult.value = null
        _latestImageDataUri.value = imageBase64.toImageDataUri()
        clearStagedImage()
        viewModelScope.launch {
            try {
                val response = visionRepository.diagnosePlant(
                    VisionRequestBody(
                        imageBase64 = imageBase64,
                        plantId = _selectedTreeId.value,
                        note = _diagnosisNote.value.trim().ifBlank { null },
                        eventAt = _diagnosisEventAt.value.toEventAtIso()
                    )
                )
                if (response.success && response.data != null) {
                    _diagnoseResult.value = response.data.toUiModel()
                    _scanStatus.value = ScanStatus.SUCCESS
                } else {
                    _scanStatus.value = ScanStatus.ERROR
                    _error.value = response.error?.message ?: "Failed to diagnose plant"
                }
            } catch (e: Exception) {
                _scanStatus.value = ScanStatus.ERROR
                _error.value = e.message ?: "Failed to diagnose plant"
            } finally {
                _isLoading.value = false
            }
        }
    }

    private fun loadTrees() {
        viewModelScope.launch {
            try {
                val response = ledgerRepository.getPlants()
                if (response.success) {
                    _trees.value = response.data.orEmpty().map {
                        VisionTreeOption(
                            id = it.id,
                            title = it.name,
                            subtitle = listOfNotNull(it.speciesFamily ?: it.species, it.variety).joinToString(" • ")
                        )
                    }
                }
            } catch (_: Exception) {
                _trees.value = emptyList()
            }
        }
    }
}

private fun IdentifyPlantDto.toUiModel(): IdentifyResultUi {
    return IdentifyResultUi(
        commonName = commonName ?: "Plant identified",
        scientificName = scientificName,
        description = description ?: "No description returned.",
        careSummary = careSummary ?: "No care summary returned."
    )
}

private fun DiagnosePlantResponseDto.toUiModel(): DiagnoseResultUi {
    return DiagnoseResultUi(
        primaryIssue = diagnosis.primaryIssue ?: "Unknown issue",
        secondaryIssues = diagnosis.secondaryIssues,
        symptoms = diagnosis.symptoms,
        confidence = diagnosis.confidence ?: "Unknown",
        severity = diagnosis.severity ?: "UNKNOWN",
        affectedPart = diagnosis.affectedPart,
        reasoningSummary = diagnosis.reasoningSummary ?: "No diagnosis summary returned.",
        recommendedActions = diagnosis.recommendedActions,
        needsFollowUp = diagnosis.needsFollowUp,
        followUpDays = diagnosis.followUpDays,
        persisted = persisted,
        sessionId = sessionId,
        outcomeId = outcomeId,
        logIds = logIds,
        taskId = taskId
    )
}

private fun String.toEventAtIso(): String? {
    val normalized = trim()
    if (normalized.isBlank()) return null
    return when {
        Regex("""\d{4}-\d{2}-\d{2}""").matches(normalized) -> "${normalized}T12:00:00.000Z"
        Regex("""\d{4}-\d{2}""").matches(normalized) -> "${normalized}-01T12:00:00.000Z"
        Regex("""\d{4}""").matches(normalized) -> "${normalized}-01-01T12:00:00.000Z"
        else -> normalized
    }
}

private fun String.toImageDataUri(): String = "data:image/jpeg;base64,$this"
