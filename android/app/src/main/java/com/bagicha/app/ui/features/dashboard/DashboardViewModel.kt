package com.bagicha.app.ui.features.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bagicha.app.data.remote.RecordKindDto
import com.bagicha.app.data.remote.TaskStatusDto
import com.bagicha.app.domain.repository.LedgerRepository
import com.bagicha.app.ui.features.ledger.RecordKind
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class GardenTask(
    val id: String,
    val title: String,
    val isCompleted: Boolean = false,
    val treeId: String? = null,
    val treeName: String? = null,
    val recordKind: RecordKind? = null,
    val dueDate: String? = null
)

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

    private val _tasks = MutableStateFlow<List<GardenTask>>(emptyList())
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
                val treesResponse = ledgerRepository.getTrees()
                _showFirstEntryPrompt.value = treesResponse.success && treesResponse.data.orEmpty().isEmpty()

                val tasksResponse = ledgerRepository.getUserTasks()
                _tasks.value = if (tasksResponse.success) {
                    tasksResponse.data.orEmpty().map { task ->
                        GardenTask(
                            id = task.id,
                            title = task.title,
                            isCompleted = task.status == TaskStatusDto.COMPLETED,
                            treeId = task.treeId,
                            treeName = task.treeName,
                            recordKind = task.recordKind?.toUiModel(),
                            dueDate = task.dueDate.take(10)
                        )
                    }
                } else {
                    emptyList()
                }
            } catch (_: Exception) {
                _showFirstEntryPrompt.value = false
                _tasks.value = emptyList()
            } finally {
                _isLoadingLedgerState.value = false
            }
        }
    }

    fun toggleTask(taskId: String) {
        val current = _tasks.value.find { it.id == taskId } ?: return
        val treeId = current.treeId ?: return
        val nextStatus = if (current.isCompleted) TaskStatusDto.PENDING else TaskStatusDto.COMPLETED

        viewModelScope.launch {
            try {
                val response = ledgerRepository.updateTreeTaskStatus(
                    treeId,
                    taskId,
                    com.bagicha.app.data.remote.UpdateTaskStatusBody(status = nextStatus)
                )
                if (response.success) {
                    refreshLedgerState()
                }
            } catch (_: Exception) {
                // leave local state unchanged on failure
            }
        }
    }

fun dismissAlert() {
        _alert.value = null
    }
}

private fun RecordKindDto.toUiModel(): RecordKind {
    return when (this) {
        RecordKindDto.TREE -> RecordKind.TREE
        RecordKindDto.FLOWER -> RecordKind.FLOWER
        RecordKindDto.CROP -> RecordKind.CROP
    }
}
