package com.bagicha.app.ui.features.dashboard

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material3.*
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.bagicha.app.ui.navigation.BottomNavigationBar
import com.bagicha.app.ui.navigation.Screen
import com.bagicha.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    navController: NavController,
    onOpenTask: (GardenTask) -> Unit
) {
    val weather by viewModel.weather.collectAsState()
    val alert by viewModel.alert.collectAsState()
    val tasks by viewModel.tasks.collectAsState()
    val showFirstEntryPrompt by viewModel.showFirstEntryPrompt.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.refreshLedgerState()
    }

    Scaffold(
        containerColor = SurfaceBase,
        bottomBar = { BottomNavigationBar(navController = navController) },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate(Screen.AiMentor.route) },
                containerColor = PrimaryForest,
                contentColor = Color.White,
                shape = FullRounded,
                modifier = Modifier.size(56.dp)
            ) {
                Icon(Icons.Default.Psychology, null, modifier = Modifier.size(28.dp))
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = paddingValues.calculateBottomPadding())
        ) {
            // 1. Clean Sticky Header (Journal Style)
            stickyHeader {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(SurfaceBase.copy(alpha = 0.95f))
                        .statusBarsPadding()
                        .padding(horizontal = 24.dp, vertical = 20.dp)
                ) {
                    DashboardHeader(weather = weather)
                }
            }

            // 2. Integrated Biological Pulse
            alert?.let {
                item {
                    Box(modifier = Modifier.padding(horizontal = 24.dp)) {
                        IntegratedObservationTag(alert = it, onDismiss = { viewModel.dismissAlert() })
                    }
                    Spacer(modifier = Modifier.height(32.dp))
                }
            }

            if (showFirstEntryPrompt) {
                item {
                    Box(modifier = Modifier.padding(horizontal = 24.dp)) {
                        FirstLedgerEntryCard(
                            onCreateEntry = { navController.navigate(Screen.AddTree.route) }
                        )
                    }
                    Spacer(modifier = Modifier.height(48.dp))
                }
            }

            // 3. Asymmetric Overlap Bento (Now just the Harvest Insight as a standalone organic card)
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp)
                ) {
                    RipeningInsightPebble()
                }
                Spacer(modifier = Modifier.height(64.dp))
            }

            // 4. Daily Path (Task Feed)
            item {
                Text(
                    text = "THE DAILY PATH",
                    modifier = Modifier.padding(horizontal = 24.dp),
                    style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                    color = OnSurfaceMuted
                )
                Spacer(modifier = Modifier.height(24.dp))
            }

            // Continuous Path Background for tasks
            item {
                Column(
                    modifier = Modifier
                        .padding(horizontal = 24.dp)
                        .fillMaxWidth()
                        .background(SurfaceContainerLow.copy(alpha = 0.5f), Shapes.large)
                        .padding(24.dp)
                ) {
                    tasks.forEachIndexed { index, task ->
                        JournalTaskItem(
                            task = task, 
                            shape = PebbleShapes[index % PebbleShapes.size],
                            onToggle = { viewModel.toggleTask(task.id) },
                            onOpen = { onOpenTask(task) }
                        )
                    }
                }
            }
            
            item { Spacer(modifier = Modifier.height(100.dp)) }
        }
    }
}
