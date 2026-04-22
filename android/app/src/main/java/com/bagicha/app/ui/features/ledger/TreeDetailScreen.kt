package com.bagicha.app.ui.features.ledger

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Eco
import androidx.compose.material.icons.filled.EnergySavingsLeaf
import androidx.compose.material.icons.filled.Park
import androidx.compose.material.icons.filled.Yard
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.bagicha.app.R
import com.bagicha.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TreeDetailScreen(
    viewModel: LedgerViewModel,
    navController: NavController
) {
    val tree by viewModel.selectedTree.collectAsState()
    val timeline by viewModel.timeline.collectAsState()
    val isSubmitting by viewModel.isSubmitting.collectAsState()
    val error by viewModel.error.collectAsState()
    var showLogDialog by remember { mutableStateOf(false) }

    tree?.let { currentTree ->
        Scaffold(
            containerColor = SurfaceBase,
            topBar = {
                TopAppBar(
                    title = { },
                    navigationIcon = {
                        Box(
                            modifier = Modifier
                                .padding(8.dp)
                                .size(40.dp)
                                .background(SurfaceBase.copy(alpha = 0.8f), CircleShape)
                                .clip(CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            IconButton(onClick = { navController.popBackStack() }) {
                                Icon(Icons.Default.ArrowBack, null, tint = PrimaryForest)
                            }
                        }
                    },
                    actions = {
                        Box(
                            modifier = Modifier
                                .padding(8.dp)
                                .background(SurfaceBase.copy(alpha = 0.8f), FullRounded)
                                .clip(FullRounded)
                        ) {
                            TextButton(
                                onClick = {
                                    viewModel.startEditingSelectedTree()
                                    navController.navigate(com.bagicha.app.ui.navigation.Screen.EditTree.route)
                                }
                            ) {
                                Text("EDIT REGISTRY", style = MaterialTheme.typography.labelMedium, color = PrimaryForest)
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
                )
            },
            floatingActionButton = {
                // Glassmorphic Log Moment FAB
                Button(
                    onClick = { showLogDialog = true },
                    modifier = Modifier
                        .height(64.dp)
                        .background(PrimaryGradient, FullRounded),
                    shape = FullRounded,
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    contentPadding = PaddingValues(horizontal = 24.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("LOG A MOMENT", style = MaterialTheme.typography.labelMedium, color = Color.White)
                        Spacer(modifier = Modifier.width(12.dp))
                        Box(modifier = Modifier.size(32.dp).background(Color.White.copy(alpha = 0.2f), CircleShape), contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.Add, null, tint = Color.White, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
            ) {
                // 1. Hero Section: Full Overlay Style
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(600.dp)
                    ) {
                        // Background Image
                        AsyncImage(
                            model = R.drawable.leaf_detail,
                            contentDescription = null,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                        
                        // Scrim Gradient for text readability
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        listOf(
                                            Color.Transparent,
                                            Color.Black.copy(alpha = 0.1f),
                                            Color.Black.copy(alpha = 0.8f)
                                        )
                                    )
                                )
                        )

                        // Content Overlay
                        Column(
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .padding(24.dp)
                                .padding(bottom = 32.dp)
                        ) {
                            Text(
                                text = currentTree.type.toHeroLabel(),
                                style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                                color = SecondaryTerracotta
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = currentTree.name.uppercase(),
                                style = MaterialTheme.typography.headlineLarge.copy(
                                    fontSize = 52.sp,
                                    fontWeight = FontWeight.Black,
                                    lineHeight = 56.sp
                                ),
                                color = Color.White
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = currentTree.buildSummary(),
                                style = MaterialTheme.typography.bodyLarge,
                                color = Color.White.copy(alpha = 0.7f),
                                lineHeight = 24.sp
                            )
                        }
                    }
                }

                // 2. Growth Journey Section
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp)
                            .background(SurfaceContainerLow, Shapes.large)
                            .padding(32.dp)
                    ) {
                        Text("Growth Journey", style = MaterialTheme.typography.headlineMedium, color = PrimaryForest)
                        Text("Mapping the physiological evolution.", style = MaterialTheme.typography.bodyMedium)
                        Spacer(modifier = Modifier.height(32.dp))
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            LifecycleStep("Sapling", Icons.Default.Yard, currentTree.stage == LifecycleStage.SAPLING)
                            LifecycleStep("Juvenile", Icons.Default.Eco, currentTree.stage == LifecycleStage.JUVENILE)
                            LifecycleStep("Flowering", Icons.Default.EnergySavingsLeaf, currentTree.stage == LifecycleStage.FLOWERING)
                            LifecycleStep("Mature", Icons.Default.Park, currentTree.stage == LifecycleStage.MATURE)
                        }
                    }
                    Spacer(modifier = Modifier.height(48.dp))
                }

                // 3. Growth Moments (Horizontal Timeline)
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        Column {
                            Text("Growth Moments", style = MaterialTheme.typography.headlineMedium, color = PrimaryForest)
                            Text("CHRONOLOGICAL HISTORY", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
                        }
                        TextButton(onClick = {}) {
                            Text("${timeline.size} ENTRIES", style = MaterialTheme.typography.labelMedium, color = PrimaryForest)
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    if (timeline.isEmpty()) {
                        Text(
                            text = "No moments recorded yet.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = OnSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 24.dp)
                        )
                    } else {
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = 24.dp),
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            items(timeline) { log ->
                                TimelineMomentCard(log = log)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(48.dp))
                }

                // 4. Health Diagnostics
                item {
                    Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(TertiaryContainer, Shapes.large)
                                .padding(24.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.VerifiedUser, null, tint = OnSurfaceNeutral, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("HEALTH DIAGNOSTICS", style = MaterialTheme.typography.labelMedium)
                                }
                                Spacer(modifier = Modifier.height(24.dp))
                                val healthLogs = timeline.filter { it.type == LogType.PEST || it.type == LogType.TREATMENT }
                                if (healthLogs.isEmpty()) {
                                    Text(
                                        text = "No health records logged yet.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = OnSurfaceNeutral.copy(alpha = 0.7f)
                                    )
                                } else {
                                    healthLogs.take(3).forEach { log ->
                                        HealthRecordItem(
                                            title = log.type.displayLabel(),
                                            date = log.date,
                                            status = log.content
                                        )
                                    }
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(100.dp))
                }
            }
        }

        if (showLogDialog) {
            LogMomentDialog(
                isSubmitting = isSubmitting,
                error = error,
                onDismiss = {
                    viewModel.clearError()
                    showLogDialog = false
                },
                onSubmit = { draft ->
                    viewModel.addLog(draft) {
                        showLogDialog = false
                    }
                }
            )
        }
    }
}

@Composable
fun LifecycleStep(label: String, icon: ImageVector, isActive: Boolean) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(if (isActive) 64.dp else 48.dp)
                .background(if (isActive) PrimaryForest else SurfaceContainer, if (isActive) PebbleShape6 else CircleShape)
                .clip(if (isActive) PebbleShape6 else CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = if (isActive) Color.White else PrimaryForest.copy(alpha = 0.3f))
            if (isActive) {
                Box(modifier = Modifier.align(Alignment.TopEnd).offset(x = 4.dp, y = (-4).dp).background(SecondaryTerracotta, CircleShape).padding(horizontal = 6.dp, vertical = 2.dp)) {
                    Text("ACTIVE", fontSize = 8.sp, color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(label.uppercase(), style = MaterialTheme.typography.labelMedium, color = if (isActive) PrimaryForest else OnSurfaceMuted.copy(alpha = 0.4f), fontSize = 9.sp)
    }
}

@Composable
fun TimelineMomentCard(log: TreeLog) {
    Card(
        modifier = Modifier.width(280.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceContainerLowest),
        shape = Shapes.large
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(log.date.uppercase(), style = MaterialTheme.typography.labelMedium, color = PrimaryForest.copy(alpha = 0.6f))
            Spacer(modifier = Modifier.height(12.dp))
            Box(modifier = Modifier.fillMaxWidth().height(140.dp).clip(PebbleShape6).background(SurfaceContainerLow)) {
                if (log.photoUrl != null) {
                    AsyncImage(model = log.photoUrl, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(text = log.type.displayLabel(), style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp), color = PrimaryForest)
            Text(text = log.content, style = MaterialTheme.typography.bodySmall, maxLines = 2)
        }
    }
}

@Composable
fun HealthRecordItem(title: String, date: String, status: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(title, fontWeight = FontWeight.Bold, color = OnSurfaceNeutral)
            Text(date, fontSize = 11.sp, color = OnSurfaceNeutral.copy(alpha = 0.6f))
        }
        Box(modifier = Modifier.background(PrimaryForest, FullRounded).padding(horizontal = 12.dp, vertical = 4.dp)) {
            Text(status.uppercase(), color = Color(0xFF98B5A3), fontSize = 9.sp, fontWeight = FontWeight.Bold, maxLines = 1)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LogMomentDialog(
    isSubmitting: Boolean,
    error: String?,
    onDismiss: () -> Unit,
    onSubmit: (LogDraft) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var selectedType by remember { mutableStateOf(LogType.NOTE) }
    var content by remember { mutableStateOf("") }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = SurfaceBase,
        shape = RoundedCornerShape(topStart = 48.dp, topEnd = 48.dp),
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(top = 16.dp)
                    .size(width = 40.dp, height = 4.dp)
                    .background(PrimaryForest.copy(alpha = 0.1f), FullRounded)
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(24.dp)
                .padding(bottom = 16.dp)
        ) {
            // Header
            Text(
                text = "Log a Moment",
                style = MaterialTheme.typography.headlineLarge.copy(fontSize = 32.sp),
                color = PrimaryForest
            )
            Text(
                text = "ADD TO THE LEGACY TIMELINE",
                style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                color = SecondaryTerracotta
            )

            Spacer(modifier = Modifier.height(32.dp))

            // 1. Horizontal Pebble Selection (Sticky/Fixed)
            Text(text = "SELECT MOMENT TYPE", style = MaterialTheme.typography.labelMedium, color = OnSurfaceVariant)
            Spacer(modifier = Modifier.height(12.dp))
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(bottom = 8.dp)
            ) {
                items(LogType.values()) { type ->
                    val isSelected = selectedType == type
                    Box(
                        modifier = Modifier
                            .clip(FullRounded)
                            .background(if (isSelected) PrimaryForest else SurfaceContainerLow)
                            .clickable { selectedType = type }
                            .padding(horizontal = 20.dp, vertical = 10.dp)
                    ) {
                        Text(
                            text = type.displayLabel().uppercase(),
                            style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp),
                            color = if (isSelected) Color.White else PrimaryForest
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // 2. Input Zone
            OutlinedTextField(
                value = content,
                onValueChange = { content = it },
                placeholder = { Text("What happened in the garden today?", color = OnSurfaceVariant.copy(alpha = 0.4f)) },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 120.dp)
                    .background(SurfaceContainerLowest, Shapes.large),
                shape = Shapes.large,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryForest.copy(alpha = 0.3f),
                    unfocusedBorderColor = Color.Transparent
                )
            )

            error?.let {
                Spacer(modifier = Modifier.height(16.dp))
                Text(text = it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }

            Spacer(modifier = Modifier.height(32.dp))

            // 3. The Sticky Action Bar
            Button(
                onClick = { onSubmit(LogDraft(type = selectedType, content = content)) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp)
                    .background(PrimaryGradient, FullRounded),
                shape = FullRounded,
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                enabled = content.isNotBlank() && !isSubmitting
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Text("SAVE TO BIOGRAPHY", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = 2.sp), color = Color.White)
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

private fun TreeCategory.toHeroLabel(): String {
    return when (this) {
        TreeCategory.FRUIT_BEARING -> "FRUIT BEARING SPECIMEN"
        TreeCategory.NON_FRUIT_BEARING -> "NON-FRUIT SPECIMEN"
        TreeCategory.ORNAMENTAL -> "ORNAMENTAL SPECIMEN"
    }
}

private fun Tree.buildSummary(): String {
    val varietyText = variety?.let { "Variety: $it." } ?: ""
    val plantingText = plantingDate?.let { " Planted on ${it.take(10)}." } ?: ""
    return "${species} in ${stage.displayLabel().lowercase()} stage. $varietyText Health status: $health.$plantingText".trim()
}

private fun String.formatHeroTitle(): String {
    return split(" ").joinToString("\n")
}

private fun LifecycleStage.displayLabel(): String {
    return when (this) {
        LifecycleStage.SAPLING -> "Sapling"
        LifecycleStage.JUVENILE -> "Juvenile"
        LifecycleStage.FLOWERING -> "First Flowering"
        LifecycleStage.MATURE -> "Mature Bearing"
    }
}

private fun LogType.displayLabel(): String {
    return when (this) {
        LogType.PHOTO -> "Photo"
        LogType.NOTE -> "Note"
        LogType.HARVEST -> "Harvest"
        LogType.PEST -> "Pest Diagnosis"
        LogType.TREATMENT -> "Treatment"
    }
}
