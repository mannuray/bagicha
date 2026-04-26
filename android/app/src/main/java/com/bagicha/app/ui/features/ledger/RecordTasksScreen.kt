package com.bagicha.app.ui.features.ledger

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.bagicha.app.data.remote.TaskStatusDto
import com.bagicha.app.ui.theme.PrimaryForest
import com.bagicha.app.ui.theme.SecondaryTerracotta
import com.bagicha.app.ui.theme.SurfaceBase

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun RecordTasksScreen(
    viewModel: LedgerViewModel,
    navController: NavController
) {
    val tree by viewModel.selectedTree.collectAsState()
    val tasks by viewModel.tasks.collectAsState()
    val isSubmitting by viewModel.isSubmitting.collectAsState()

    Scaffold(
        containerColor = SurfaceBase,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("${tree?.recordKind?.recordKindLabel() ?: "Record"} Tasks", color = PrimaryForest)
                        Text("TASKS FOR ${tree?.name?.uppercase() ?: "THIS RECORD"}", color = SecondaryTerracotta)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, null, tint = PrimaryForest)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceBase)
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(
                top = paddingValues.calculateTopPadding(),
                bottom = paddingValues.calculateBottomPadding() + 24.dp
            ),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            item {
                TreeTasksSection(
                    recordKind = tree?.recordKind ?: RecordKind.TREE,
                    tasks = tasks,
                    isSubmitting = isSubmitting,
                    onSyncTasks = { viewModel.syncTreeTasks() },
                    onCompleteTask = { taskId -> viewModel.updateTaskStatus(taskId, TaskStatusDto.COMPLETED) },
                    onSkipTask = { taskId -> viewModel.updateTaskStatus(taskId, TaskStatusDto.SKIPPED) }
                )
            }
        }
    }
}

private fun RecordKind.recordKindLabel(): String {
    return when (this) {
        RecordKind.TREE -> "Tree"
        RecordKind.FLOWER -> "Flower"
        RecordKind.CROP -> "Crop"
    }
}
