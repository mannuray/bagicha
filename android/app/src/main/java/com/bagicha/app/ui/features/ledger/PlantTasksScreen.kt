package com.bagicha.app.ui.features.ledger

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.bagicha.app.data.remote.TaskStatusDto
import com.bagicha.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlantTasksScreen(
    viewModel: LedgerViewModel,
    navController: NavController
) {
    val tree by viewModel.selectedTree.collectAsState()
    val tasks by viewModel.tasks.collectAsState()
    val isSubmitting by viewModel.isSubmitting.collectAsState()

    val navBackStackEntry = navController.currentBackStackEntry
    val treeIdFromNav = navBackStackEntry?.arguments?.getString("plantId")

    LaunchedEffect(treeIdFromNav) {
        treeIdFromNav?.let { id ->
            viewModel.loadSelectedTree(id)
            viewModel.loadTasks(id)
        }
    }

    Scaffold(containerColor = SurfaceBase) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = paddingValues.calculateBottomPadding())
        ) {
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
                            .clip(CircleShape)
                            .background(SurfaceContainerLow)
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
                        style = MaterialTheme.typography.headlineLarge.copy(
                            fontSize = 44.sp,
                            fontStyle = FontStyle.Italic
                        ),
                        color = PrimaryForest
                    )
                    tree?.name?.takeIf { it.isNotBlank() }?.let { name ->
                        Text(
                            text = "FOR ${name.uppercase()}",
                            style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 1.sp),
                            color = OnSurfaceMuted
                        )
                    }
                }
            }

            item {
                TreeTasksSection(
                    recordKind = tree?.recordKind ?: RecordKind.TREE,
                    tasks = tasks,
                    isSubmitting = isSubmitting,
                    onSyncTasks = { viewModel.syncTreeTasks() },
                    onCompleteTask = { id -> viewModel.updateTaskStatus(id, TaskStatusDto.COMPLETED) },
                    onSkipTask = { id -> viewModel.updateTaskStatus(id, TaskStatusDto.SKIPPED) }
                )
            }

            item { Spacer(modifier = Modifier.height(100.dp)) }
        }
    }
}
