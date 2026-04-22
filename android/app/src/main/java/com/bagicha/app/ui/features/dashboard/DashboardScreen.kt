package com.bagicha.app.ui.features.dashboard

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
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
    navController: NavController
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
                onClick = { /* AI Mentor */ },
                containerColor = PrimaryForest,
                contentColor = Color.White,
                shape = FullRounded,
                modifier = Modifier.size(56.dp)
            ) {
                Icon(Icons.Default.AutoAwesome, null, modifier = Modifier.size(28.dp))
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // 1. Sticky Header
            stickyHeader {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(SurfaceBase.copy(alpha = 0.95f))
                        .padding(horizontal = 24.dp, vertical = 12.dp)
                ) {
                    DashboardHeader(weather = weather)
                }
                Divider(color = GhostBorderNeutral, thickness = 0.5.dp)
            }

            item { Spacer(modifier = Modifier.height(16.dp)) }

            // 2. Critical Alert (High Density)
            alert?.let {
                item {
                    Box(modifier = Modifier.padding(horizontal = 24.dp)) {
                        UrgentAlertCardDense(alert = it, onDismiss = { viewModel.dismissAlert() })
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }

            if (showFirstEntryPrompt) {
                item {
                    Box(modifier = Modifier.padding(horizontal = 24.dp)) {
                        FirstLedgerEntryCard(
                            onCreateEntry = { navController.navigate(Screen.AddTree.route) }
                        )
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }

            // 3. Bento Grid (Reduced Height for Density)
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(modifier = Modifier.weight(1f)) {
                        RipeningInsightCardDense()
                    }
                    Box(modifier = Modifier.weight(1.2f)) {
                        VisualAssetBleedDense()
                    }
                }
                Spacer(modifier = Modifier.height(32.dp))
            }

            // 4. Daily Docket (High Density)
            item {
                Text(
                    text = "TODAY'S TASKS",
                    modifier = Modifier.padding(horizontal = 24.dp),
                    style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                    color = OnSurfaceMuted
                )
                Spacer(modifier = Modifier.height(12.dp))
            }

            items(tasks) { task ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 4.dp)
                        .background(SurfaceContainerLow, Shapes.large)
                ) {
                    TaskItemDense(task = task, onToggle = { viewModel.toggleTask(task.id) })
                }
            }
            
            item { Spacer(modifier = Modifier.height(100.dp)) }
        }
    }
}
