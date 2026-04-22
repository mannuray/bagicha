package com.bagicha.app.ui.features.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bagicha.app.domain.repository.LedgerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class GardenTask(val id: String, val title: String, val isCompleted: Boolean = false)
data class WeatherInfo(val district: String, val temp: Int, val condition: String)
data class UrgentAlert(val id: String, val message: String, val type: String)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val ledgerRepository: LedgerRepository
) : ViewModel() {

    private val _weather = MutableStateFlow(WeatherInfo("Patna", 34, "Sunny"))
    val weather: StateFlow<WeatherInfo> = _weather.asStateFlow()

    private val _alert = MutableStateFlow<UrgentAlert?>(
        UrgentAlert("1", "Heatwave Alert: Deep-water your Mango tree tonight.", "WEATHER")
    )
    val alert: StateFlow<UrgentAlert?> = _alert.asStateFlow()

    private val _tasks = MutableStateFlow(listOf(
        GardenTask("1", "Water Lemon tree"),
        GardenTask("2", "Sow summer gourds"),
        GardenTask("3", "Check Rose bushes for aphids")
    ))
    val tasks: StateFlow<List<GardenTask>> = _tasks.asStateFlow()

    private val _showFirstEntryPrompt = MutableStateFlow(false)
    val showFirstEntryPrompt: StateFlow<Boolean> = _showFirstEntryPrompt.asStateFlow()

    private val _isLoadingLedgerState = MutableStateFlow(false)
    val isLoadingLedgerState: StateFlow<Boolean> = _isLoadingLedgerState.asStateFlow()

    init {
        refreshLedgerState()
    }

    fun refreshLedgerState() {
        viewModelScope.launch {
            _isLoadingLedgerState.value = true
            try {
                val response = ledgerRepository.getTrees()
                _showFirstEntryPrompt.value = response.success && response.data.orEmpty().isEmpty()
            } catch (_: Exception) {
                _showFirstEntryPrompt.value = false
            } finally {
                _isLoadingLedgerState.value = false
            }
        }
    }

    fun toggleTask(taskId: String) {
        _tasks.value = _tasks.value.map {
            if (it.id == taskId) it.copy(isCompleted = !it.isCompleted) else it
        }
    }

    fun dismissAlert() {
        _alert.value = null
    }
}
