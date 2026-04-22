package com.bagicha.app.ui.features.ledger

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bagicha.app.data.remote.AddLogBody
import com.bagicha.app.data.remote.CreateTreeBody
import com.bagicha.app.data.remote.LifecycleStageDto
import com.bagicha.app.data.remote.LogTypeDto
import com.bagicha.app.data.remote.TreeDto
import com.bagicha.app.data.remote.TreeLogDto
import com.bagicha.app.data.remote.TreeTypeDto
import com.bagicha.app.domain.repository.LedgerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import javax.inject.Inject

enum class LifecycleStage { SAPLING, JUVENILE, FLOWERING, MATURE }
enum class LogType { PHOTO, NOTE, HARVEST, PEST, TREATMENT }
enum class TreeCategory { FRUIT_BEARING, NON_FRUIT_BEARING, ORNAMENTAL }

data class Tree(
    val id: String,
    val name: String,
    val species: String,
    val variety: String?,
    val type: TreeCategory,
    val stage: LifecycleStage,
    val health: String,
    val plantingDate: String?,
    val age: String,
    val logCount: Int = 0
)

data class TreeDraft(
    val name: String = "",
    val species: String = "",
    val variety: String = "",
    val plantingDate: String = "",
    val type: TreeCategory = TreeCategory.FRUIT_BEARING,
    val stage: LifecycleStage = LifecycleStage.SAPLING
)

data class TreeLog(
    val id: String,
    val type: LogType,
    val date: String,
    val content: String,
    val photoUrl: String? = null
)

data class LogDraft(
    val type: LogType = LogType.NOTE,
    val content: String = ""
)

@HiltViewModel
class LedgerViewModel @Inject constructor(
    private val ledgerRepository: LedgerRepository
) : ViewModel() {

    private val _trees = MutableStateFlow<List<Tree>>(emptyList())
    val trees: StateFlow<List<Tree>> = _trees.asStateFlow()

    private val _selectedTree = MutableStateFlow<Tree?>(null)
    val selectedTree: StateFlow<Tree?> = _selectedTree.asStateFlow()

    private val _timeline = MutableStateFlow<List<TreeLog>>(emptyList())
    val timeline: StateFlow<List<TreeLog>> = _timeline.asStateFlow()

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
                val response = ledgerRepository.getTrees()
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

    fun selectTree(treeId: String) {
        _selectedTreeId.value = treeId
        _selectedTree.value = _trees.value.find { it.id == treeId }
        loadSelectedTree()
        loadTimeline()
    }

    fun loadSelectedTree() {
        val treeId = _selectedTreeId.value ?: return
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val response = ledgerRepository.getTreeDetail(treeId)
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

    fun loadTimeline() {
        val treeId = _selectedTreeId.value ?: return
        viewModelScope.launch {
            _error.value = null
            try {
                val response = ledgerRepository.getTreeTimeline(treeId)
                if (response.success) {
                    _timeline.value = response.data.orEmpty().map { it.toUiModel() }
                } else {
                    _error.value = response.error?.message ?: "Failed to load timeline"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to load timeline"
            }
        }
    }

    fun createTree(
        name: String,
        species: String,
        variety: String,
        type: TreeCategory,
        plantingDate: String?,
        stage: LifecycleStage,
        onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            _isSubmitting.value = true
            _error.value = null
            try {
                val response = ledgerRepository.createTree(
                    CreateTreeBody(
                        name = name.trim(),
                        species = species.trim(),
                        variety = variety.trim().ifBlank { null },
                        type = type.toDto(),
                        plantingDate = plantingDate?.trim().takeUnless { it.isNullOrBlank() },
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

    fun currentDraft(isEditMode: Boolean): TreeDraft {
        val tree = if (isEditMode) _selectedTree.value else null
        return if (tree == null) {
            TreeDraft()
        } else {
            TreeDraft(
                name = tree.name,
                species = tree.species,
                variety = tree.variety.orEmpty(),
                plantingDate = tree.plantingDate?.take(10).orEmpty(),
                type = tree.type,
                stage = tree.stage
            )
        }
    }

    fun saveTree(
        isEditMode: Boolean,
        name: String,
        species: String,
        variety: String,
        type: TreeCategory,
        plantingDate: String?,
        stage: LifecycleStage,
        onSuccess: () -> Unit
    ) {
        if (isEditMode) {
            updateTree(
                name = name,
                species = species,
                variety = variety,
                type = type,
                plantingDate = plantingDate,
                stage = stage,
                onSuccess = onSuccess
            )
        } else {
            createTree(
                name = name,
                species = species,
                variety = variety,
                type = type,
                plantingDate = plantingDate,
                stage = stage,
                onSuccess = onSuccess
            )
        }
    }

    private fun updateTree(
        name: String,
        species: String,
        variety: String,
        type: TreeCategory,
        plantingDate: String?,
        stage: LifecycleStage,
        onSuccess: () -> Unit
    ) {
        val treeId = _editingTreeId.value ?: _selectedTreeId.value ?: return
        viewModelScope.launch {
            _isSubmitting.value = true
            _error.value = null
            try {
                val response = ledgerRepository.updateTree(
                    treeId,
                    CreateTreeBody(
                        name = name.trim(),
                        species = species.trim(),
                        variety = variety.trim().ifBlank { null },
                        type = type.toDto(),
                        plantingDate = plantingDate?.trim().takeUnless { it.isNullOrBlank() },
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
        val treeId = _selectedTreeId.value ?: return
        viewModelScope.launch {
            _isSubmitting.value = true
            _error.value = null
            try {
                val response = ledgerRepository.addTreeLog(
                    treeId,
                    AddLogBody(
                        type = draft.type.toDto(),
                        content = draft.content.trim().ifBlank { null }
                    )
                )
                if (response.success && response.data != null) {
                    _timeline.value = listOf(response.data.toUiModel()) + _timeline.value
                    loadSelectedTree()
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

    private fun syncSelectedTreeFromList() {
        val selectedId = _selectedTreeId.value ?: return
        _selectedTree.value = _trees.value.find { it.id == selectedId }
    }
}

private fun List<Tree>.replaceTree(tree: Tree): List<Tree> {
    return map { existing -> if (existing.id == tree.id) tree else existing }
}

private fun TreeDto.toUiModel(): Tree {
    return Tree(
        id = id,
        name = name,
        species = species,
        variety = variety,
        type = type.toUiModel(),
        stage = lifecycleStage.toUiModel(),
        health = healthStatus,
        plantingDate = plantingDate,
        age = plantingDate.toAgeLabel(),
        logCount = count?.logs ?: 0
    )
}

private fun TreeLogDto.toUiModel(): TreeLog {
    return TreeLog(
        id = id,
        type = type.toUiModel(),
        date = timestamp.toTimelineLabel(),
        content = content ?: defaultLogContent(type),
        photoUrl = null
    )
}

private fun TreeTypeDto.toUiModel(): TreeCategory {
    return when (this) {
        TreeTypeDto.FRUIT_BEARING -> TreeCategory.FRUIT_BEARING
        TreeTypeDto.NON_FRUIT_BEARING -> TreeCategory.NON_FRUIT_BEARING
        TreeTypeDto.ORNAMENTAL -> TreeCategory.ORNAMENTAL
    }
}

private fun TreeCategory.toDto(): TreeTypeDto {
    return when (this) {
        TreeCategory.FRUIT_BEARING -> TreeTypeDto.FRUIT_BEARING
        TreeCategory.NON_FRUIT_BEARING -> TreeTypeDto.NON_FRUIT_BEARING
        TreeCategory.ORNAMENTAL -> TreeTypeDto.ORNAMENTAL
    }
}

private fun LifecycleStageDto.toUiModel(): LifecycleStage {
    return when (this) {
        LifecycleStageDto.SAPLING -> LifecycleStage.SAPLING
        LifecycleStageDto.JUVENILE -> LifecycleStage.JUVENILE
        LifecycleStageDto.FIRST_FLOWERING -> LifecycleStage.FLOWERING
        LifecycleStageDto.MATURE_BEARING -> LifecycleStage.MATURE
    }
}

private fun LifecycleStage.toDto(): LifecycleStageDto {
    return when (this) {
        LifecycleStage.SAPLING -> LifecycleStageDto.SAPLING
        LifecycleStage.JUVENILE -> LifecycleStageDto.JUVENILE
        LifecycleStage.FLOWERING -> LifecycleStageDto.FIRST_FLOWERING
        LifecycleStage.MATURE -> LifecycleStageDto.MATURE_BEARING
    }
}

private fun LogTypeDto.toUiModel(): LogType {
    return when (this) {
        LogTypeDto.PHOTO -> LogType.PHOTO
        LogTypeDto.NOTE -> LogType.NOTE
        LogTypeDto.HARVEST -> LogType.HARVEST
        LogTypeDto.PEST_DIAGNOSIS -> LogType.PEST
        LogTypeDto.TREATMENT -> LogType.TREATMENT
    }
}

private fun LogType.toDto(): LogTypeDto {
    return when (this) {
        LogType.PHOTO -> LogTypeDto.PHOTO
        LogType.NOTE -> LogTypeDto.NOTE
        LogType.HARVEST -> LogTypeDto.HARVEST
        LogType.PEST -> LogTypeDto.PEST_DIAGNOSIS
        LogType.TREATMENT -> LogTypeDto.TREATMENT
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

private fun defaultLogContent(type: LogTypeDto): String {
    return when (type) {
        LogTypeDto.PHOTO -> "Photo added"
        LogTypeDto.NOTE -> "Observation recorded"
        LogTypeDto.HARVEST -> "Harvest recorded"
        LogTypeDto.PEST_DIAGNOSIS -> "Pest diagnosis recorded"
        LogTypeDto.TREATMENT -> "Treatment recorded"
    }
}
