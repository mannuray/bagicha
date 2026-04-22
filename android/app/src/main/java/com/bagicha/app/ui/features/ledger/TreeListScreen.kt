package com.bagicha.app.ui.features.ledger

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Nature
import androidx.compose.material3.*
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.bagicha.app.ui.navigation.BottomNavigationBar
import com.bagicha.app.ui.navigation.Screen
import com.bagicha.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TreeListScreen(
    viewModel: LedgerViewModel,
    navController: NavController
) {
    val trees by viewModel.trees.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadTrees()
    }

    Scaffold(
        containerColor = SurfaceBase,
        bottomBar = { BottomNavigationBar(navController = navController) },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate(Screen.AddTree.route) },
                containerColor = PrimaryForest,
                contentColor = Color.White,
                shape = FullRounded,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Icon(Icons.Default.Add, null, modifier = Modifier.size(28.dp))
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 24.dp)
        ) {
            // 0. Top Padding Spacer
            item { Spacer(modifier = Modifier.height(24.dp)) }

            // 1. Editorial Header
            item {
                Text(
                    text = "CURATED COLLECTION",
                    style = MaterialTheme.typography.labelMedium,
                    color = SecondaryTerracotta
                )
                Text(
                    text = "Orchard",
                    style = MaterialTheme.typography.headlineLarge.copy(fontSize = 48.sp),
                    color = PrimaryForest
                )
                Box(modifier = Modifier.size(width = 48.dp, height = 4.dp).background(PrimaryForestContainer, FullRounded))
                Spacer(modifier = Modifier.height(32.dp))
            }

            error?.let { message ->
                item {
                    Text(
                        text = message,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.error
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }

            if (isLoading && trees.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 48.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = PrimaryForest)
                    }
                }
            } else if (trees.isEmpty()) {
                item {
                    AddSuggestionCard(onRegister = { navController.navigate(Screen.AddTree.route) })
                    Spacer(modifier = Modifier.height(32.dp))
                }
            }

            // 2. Asymmetric Bento Grid (Custom Logic)
            if (trees.isNotEmpty()) item {
                val chunks = trees.chunked(2)
                chunks.forEachIndexed { rowIndex, rowTrees ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(24.dp)
                    ) {
                        rowTrees.forEachIndexed { colIndex, tree ->
                            val index = rowIndex * 2 + colIndex
                            // Apply asymmetric vertical offsets
                            val verticalOffset = if (index % 3 == 1) 48.dp else 0.dp
                            
                            Box(modifier = Modifier.weight(1f).offset(y = verticalOffset)) {
                                VisualTreeCard(
                                    tree = tree,
                                    shape = PebbleShapes[index % PebbleShapes.size],
                                    onClick = {
                                        viewModel.selectTree(tree.id)
                                        navController.navigate(Screen.TreeDetail.route)
                                    }
                                )
                            }
                        }
                        if (rowTrees.size == 1) {
                            // Add Suggestion / Empty State Card
                            Box(modifier = Modifier.weight(1f).offset(y = 48.dp)) {
                                AddSuggestionCard(onRegister = { navController.navigate(Screen.AddTree.route) })
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(72.dp)) // Extra gap for offsets
                }
            }
            
            item { Spacer(modifier = Modifier.height(100.dp)) }
        }
    }
}

@Composable
fun VisualTreeCard(tree: Tree, shape: androidx.compose.ui.graphics.Shape, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(SurfaceContainerLow, Shapes.large)
                .padding(16.dp)
        ) {
            Column {
                Box {
                    PebbleTreeImage(imageUrl = null, shape = shape) // In a real app, imageUrl would be dynamic
                    Box(modifier = Modifier.align(Alignment.TopEnd).padding(8.dp)) {
                        PebbleBadge(stage = tree.stage)
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text(text = tree.name, style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp), color = PrimaryForest)
                Text(text = tree.species, style = MaterialTheme.typography.bodyMedium.copy(fontStyle = FontStyle.Italic))
                if (tree.variety != null) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = tree.variety, style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                }
            }
        }
    }
}

@Composable
fun AddSuggestionCard(onRegister: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(0.7f) // Taller for asymmetry
            .background(SurfaceContainer, Shapes.large)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Default.Nature, null, tint = PrimaryForest, modifier = Modifier.size(32.dp))
            Spacer(modifier = Modifier.height(12.dp))
            Text("New Planting?", style = MaterialTheme.typography.titleLarge.copy(fontSize = 16.sp), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
            Text("Expand your sanctuary.", style = MaterialTheme.typography.bodySmall, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
            Spacer(modifier = Modifier.height(16.dp))
            TextButton(onClick = onRegister) {
                Text("REGISTER", style = MaterialTheme.typography.labelMedium, color = PrimaryForest)
            }
        }
    }
}
