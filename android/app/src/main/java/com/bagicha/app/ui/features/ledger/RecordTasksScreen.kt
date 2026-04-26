package com.bagicha.app.ui.features.ledger

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.bagicha.app.data.remote.TaskStatusDto
import com.bagicha.app.ui.theme.*

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
        containerColor = SurfaceBase
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = paddingValues.calculateBottomPadding())
        ) {
            // 1. Editorial Header
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 24.dp, vertical = 24.dp)
                ) {
                    IconButton(
                        onClick = { navController.popBackStack() },
                        modifier = Modifier
                            .size(40.dp)
                            .background(SurfaceContainerLow, CircleShape)
                    ) {
                        Icon(Icons.Default.ArrowBack, null, tint = PrimaryForest)
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Text(
                        text = "${tree?.recordKind?.displayName()?.uppercase() ?: "RECORD"} TASKS",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                        color = SecondaryTerracotta
                    )
                    Text(
                        text = "The Daily Path",
                        style = MaterialTheme.typography.headlineLarge.copy(fontSize = 48.sp),
                        color = PrimaryForest
                    )
                    Text(
                        text = "MAINTENANCE FOR ${tree?.name?.uppercase() ?: "THIS SPECIMEN"}",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 1.sp),
                        color = OnSurfaceMuted.copy(alpha = 0.6f)
                    )
                }
            }

            // 2. Tasks Feed
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
            
            item { Spacer(modifier = Modifier.height(100.dp)) }
        }
    }
}

private fun RecordKind.displayName(): String {
    return when (this) {
        RecordKind.TREE -> "Tree"
        RecordKind.FLOWER -> "Flower"
        RecordKind.CROP -> "Crop"
    }
}
