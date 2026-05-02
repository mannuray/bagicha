package com.bagicha.app.ui.features.ledger

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bagicha.app.data.remote.AddLogBody
import com.bagicha.app.data.remote.CreatePlantBody
import com.bagicha.app.data.remote.LifecycleStageDto
import com.bagicha.app.data.remote.LogTypeDto
import com.bagicha.app.data.remote.MitigationPlanDto
import com.bagicha.app.data.remote.PlantIdentityDto
import com.bagicha.app.data.remote.PlantingDatePrecisionDto
import com.bagicha.app.data.remote.GrowthHabitDto
import com.bagicha.app.data.remote.RecordPatternDto
import com.bagicha.app.data.remote.RecordKindDto
import com.bagicha.app.data.remote.ResolvePlantBody
import com.bagicha.app.data.remote.SeasonalStateDto
import com.bagicha.app.data.remote.TaskPriorityDto
import com.bagicha.app.data.remote.TaskSourceDto
import com.bagicha.app.data.remote.TaskStatusDto
import com.bagicha.app.data.remote.TaskTypeDto
import com.bagicha.app.data.remote.PlantTaskDto
import com.bagicha.app.data.remote.PlantCycleDto
import com.bagicha.app.data.remote.PlantDto
import com.bagicha.app.data.remote.JournalEntryDto
import com.bagicha.app.data.remote.PlantCategoryDto
import com.bagicha.app.data.remote.UpdateTaskStatusBody
import com.bagicha.app.domain.repository.LedgerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import com.google.gson.JsonObject
import com.google.gson.JsonPrimitive
import com.google.gson.JsonElement
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import javax.inject.Inject

enum class LifecycleStage { SAPLING, JUVENILE, FLOWERING, FIRST_HARVEST, MATURE }
enum class LogType {
    PLANTING,
    PHOTO,
    NOTE,
    WATERING,
    WATERING_STRESS,
    PRUNING,
    FEEDING,
    FLOWERING,
    FLOWER_DROP,
    FRUIT_SET,
    FRUIT_DROP,
    HARVEST,
    PEST,
    TREATMENT,
    DIAGNOSIS,
    WEATHER_DAMAGE,
    SOWING,
    TRANSPLANTING,
    GERMINATION,
    THINNING,
    BOLTING,
    PINCHING,
    DEADHEADING,
    BLOOM_PEAK,
    SEASON_END
}

fun LogType.allowedFor(kind: RecordKind): Boolean = when (this) {
    // Universal — appropriate for any record
    LogType.PLANTING, LogType.PHOTO, LogType.NOTE, LogType.WATERING,
    LogType.WATERING_STRESS, LogType.PRUNING, LogType.FEEDING,
    LogType.FLOWERING, LogType.FLOWER_DROP, LogType.PEST, LogType.TREATMENT,
    LogType.DIAGNOSIS, LogType.WEATHER_DAMAGE -> true
    // Fruit-cycle events
    LogType.FRUIT_SET, LogType.FRUIT_DROP, LogType.HARVEST -> kind != RecordKind.FLOWER
    // Crop-oriented events
    LogType.SOWING, LogType.TRANSPLANTING, LogType.GERMINATION,
    LogType.THINNING, LogType.BOLTING -> kind == RecordKind.CROP
    // Flower-oriented events
    LogType.PINCHING, LogType.DEADHEADING, LogType.BLOOM_PEAK -> kind == RecordKind.FLOWER
    // Cross-kind cycle close
    LogType.SEASON_END -> kind != RecordKind.TREE
}
enum class PlantCategory { FRUIT_BEARING, NON_FRUIT_BEARING, ORNAMENTAL }
enum class RecordKind { TREE, FLOWER, CROP }

fun RecordKind.displayName(): String {
    return when (this) {
        RecordKind.TREE -> "Tree"
        RecordKind.FLOWER -> "Flower"
        RecordKind.CROP -> "Crop"
    }
}
enum class GrowthHabit { PERENNIAL, ANNUAL, BIENNIAL, SEASONAL, UNKNOWN }
enum class RecordPattern { LONG_LIVED, RECURRING_SEASONAL, ONE_OFF_SEASON }

data class Plant(
    val id: String,
    val name: String,
    val speciesFamily: String?,
    val species: String,
    val variety: String?,
    val recordKind: RecordKind,
    val type: PlantCategory,
    val growthHabit: GrowthHabit,
    val recordPattern: RecordPattern,
    val stage: LifecycleStage,
    val health: String,
    val plantingDate: String?,
    val plantingDateInput: String?,
    val firstFloweringAt: String?,
    val firstFruitSetAt: String?,
    val firstHarvestAt: String?,
    val latestHarvestAt: String?,
    val age: String,
    val logCount: Int = 0
)

data class RecordDraft(
    val name: String = "",
    val species: String = "",
    val variety: String = "",
    val plantingDate: String = "",
    val recordKind: RecordKind = RecordKind.TREE,
    val type: PlantCategory = PlantCategory.FRUIT_BEARING,
    val growthHabit: GrowthHabit = GrowthHabit.PERENNIAL,
    val recordPattern: RecordPattern = RecordPattern.LONG_LIVED,
    val stage: LifecycleStage = LifecycleStage.SAPLING
)

data class JournalEntry(
    val id: String,
    val type: LogType,
    val timestamp: String,
    val recordedAt: String?,
    val date: String,
    val content: String,
    val metadata: Map<String, String> = emptyMap(),
    val photoUrl: String? = null
)

data class SeasonalState(
    val speciesFamily: String,
    val currentPhase: String,
    val upcomingPhase: String,
    val confidence: String,
    val doNow: List<String>,
    val avoidNow: List<String>,
    val watchFor: List<String>,
    val nextCheckpointDays: Int,
    val basis: String
)

data class CycleSummary(
    val id: String,
    val year: Int,
    val summary: String,
    val harvestWindow: String?,
    val floweringDate: String?,
    val fruitSetDate: String?,
    val yieldSummary: String?,
    val flowerDropLevel: String?,
    val fruitDropLevel: String?,
    val stressScore: Int,
    val pestPressureScore: Int,
    val treatmentCount: Int,
    val nextActions: List<String>,
    val recentEventLabels: List<String>
)

data class PlantTask(
    val id: String,
    val title: String,
    val type: String,
    val priority: String,
    val status: String,
    val source: String,
    val cycleLabel: String?,
    val dueAt: String,
    val dueDate: String,
    val sourceSummary: String? = null,
    val reason: String? = null
)

data class MitigationPlan(
    val cycleYear: Int?,
    val summary: String,
    val likelyIssues: List<String>,
    val whatToChange: List<String>,
    val watchEarly: List<String>,
    val priorityActions: List<String>,
    val completedTasks: Int,
    val skippedTasks: Int,
    val pendingTasks: Int
)

data class ResolvedPlantIdentity(
    val id: String,
    val displayName: String,
    val speciesFamily: String,
    val species: String,
    val variety: String?,
    val plantType: String,
    val matchedAlias: String? = null
)

data class LogDraft(
    val type: LogType = LogType.NOTE,
    val eventAt: String? = null,
    val content: String = "",
    val severity: String? = null,
    val harvestQuantityValue: String? = null,
    val harvestQuantityUnit: String? = null,
    val quality: String? = null,
    val harvestLossCategory: String? = null,
    val harvestLossNote: String? = null,
    val fruitSetStrength: String? = null,
    val pruningType: String? = null,
    val feedingType: String? = null
)

@HiltViewModel
class LedgerViewModel @Inject constructor(
    private val ledgerRepository: LedgerRepository
) : ViewModel() {

    private val _trees = MutableStateFlow<List<Plant>>(emptyList())
    val trees: StateFlow<List<Plant>> = _trees.asStateFlow()

    private val _selectedTree = MutableStateFlow<Plant?>(null)
    val selectedTree: StateFlow<Plant?> = _selectedTree.asStateFlow()

    private val _timeline = MutableStateFlow<List<JournalEntry>>(emptyList())
    val timeline: StateFlow<List<JournalEntry>> = _timeline.asStateFlow()

    private val _seasonalState = MutableStateFlow<SeasonalState?>(null)
    val seasonalState: StateFlow<SeasonalState?> = _seasonalState.asStateFlow()

    private val _cycles = MutableStateFlow<List<CycleSummary>>(emptyList())
    val cycles: StateFlow<List<CycleSummary>> = _cycles.asStateFlow()

    private val _tasks = MutableStateFlow<List<PlantTask>>(emptyList())
    val tasks: StateFlow<List<PlantTask>> = _tasks.asStateFlow()

    private val _mitigationPlan = MutableStateFlow<MitigationPlan?>(null)
    val mitigationPlan: StateFlow<MitigationPlan?> = _mitigationPlan.asStateFlow()

    private val _plantSuggestions = MutableStateFlow<List<ResolvedPlantIdentity>>(emptyList())
    val plantSuggestions: StateFlow<List<ResolvedPlantIdentity>> = _plantSuggestions.asStateFlow()

    private val _resolvedPlant = MutableStateFlow<ResolvedPlantIdentity?>(null)
    val resolvedPlant: StateFlow<ResolvedPlantIdentity?> = _resolvedPlant.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isSubmitting = MutableStateFlow(false)
    val isSubmitting: StateFlow<Boolean> = _isSubmitting.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _selectedTreeId = MutableStateFlow<String?>(null)
    private val _editingTreeId = MutableStateFlow<String?>(null)

    init {
        loadTrees()
    }

    fun loadTrees() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val response = ledgerRepository.getPlants()
                if (response.success) {
                    _trees.value = response.data.orEmpty().map { it.toUiModel() }
                    syncSelectedTreeFromList()
                } else {
                    _error.value = response.error?.message ?: "Failed to load your ledger"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to load your ledger"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun selectTree(plantId: String) {
        _selectedTreeId.value = plantId
        _selectedTree.value = _trees.value.find { it.id == plantId }
        loadSelectedTree(plantId)
        loadSeasonalState(plantId)
        loadCycles(plantId)
        loadTasks(plantId)
        loadMitigationPlan(plantId)
        loadTimeline(plantId)
    }

    fun loadSelectedTree(explicitTreeId: String? = null) {
        val plantId = explicitTreeId ?: _selectedTreeId.value ?: return
        _selectedTreeId.value = plantId
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val response = ledgerRepository.getPlantDetail(plantId)
                if (response.success && response.data != null) {
                    val tree = response.data.toUiModel()
                    _selectedTree.value = tree
                    _trees.value = _trees.value.replaceTree(tree)
                } else {
                    _error.value = response.error?.message ?: "Failed to load tree details"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to load tree details"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loadTimeline(explicitTreeId: String? = null) {
        val plantId = explicitTreeId ?: _selectedTreeId.value ?: return
        viewModelScope.launch {
            _error.value = null
            try {
                val response = ledgerRepository.getPlantTimeline(plantId)
                if (response.success && response.data != null) {
                    _timeline.value = response.data.map { it.toUiModel() }
                } else {
                    _error.value = response.error?.message ?: "Failed to load timeline"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to load timeline"
            }
        }
    }

    fun loadSeasonalState(explicitTreeId: String? = null) {
        val plantId = explicitTreeId ?: _selectedTreeId.value ?: return
        viewModelScope.launch {
            try {
                val response = ledgerRepository.getPlantSeasonalState(plantId)
                if (response.success) {
                    _seasonalState.value = response.data?.toUiModel()
                } else {
                    _seasonalState.value = null
                }
            } catch (_: Exception) {
                _seasonalState.value = null
            }
        }
    }

    fun loadCycles(explicitTreeId: String? = null) {
        val plantId = explicitTreeId ?: _selectedTreeId.value ?: return
        viewModelScope.launch {
            try {
                val response = ledgerRepository.getPlantCycles(plantId)
                if (response.success) {
                    _cycles.value = response.data.orEmpty().map { it.toUiModel() }
                } else {
                    _cycles.value = emptyList()
                }
            } catch (_: Exception) {
                _cycles.value = emptyList()
            }
        }
    }

    fun loadTasks(explicitTreeId: String? = null) {
        val plantId = explicitTreeId ?: _selectedTreeId.value ?: return
        viewModelScope.launch {
            try {
                val response = ledgerRepository.getPlantTasks(plantId)
                if (response.success) {
                    _tasks.value = response.data.orEmpty().map { it.toUiModel() }
                } else {
                    _tasks.value = emptyList()
                }
            } catch (_: Exception) {
                _tasks.value = emptyList()
            }
        }
    }

    fun loadMitigationPlan(explicitTreeId: String? = null) {
        val plantId = explicitTreeId ?: _selectedTreeId.value ?: return
        viewModelScope.launch {
            try {
                val response = ledgerRepository.getMitigationPlan(plantId)
                _mitigationPlan.value = if (response.success) {
                    response.data?.toUiModel()
                } else {
                    null
                }
            } catch (_: Exception) {
                _mitigationPlan.value = null
            }
        }
    }

    fun syncTreeTasks(onSuccess: () -> Unit = {}) {
        val plantId = _selectedTreeId.value ?: return
        viewModelScope.launch {
            _isSubmitting.value = true
            _error.value = null
            try {
                val response = ledgerRepository.materializePlantTasks(plantId)
                if (response.success) {
                    loadTasks()
                    loadMitigationPlan()
                    onSuccess()
                } else {
                    _error.value = response.error?.message ?: "Failed to sync tasks"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to sync tasks"
            } finally {
                _isSubmitting.value = false
            }
        }
    }

    fun updateTaskStatus(taskId: String, status: TaskStatusDto, onSuccess: () -> Unit = {}) {
        val plantId = _selectedTreeId.value ?: return
        viewModelScope.launch {
            _isSubmitting.value = true
            _error.value = null
            try {
                val response = ledgerRepository.updatePlantTaskStatus(
                    plantId,
                    taskId,
                    UpdateTaskStatusBody(status = status)
                )
                if (response.success) {
                    loadTasks()
                    onSuccess()
                } else {
                    _error.value = response.error?.message ?: "Failed to update task"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to update task"
            } finally {
                _isSubmitting.value = false
            }
        }
    }

    fun createPlant(
        name: String,
        plantQuery: String,
        species: String,
        variety: String,
        recordKind: RecordKind,
        type: PlantCategory,
        growthHabit: GrowthHabit,
        recordPattern: RecordPattern,
        plantingDate: String?,
        stage: LifecycleStage,
        onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            _isSubmitting.value = true
            _error.value = null
            try {
                val response = ledgerRepository.createPlant(
                    CreatePlantBody(
                        name = name.trim(),
                        species = species.trim().ifBlank { plantQuery.trim() },
                        variety = variety.trim().ifBlank { null },
                        recordKind = recordKind.toDto(),
                        type = type.toDto(),
                        growthHabit = growthHabit.toDto(),
                        recordPattern = recordPattern.toDto(),
                        plantingDate = plantingDate?.trim().takeUnless { it.isNullOrBlank() },
                        plantingDatePrecision = plantingDate.inferPlantingDatePrecision(),
                        lifecycleStage = stage.toDto()
                    )
                )
                if (response.success && response.data != null) {
                    val tree = response.data.toUiModel()
                    _trees.value = listOf(tree) + _trees.value
                    _selectedTreeId.value = tree.id
                    _selectedTree.value = tree
                    onSuccess()
                } else {
                    _error.value = response.error?.message ?: "Failed to add tree"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to add tree"
            } finally {
                _isSubmitting.value = false
            }
        }
    }

    fun startEditingSelectedTree() {
        _editingTreeId.value = _selectedTree.value?.id
    }

    fun stopEditingTree() {
        _editingTreeId.value = null
    }

    fun isEditingTree(): Boolean = _editingTreeId.value != null

    fun currentDraft(isEditMode: Boolean): RecordDraft {
        val tree = if (isEditMode) _selectedTree.value else null
        return if (tree == null) {
            RecordDraft()
        } else {
            RecordDraft(
                name = tree.name,
                species = tree.species,
                variety = tree.variety.orEmpty(),
                plantingDate = tree.plantingDate?.take(10).orEmpty(),
                recordKind = tree.recordKind,
                type = tree.type,
                growthHabit = tree.growthHabit,
                recordPattern = tree.recordPattern,
                stage = tree.stage
            )
        }
    }

    fun saveTree(
        isEditMode: Boolean,
        name: String,
        plantQuery: String,
        species: String,
        variety: String,
        recordKind: RecordKind,
        type: PlantCategory,
        growthHabit: GrowthHabit,
        recordPattern: RecordPattern,
        plantingDate: String?,
        stage: LifecycleStage,
        onSuccess: () -> Unit
    ) {
        if (isEditMode) {
            updatePlant(
                name = name,
                plantQuery = plantQuery,
                species = species,
                variety = variety,
                recordKind = recordKind,
                type = type,
                growthHabit = growthHabit,
                recordPattern = recordPattern,
                plantingDate = plantingDate,
                stage = stage,
                onSuccess = onSuccess
            )
        } else {
            createPlant(
                name = name,
                plantQuery = plantQuery,
                species = species,
                variety = variety,
                recordKind = recordKind,
                type = type,
                growthHabit = growthHabit,
                recordPattern = recordPattern,
                plantingDate = plantingDate,
                stage = stage,
                onSuccess = onSuccess
            )
        }
    }

    private fun updatePlant(
        name: String,
        plantQuery: String,
        species: String,
        variety: String,
        recordKind: RecordKind,
        type: PlantCategory,
        growthHabit: GrowthHabit,
        recordPattern: RecordPattern,
        plantingDate: String?,
        stage: LifecycleStage,
        onSuccess: () -> Unit
    ) {
        val plantId = _editingTreeId.value ?: _selectedTreeId.value ?: return
        viewModelScope.launch {
            _isSubmitting.value = true
            _error.value = null
            try {
                val response = ledgerRepository.updatePlant(
                    plantId,
                    CreatePlantBody(
                        name = name.trim(),
                        species = species.trim().ifBlank { plantQuery.trim() },
                        variety = variety.trim().ifBlank { null },
                        recordKind = recordKind.toDto(),
                        type = type.toDto(),
                        growthHabit = growthHabit.toDto(),
                        recordPattern = recordPattern.toDto(),
                        plantingDate = plantingDate?.trim().takeUnless { it.isNullOrBlank() },
                        plantingDatePrecision = plantingDate.inferPlantingDatePrecision(),
                        lifecycleStage = stage.toDto()
                    )
                )
                if (response.success && response.data != null) {
                    val tree = response.data.toUiModel()
                    _selectedTreeId.value = tree.id
                    _selectedTree.value = tree
                    _trees.value = _trees.value.replaceTree(tree)
                    _editingTreeId.value = null
                    onSuccess()
                } else {
                    _error.value = response.error?.message ?: "Failed to update entry"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to update entry"
            } finally {
                _isSubmitting.value = false
            }
        }
    }

    fun addLog(draft: LogDraft, onSuccess: () -> Unit) {
        val plantId = _selectedTreeId.value ?: return
        viewModelScope.launch {
            _isSubmitting.value = true
            _error.value = null
            try {
                val response = ledgerRepository.addPlantJournalEntry(
                    plantId,
                    AddLogBody(
                        type = draft.type.toDto(),
                        content = draft.content.trim().ifBlank { null },
                        metadata = draft.toMetadata(),
                        eventAt = draft.eventAt.toEventAtIso()
                    )
                )
                if (response.success && response.data != null) {
                    _timeline.value = listOf(response.data.toUiModel()) + _timeline.value
                    loadSelectedTree()
                    loadCycles()
                    loadTasks()
                    loadMitigationPlan()
                    onSuccess()
                } else {
                    _error.value = response.error?.message ?: "Failed to log moment"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to log moment"
            } finally {
                _isSubmitting.value = false
            }
        }
    }

    fun clearError() {
        _error.value = null
    }

    fun clearPlantResolution() {
        _resolvedPlant.value = null
        _plantSuggestions.value = emptyList()
    }

    fun searchPlantSuggestions(query: String) {
        val normalized = query.trim()
        if (normalized.length < 2) {
            _plantSuggestions.value = emptyList()
            return
        }

        viewModelScope.launch {
            try {
                val response = ledgerRepository.searchPlants(normalized)
                _plantSuggestions.value = if (response.success) {
                    response.data?.items.orEmpty().map { it.toUiModel() }
                } else {
                    emptyList()
                }
            } catch (_: Exception) {
                _plantSuggestions.value = emptyList()
            }
        }
    }

    fun choosePlantSuggestion(suggestion: ResolvedPlantIdentity) {
        _resolvedPlant.value = suggestion
        _plantSuggestions.value = emptyList()
    }

    fun resolvePlantIdentity(query: String, onResolved: (ResolvedPlantIdentity?) -> Unit) {
        val normalized = query.trim()
        if (normalized.isBlank()) {
            clearPlantResolution()
            onResolved(null)
            return
        }

        viewModelScope.launch {
            try {
                val response = ledgerRepository.resolvePlant(
                    ResolvePlantBody(
                        query = normalized,
                        regionCluster = "east_india",
                        language = "en"
                    )
                )
                if (response.success) {
                    val resolved = response.data?.match?.toUiModel()
                    _resolvedPlant.value = resolved
                    _plantSuggestions.value = response.data?.alternatives.orEmpty().map { it.toUiModel() }
                    onResolved(resolved)
                } else {
                    onResolved(null)
                }
            } catch (_: Exception) {
                onResolved(null)
            }
        }
    }

    private fun syncSelectedTreeFromList() {
        val selectedId = _selectedTreeId.value ?: return
        _selectedTree.value = _trees.value.find { it.id == selectedId }
    }
}

private fun List<Plant>.replaceTree(tree: Plant): List<Plant> {
    return map { existing -> if (existing.id == tree.id) tree else existing }
}

private fun PlantDto.toUiModel(): Plant {
    return Plant(
        id = id,
        name = name,
        speciesFamily = speciesFamily,
        species = species,
        variety = variety,
        recordKind = recordKind.toUiModel(),
        type = type.toUiModel(),
        growthHabit = growthHabit.toUiModel(),
        recordPattern = recordPattern.toUiModel(),
        stage = lifecycleStage.toUiModel(),
        health = healthStatus,
        plantingDate = plantingDate,
        plantingDateInput = plantingDateInput,
        firstFloweringAt = firstFloweringAt,
        firstFruitSetAt = firstFruitSetAt,
        firstHarvestAt = firstHarvestAt,
        latestHarvestAt = latestHarvestAt,
        age = plantingDate.toAgeLabel(),
        logCount = count?.logs ?: 0
    )
}

private fun JournalEntryDto.toUiModel(): JournalEntry {
    val isPhoto = content?.startsWith("http") == true
    return JournalEntry(
        id = id,
        type = type.toUiModel(),
        timestamp = timestamp,
        recordedAt = recordedAt,
        date = timestamp.toTimelineLabel(),
        content = if (isPhoto) "Photo Moment" else (content ?: defaultLogContent(type)),
        metadata = metadata.toDisplayMap(),
        photoUrl = if (isPhoto) content else null
    )
}

private fun SeasonalStateDto.toUiModel(): SeasonalState {
    return SeasonalState(
        speciesFamily = speciesFamily,
        currentPhase = currentPhase,
        upcomingPhase = upcomingPhase,
        confidence = confidence,
        doNow = doNow,
        avoidNow = avoidNow,
        watchFor = watchFor,
        nextCheckpointDays = nextCheckpointDays,
        basis = basis
    )
}

private fun PlantCycleDto.toUiModel(): CycleSummary {
    val harvestWindow = when {
        harvestStartedAt != null && harvestCompletedAt != null ->
            "${harvestStartedAt.toDisplayDateLabel()} to ${harvestCompletedAt.toDisplayDateLabel()}"
        harvestStartedAt != null -> harvestStartedAt.toDisplayDateLabel()
        else -> null
    }

    val yieldSummary = when {
        yieldQuantity != null && !yieldUnit.isNullOrBlank() ->
            "${yieldQuantity.toDisplayNumber()} $yieldUnit (${yieldQuality ?: "unknown"})"
        yieldQuantity != null -> "${yieldQuantity.toDisplayNumber()} (${yieldQuality ?: "unknown"})"
        !yieldQuality.isNullOrBlank() && yieldQuality != "UNKNOWN" ->
            yieldQuality.replace('_', ' ')
        else -> null
    }

    return CycleSummary(
        id = id,
        year = cycleYear,
        summary = cycleSummary ?: "Cycle summary not available yet.",
        harvestWindow = harvestWindow,
        floweringDate = observedFloweringAt.toDisplayDateLabel(),
        fruitSetDate = observedFruitSetAt.toDisplayDateLabel(),
        yieldSummary = yieldSummary,
        flowerDropLevel = flowerDropLevel?.takeUnless { it == "UNKNOWN" },
        fruitDropLevel = fruitDropLevel?.takeUnless { it == "UNKNOWN" },
        stressScore = stressScore ?: 0,
        pestPressureScore = pestPressureScore ?: 0,
        treatmentCount = treatmentCount ?: 0,
        nextActions = recommendedNextCycleActions.orEmpty(),
        recentEventLabels = recentEvents.map { it.type.toUiModel().toReadableLabel() }
    )
}

private fun PlantTaskDto.toUiModel(): PlantTask {
    return PlantTask(
        id = id,
        title = title,
        type = type.toReadableLabel(),
        priority = priority.toReadableLabel(),
        status = status.toReadableLabel(),
        source = source.toReadableLabel(),
        cycleLabel = cycleYear?.let { "$it Cycle" },
        dueAt = dueDate,
        dueDate = dueDate.toDisplayDateLabel() ?: dueDate,
        sourceSummary = sourceSummary,
        reason = reason
    )
}

private fun MitigationPlanDto.toUiModel(): MitigationPlan {
    return MitigationPlan(
        cycleYear = cycleYear,
        summary = summary,
        likelyIssues = likelyIssues,
        whatToChange = whatToChange,
        watchEarly = watchEarly,
        priorityActions = priorityActions,
        completedTasks = completedTasks,
        skippedTasks = skippedTasks,
        pendingTasks = pendingTasks
    )
}

private fun PlantIdentityDto.toUiModel(): ResolvedPlantIdentity {
    return ResolvedPlantIdentity(
        id = id,
        displayName = displayName,
        speciesFamily = speciesFamily,
        species = species,
        variety = variety,
        plantType = plantType,
        matchedAlias = matchedAlias
    )
}

private fun PlantCategoryDto.toUiModel(): PlantCategory {
    return when (this) {
        PlantCategoryDto.FRUIT_BEARING -> PlantCategory.FRUIT_BEARING
        PlantCategoryDto.NON_FRUIT_BEARING -> PlantCategory.NON_FRUIT_BEARING
        PlantCategoryDto.ORNAMENTAL -> PlantCategory.ORNAMENTAL
    }
}

private fun PlantCategory.toDto(): PlantCategoryDto {
    return when (this) {
        PlantCategory.FRUIT_BEARING -> PlantCategoryDto.FRUIT_BEARING
        PlantCategory.NON_FRUIT_BEARING -> PlantCategoryDto.NON_FRUIT_BEARING
        PlantCategory.ORNAMENTAL -> PlantCategoryDto.ORNAMENTAL
    }
}

private fun RecordKindDto.toUiModel(): RecordKind {
    return when (this) {
        RecordKindDto.TREE -> RecordKind.TREE
        RecordKindDto.FLOWER -> RecordKind.FLOWER
        RecordKindDto.CROP -> RecordKind.CROP
    }
}

private fun RecordKind.toDto(): RecordKindDto {
    return when (this) {
        RecordKind.TREE -> RecordKindDto.TREE
        RecordKind.FLOWER -> RecordKindDto.FLOWER
        RecordKind.CROP -> RecordKindDto.CROP
    }
}

private fun GrowthHabitDto.toUiModel(): GrowthHabit {
    return when (this) {
        GrowthHabitDto.PERENNIAL -> GrowthHabit.PERENNIAL
        GrowthHabitDto.ANNUAL -> GrowthHabit.ANNUAL
        GrowthHabitDto.BIENNIAL -> GrowthHabit.BIENNIAL
        GrowthHabitDto.SEASONAL -> GrowthHabit.SEASONAL
        GrowthHabitDto.UNKNOWN -> GrowthHabit.UNKNOWN
    }
}

private fun GrowthHabit.toDto(): GrowthHabitDto {
    return when (this) {
        GrowthHabit.PERENNIAL -> GrowthHabitDto.PERENNIAL
        GrowthHabit.ANNUAL -> GrowthHabitDto.ANNUAL
        GrowthHabit.BIENNIAL -> GrowthHabitDto.BIENNIAL
        GrowthHabit.SEASONAL -> GrowthHabitDto.SEASONAL
        GrowthHabit.UNKNOWN -> GrowthHabitDto.UNKNOWN
    }
}

private fun RecordPatternDto.toUiModel(): RecordPattern {
    return when (this) {
        RecordPatternDto.LONG_LIVED -> RecordPattern.LONG_LIVED
        RecordPatternDto.RECURRING_SEASONAL -> RecordPattern.RECURRING_SEASONAL
        RecordPatternDto.ONE_OFF_SEASON -> RecordPattern.ONE_OFF_SEASON
    }
}

private fun RecordPattern.toDto(): RecordPatternDto {
    return when (this) {
        RecordPattern.LONG_LIVED -> RecordPatternDto.LONG_LIVED
        RecordPattern.RECURRING_SEASONAL -> RecordPatternDto.RECURRING_SEASONAL
        RecordPattern.ONE_OFF_SEASON -> RecordPatternDto.ONE_OFF_SEASON
    }
}

private fun LifecycleStageDto.toUiModel(): LifecycleStage {
    return when (this) {
        LifecycleStageDto.SAPLING -> LifecycleStage.SAPLING
        LifecycleStageDto.JUVENILE -> LifecycleStage.JUVENILE
        LifecycleStageDto.FIRST_FLOWERING -> LifecycleStage.FLOWERING
        LifecycleStageDto.FIRST_HARVEST -> LifecycleStage.FIRST_HARVEST
        LifecycleStageDto.MATURE_BEARING -> LifecycleStage.MATURE
    }
}

private fun LifecycleStage.toDto(): LifecycleStageDto {
    return when (this) {
        LifecycleStage.SAPLING -> LifecycleStageDto.SAPLING
        LifecycleStage.JUVENILE -> LifecycleStageDto.JUVENILE
        LifecycleStage.FLOWERING -> LifecycleStageDto.FIRST_FLOWERING
        LifecycleStage.FIRST_HARVEST -> LifecycleStageDto.FIRST_HARVEST
        LifecycleStage.MATURE -> LifecycleStageDto.MATURE_BEARING
    }
}

private fun String?.inferPlantingDatePrecision(): PlantingDatePrecisionDto? {
    val value = this?.trim().takeUnless { it.isNullOrBlank() } ?: return null
    return when {
        Regex("^\\d{4}$").matches(value) -> PlantingDatePrecisionDto.YEAR
        Regex("^\\d{4}-\\d{1,2}$").matches(value) -> PlantingDatePrecisionDto.MONTH_YEAR
        else -> PlantingDatePrecisionDto.EXACT_DATE
    }
}

private fun LogTypeDto.toUiModel(): LogType {
    return when (this) {
        LogTypeDto.PLANTING -> LogType.PLANTING
        LogTypeDto.PHOTO -> LogType.PHOTO
        LogTypeDto.NOTE -> LogType.NOTE
        LogTypeDto.WATERING -> LogType.WATERING
        LogTypeDto.WATERING_STRESS -> LogType.WATERING_STRESS
        LogTypeDto.PRUNING -> LogType.PRUNING
        LogTypeDto.FEEDING -> LogType.FEEDING
        LogTypeDto.FLOWERING -> LogType.FLOWERING
        LogTypeDto.FLOWER_DROP -> LogType.FLOWER_DROP
        LogTypeDto.FRUIT_SET -> LogType.FRUIT_SET
        LogTypeDto.FRUIT_DROP -> LogType.FRUIT_DROP
        LogTypeDto.HARVEST -> LogType.HARVEST
        LogTypeDto.PEST_DIAGNOSIS -> LogType.PEST
        LogTypeDto.TREATMENT -> LogType.TREATMENT
        LogTypeDto.DIAGNOSIS -> LogType.DIAGNOSIS
        LogTypeDto.WEATHER_DAMAGE -> LogType.WEATHER_DAMAGE
        LogTypeDto.SOWING -> LogType.SOWING
        LogTypeDto.TRANSPLANTING -> LogType.TRANSPLANTING
        LogTypeDto.GERMINATION -> LogType.GERMINATION
        LogTypeDto.THINNING -> LogType.THINNING
        LogTypeDto.BOLTING -> LogType.BOLTING
        LogTypeDto.PINCHING -> LogType.PINCHING
        LogTypeDto.DEADHEADING -> LogType.DEADHEADING
        LogTypeDto.BLOOM_PEAK -> LogType.BLOOM_PEAK
        LogTypeDto.SEASON_END -> LogType.SEASON_END
    }
}

private fun LogType.toDto(): LogTypeDto {
    return when (this) {
        LogType.PLANTING -> LogTypeDto.PLANTING
        LogType.PHOTO -> LogTypeDto.PHOTO
        LogType.NOTE -> LogTypeDto.NOTE
        LogType.WATERING -> LogTypeDto.WATERING
        LogType.WATERING_STRESS -> LogTypeDto.WATERING_STRESS
        LogType.PRUNING -> LogTypeDto.PRUNING
        LogType.FEEDING -> LogTypeDto.FEEDING
        LogType.FLOWERING -> LogTypeDto.FLOWERING
        LogType.FLOWER_DROP -> LogTypeDto.FLOWER_DROP
        LogType.FRUIT_SET -> LogTypeDto.FRUIT_SET
        LogType.FRUIT_DROP -> LogTypeDto.FRUIT_DROP
        LogType.HARVEST -> LogTypeDto.HARVEST
        LogType.PEST -> LogTypeDto.PEST_DIAGNOSIS
        LogType.TREATMENT -> LogTypeDto.TREATMENT
        LogType.DIAGNOSIS -> LogTypeDto.DIAGNOSIS
        LogType.WEATHER_DAMAGE -> LogTypeDto.WEATHER_DAMAGE
        LogType.SOWING -> LogTypeDto.SOWING
        LogType.TRANSPLANTING -> LogTypeDto.TRANSPLANTING
        LogType.GERMINATION -> LogTypeDto.GERMINATION
        LogType.THINNING -> LogTypeDto.THINNING
        LogType.BOLTING -> LogTypeDto.BOLTING
        LogType.PINCHING -> LogTypeDto.PINCHING
        LogType.DEADHEADING -> LogTypeDto.DEADHEADING
        LogType.BLOOM_PEAK -> LogTypeDto.BLOOM_PEAK
        LogType.SEASON_END -> LogTypeDto.SEASON_END
    }
}

private fun String?.toAgeLabel(): String {
    if (this.isNullOrBlank()) return "Age unknown"
    return try {
        val plantedAt = OffsetDateTime.parse(this).toLocalDate()
        val now = OffsetDateTime.now(ZoneId.systemDefault()).toLocalDate()
        val years = ChronoUnit.YEARS.between(plantedAt, now)
        val months = ChronoUnit.MONTHS.between(plantedAt, now)
        when {
            years > 0 -> if (years == 1L) "1 year" else "$years years"
            months > 0 -> if (months == 1L) "1 month" else "$months months"
            else -> "Recently planted"
        }
    } catch (_: Exception) {
        "Age unknown"
    }
}

private fun String.toTimelineLabel(): String {
    return try {
        val eventTime = OffsetDateTime.parse(this)
        val now = OffsetDateTime.now()
        val days = ChronoUnit.DAYS.between(eventTime.toLocalDate(), now.toLocalDate())
        when {
            days <= 0 -> "Today"
            days == 1L -> "Yesterday"
            days < 7 -> "$days days ago"
            days < 30 -> "${days / 7} weeks ago"
            days < 365 -> "${days / 30} months ago"
            else -> "${days / 365} years ago"
        }
    } catch (_: Exception) {
        this
    }
}

private fun String?.toDisplayDateLabel(): String? {
    if (this.isNullOrBlank()) return null
    return try {
        OffsetDateTime.parse(this).toLocalDate().toString()
    } catch (_: Exception) {
        this
    }
}

private fun Double.toDisplayNumber(): String {
    return if (this % 1.0 == 0.0) {
        toInt().toString()
    } else {
        toString()
    }
}

private fun TaskTypeDto.toReadableLabel(): String {
    return when (this) {
        TaskTypeDto.WATER -> "Water"
        TaskTypeDto.INSPECT -> "Inspect"
        TaskTypeDto.OBSERVE -> "Observe"
        TaskTypeDto.PRUNE -> "Prune"
        TaskTypeDto.FEED -> "Feed"
        TaskTypeDto.HARVEST -> "Harvest"
        TaskTypeDto.TREAT -> "Treat"
    }
}

private fun TaskPriorityDto.toReadableLabel(): String {
    return name.lowercase().replaceFirstChar { it.uppercase() }
}

private fun TaskStatusDto.toReadableLabel(): String {
    return name.lowercase().replaceFirstChar { it.uppercase() }
}

private fun TaskSourceDto.toReadableLabel(): String {
    return when (this) {
        TaskSourceDto.SYSTEM -> "System"
        TaskSourceDto.SEASONAL_PACK -> "Seasonal"
        TaskSourceDto.PERSONALIZED_OVERLAY -> "Personalized"
        TaskSourceDto.MANUAL -> "Manual"
        TaskSourceDto.AI_DIAGNOSIS -> "Diagnosis"
    }
}

private fun LogType.toReadableLabel(): String {
    return when (this) {
        LogType.PLANTING -> "Planting"
        LogType.PHOTO -> "Photo"
        LogType.NOTE -> "Note"
        LogType.WATERING -> "Watering"
        LogType.WATERING_STRESS -> "Water Stress"
        LogType.PRUNING -> "Pruning"
        LogType.FEEDING -> "Feeding"
        LogType.FLOWERING -> "Flowering"
        LogType.FLOWER_DROP -> "Flower Drop"
        LogType.FRUIT_SET -> "Fruit Set"
        LogType.FRUIT_DROP -> "Fruit Drop"
        LogType.HARVEST -> "Harvest"
        LogType.PEST -> "Pest Diagnosis"
        LogType.TREATMENT -> "Treatment"
        LogType.DIAGNOSIS -> "Diagnosis"
        LogType.WEATHER_DAMAGE -> "Weather Damage"
        LogType.SOWING -> "Sowing"
        LogType.TRANSPLANTING -> "Transplant"
        LogType.GERMINATION -> "Germination"
        LogType.THINNING -> "Thinning"
        LogType.BOLTING -> "Bolting"
        LogType.PINCHING -> "Pinching"
        LogType.DEADHEADING -> "Deadheading"
        LogType.BLOOM_PEAK -> "Bloom Peak"
        LogType.SEASON_END -> "Season End"
    }
}

private fun defaultLogContent(type: LogTypeDto): String {
    return when (type) {
        LogTypeDto.PLANTING -> "Planting milestone recorded"
        LogTypeDto.PHOTO -> "Photo added"
        LogTypeDto.NOTE -> "Observation recorded"
        LogTypeDto.WATERING -> "Watering recorded"
        LogTypeDto.WATERING_STRESS -> "Water stress recorded"
        LogTypeDto.PRUNING -> "Pruning recorded"
        LogTypeDto.FEEDING -> "Feeding recorded"
        LogTypeDto.FLOWERING -> "Flowering recorded"
        LogTypeDto.FLOWER_DROP -> "Flower drop recorded"
        LogTypeDto.FRUIT_SET -> "Fruit set recorded"
        LogTypeDto.FRUIT_DROP -> "Fruit drop recorded"
        LogTypeDto.HARVEST -> "Harvest recorded"
        LogTypeDto.PEST_DIAGNOSIS -> "Pest diagnosis recorded"
        LogTypeDto.TREATMENT -> "Treatment recorded"
        LogTypeDto.DIAGNOSIS -> "Diagnosis recorded"
        LogTypeDto.WEATHER_DAMAGE -> "Weather damage recorded"
        LogTypeDto.SOWING -> "Sowing recorded"
        LogTypeDto.TRANSPLANTING -> "Transplant recorded"
        LogTypeDto.GERMINATION -> "Germination observed"
        LogTypeDto.THINNING -> "Thinning recorded"
        LogTypeDto.BOLTING -> "Bolting noticed"
        LogTypeDto.PINCHING -> "Pinching recorded"
        LogTypeDto.DEADHEADING -> "Deadheading recorded"
        LogTypeDto.BLOOM_PEAK -> "Bloom peak observed"
        LogTypeDto.SEASON_END -> "Season closed"
    }
}

private fun LogDraft.toMetadata(): JsonObject? {
    val metadata = JsonObject()
    severity?.takeIf { it.isNotBlank() }?.let { metadata.add("severity", JsonPrimitive(it)) }
    harvestQuantityValue?.takeIf { it.isNotBlank() }?.let { metadata.add("quantity_value", JsonPrimitive(it)) }
    harvestQuantityUnit?.takeIf { it.isNotBlank() }?.let { metadata.add("quantity_unit", JsonPrimitive(it)) }
    quality?.takeIf { it.isNotBlank() }?.let { metadata.add("quality", JsonPrimitive(it)) }
    harvestLossCategory?.takeIf { it.isNotBlank() }?.let { metadata.add("loss_category", JsonPrimitive(it)) }
    harvestLossNote?.takeIf { it.isNotBlank() }?.let { metadata.add("loss_note", JsonPrimitive(it)) }
    fruitSetStrength?.takeIf { it.isNotBlank() }?.let { metadata.add("fruit_set_strength", JsonPrimitive(it)) }
    pruningType?.takeIf { it.isNotBlank() }?.let { metadata.add("pruning_type", JsonPrimitive(it)) }
    feedingType?.takeIf { it.isNotBlank() }?.let { metadata.add("feeding_type", JsonPrimitive(it)) }
    return metadata.takeIf { it.size() > 0 }
}

private fun String?.toEventAtIso(): String? {
    val normalized = this?.trim().orEmpty()
    if (normalized.isBlank()) return null
    return when {
        Regex("""\d{4}-\d{2}-\d{2}""").matches(normalized) -> "${normalized}T12:00:00.000Z"
        Regex("""\d{4}-\d{2}""").matches(normalized) -> "${normalized}-01T12:00:00.000Z"
        Regex("""\d{4}""").matches(normalized) -> "${normalized}-01-01T12:00:00.000Z"
        else -> normalized
    }
}

private fun JsonObject?.toDisplayMap(): Map<String, String> {
    if (this == null || size() == 0) return emptyMap()
    val orderedKeys = listOf(
        "severity",
        "quantity_value",
        "quantity_unit",
        "quality",
        "loss_category",
        "loss_note",
        "fruit_set_strength",
        "pruning_type",
        "feeding_type"
    )
    return orderedKeys.mapNotNull { key ->
        get(key)
            ?.takeIf(JsonElement::isJsonPrimitive)
            ?.asString
            ?.takeIf { it.isNotBlank() }
            ?.let { key to it }
    }.toMap()
}
