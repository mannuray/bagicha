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
                    title = { Text("Biography", style = MaterialTheme.typography.titleLarge.copy(fontStyle = FontStyle.Italic, fontFamily = androidx.compose.ui.text.font.FontFamily.Serif)) },
                    navigationIcon = {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.Default.ArrowBack, null, tint = PrimaryForest)
                        }
                    },
                    actions = {
                        TextButton(
                            onClick = {
                                viewModel.startEditingSelectedTree()
                                navController.navigate(com.bagicha.app.ui.navigation.Screen.EditTree.route)
                            }
                        ) {
                            Text("Edit Registry", color = PrimaryForest)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceBase.copy(alpha = 0.7f))
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
                    .padding(paddingValues)
            ) {
                // 1. Hero Section: Asymmetric Layout
                item {
                    Box(modifier = Modifier.fillMaxWidth().padding(bottom = 48.dp)) {
                        Row(modifier = Modifier.fillMaxWidth()) {
                            Column(
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(start = 24.dp, top = 48.dp)
                            ) {
                                Text(
                                    text = currentTree.type.toHeroLabel(),
                                    style = MaterialTheme.typography.labelMedium,
                                    color = SecondaryTerracotta
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    text = currentTree.name.formatHeroTitle(),
                                    style = MaterialTheme.typography.headlineLarge.copy(fontSize = 56.sp),
                                    color = PrimaryForest,
                                    lineHeight = 60.sp
                                )
                                Spacer(modifier = Modifier.height(24.dp))
                                Text(
                                    text = currentTree.buildSummary(),
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = OnSurfaceVariant
                                )
                            }
                            
                            // Bleeding Image
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(0.6f)
                                    .height(500.dp)
                                    .offset(x = 40.dp)
                                    .clip(RoundedCornerShape(topStart = 64.dp, bottomStart = 64.dp))
                            ) {
                                AsyncImage(
                                    model = "https://lh3.googleusercontent.com/aida-public/AB6AXuBVH-U7sXysGDYsa6cual1c1DqJ8furKsz8F4R2g0No_WnTP7DOhTD5cJuk8zeDxk_d50PDZ-8sBi_g4ZpFV8EwRoF7FlW4Fe9DIyXa0O4QKxuvD3ylC55FYRkON-zat6w5J4cOhfjnEOWAaYm1pFy_dfykFOgt0lZ6eMMPVKsPFH7WYTr1MFCz_p8bP8cdiwkBevCvzuBr4E19GAtF_0mr1w-FLf8g3fbLKTGPQW2Gl-vYYdCa-agAGiq_c6DFqh_fU7HvsiE3aNo",
                                    contentDescription = null,
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                                // Gradient Overlay to blend with background
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(Brush.horizontalGradient(listOf(SurfaceBase, Color.Transparent, Color.Transparent)))
                                )
                            }
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

@Composable
fun LogMomentDialog(
    isSubmitting: Boolean,
    error: String?,
    onDismiss: () -> Unit,
    onSubmit: (LogDraft) -> Unit
) {
    var selectedType by remember { mutableStateOf(LogType.NOTE) }
    var content by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = { onSubmit(LogDraft(type = selectedType, content = content)) },
                enabled = content.isNotBlank() && !isSubmitting
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = Color.White
                    )
                } else {
                    Text("Save")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isSubmitting) {
                Text("Cancel")
            }
        },
        title = { Text("Log A Moment") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                LogType.values().forEach { type ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { selectedType = type }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedType == type,
                            onClick = { selectedType = type }
                        )
                        Text(type.displayLabel())
                    }
                }
                OutlinedTextField(
                    value = content,
                    onValueChange = { content = it },
                    label = { Text("What happened?") },
                    minLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )
                error?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    )
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
