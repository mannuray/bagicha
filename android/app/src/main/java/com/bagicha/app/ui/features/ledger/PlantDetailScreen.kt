package com.bagicha.app.ui.features.ledger

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Checklist
import androidx.compose.material.icons.filled.Eco
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.bagicha.app.R
import com.bagicha.app.ui.navigation.Screen
import com.bagicha.app.ui.theme.*
import java.time.OffsetDateTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlantDetailScreen(
    viewModel: LedgerViewModel,
    navController: NavController
) {
    val tree by viewModel.selectedTree.collectAsState()
    val timeline by viewModel.timeline.collectAsState()
    val seasonalState by viewModel.seasonalState.collectAsState()
    val cycles by viewModel.cycles.collectAsState()
    val tasks by viewModel.tasks.collectAsState()
    val mitigationPlan by viewModel.mitigationPlan.collectAsState()
    val isSubmitting by viewModel.isSubmitting.collectAsState()
    val error by viewModel.error.collectAsState()
    var showLogDialog by remember { mutableStateOf(false) }

    val navBackStackEntry = navController.currentBackStackEntry
    val treeIdFromNav = navBackStackEntry?.arguments?.getString("plantId")

    LaunchedEffect(treeIdFromNav) {
        treeIdFromNav?.let { id ->
            viewModel.loadSelectedTree(id)
            viewModel.loadTimeline(id)
            viewModel.loadSeasonalState(id)
            viewModel.loadCycles(id)
            viewModel.loadTasks(id)
            viewModel.loadMitigationPlan(id)
        }
    }

    tree?.let { currentTree ->
        val heroPhotoUrl = remember(timeline) {
            timeline.firstOrNull { it.photoUrl != null }?.photoUrl
        }

        Scaffold(
            containerColor = SurfaceBase,
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = "Plant",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontStyle = FontStyle.Italic,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Serif,
                                fontWeight = FontWeight.Bold,
                                color = PrimaryForest
                            )
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.Default.ArrowBack, null, tint = PrimaryForest)
                        }
                    },
                    actions = {
                        val pendingCount = tasks.count { it.status.equals("Pending", ignoreCase = true) }
                        val overdueCount = tasks.countOverdue()
                        IconButton(onClick = {
                            navController.navigate(Screen.PlantTasks.createRoute(currentTree.id))
                        }) {
                            BadgedBox(
                                badge = {
                                    if (pendingCount > 0) {
                                        Badge(
                                            containerColor = if (overdueCount > 0) SecondaryTerracotta else PrimaryForestContainer,
                                            contentColor = Color.White
                                        ) {
                                            Text(pendingCount.toString())
                                        }
                                    }
                                }
                            ) {
                                Icon(Icons.Default.Checklist, contentDescription = "Tasks", tint = PrimaryForest)
                            }
                        }
                        IconButton(onClick = {
                            viewModel.startEditingSelectedTree()
                            navController.navigate(Screen.EditPlant.route)
                        }) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit Registry", tint = PrimaryForest)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceBase.copy(alpha = 0.8f))
                )
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { showLogDialog = true },
                    containerColor = PrimaryForest,
                    contentColor = Color.White,
                    shape = FullRounded,
                    modifier = Modifier.size(64.dp)
                ) {
                    Icon(Icons.Default.Add, null, modifier = Modifier.size(32.dp))
                }
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(top = paddingValues.calculateTopPadding())
            ) {
                // 1. Sanctuary Window (Hero)
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(520.dp)
                            .clip(RoundedCornerShape(bottomStart = 40.dp, bottomEnd = 40.dp))
                    ) {
                        if (heroPhotoUrl != null) {
                            AsyncImage(
                                model = heroPhotoUrl,
                                contentDescription = "Most recent photo of ${currentTree.name}",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            AsyncImage(
                                model = R.drawable.tree_placeholder,
                                contentDescription = currentTree.name,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        listOf(Color.Transparent, Color.Black.copy(alpha = 0.4f), Color.Black.copy(alpha = 0.85f))
                                    )
                                )
                        )

                        LifecycleStageWatermark(
                            currentStage = currentTree.stage,
                            modifier = Modifier
                                .align(Alignment.Center)
                                .size(320.dp)
                        )

                        Row(
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .fillMaxWidth()
                                .padding(24.dp)
                                .padding(bottom = 32.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Bottom
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                val eyebrow = listOfNotNull(
                                    currentTree.species,
                                    currentTree.variety?.takeIf { it.isNotBlank() }
                                ).joinToString(" · ").uppercase()
                                Text(
                                    text = eyebrow,
                                    style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                                    color = SecondaryTerracottaContainer
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = currentTree.name.uppercase().formatHeroTitle(),
                                    style = MaterialTheme.typography.headlineLarge.copy(
                                        fontSize = 48.sp,
                                        fontWeight = FontWeight.Bold,
                                        lineHeight = 52.sp
                                    ),
                                    color = Color.White
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                HeroFactChips(tree = currentTree)
                            }

                            VitalityGlassPebble(health = currentTree.health, stage = currentTree.stage)
                        }
                    }
                }


                // Collapsible: Seasonal Guidance
                seasonalState?.let { state ->
                    item {
                        ExpandableSection(
                            title = "Seasonal Guidance",
                            subtitle = "Generic guidance · ${state.speciesFamily}",
                            initiallyExpanded = true
                        ) {
                            SeasonalGuidanceContent(state = state)
                        }
                    }
                }

                // Compact "Next Up" task summary — full list lives in PlantTasksScreen
                if (tasks.isNotEmpty()) {
                    item {
                        NextUpTaskCard(
                            tasks = tasks,
                            onOpen = { navController.navigate(Screen.PlantTasks.createRoute(currentTree.id)) }
                        )
                    }
                }

                // Collapsible: Next Cycle Plan
                mitigationPlan?.let { plan ->
                    item {
                        ExpandableSection(
                            title = "Next Cycle Plan",
                            subtitle = plan.cycleYear?.let { "$it cycle" } ?: "Current cycle"
                        ) {
                            Column {
                                SeasonReviewSection(plan = plan)
                                Spacer(modifier = Modifier.height(16.dp))
                                NextCycleMitigationSection(plan = plan)
                            }
                        }
                    }
                }

                // Collapsible: Cycle History
                if (cycles.isNotEmpty()) {
                    item {
                        ExpandableSection(
                            title = "Cycle History",
                            subtitle = "${cycles.size} cycle${if (cycles.size == 1) "" else "s"} recorded"
                        ) {
                            CycleSummarySection(cycles = cycles)
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(24.dp))
                    Text(
                        text = "Journal",
                        modifier = Modifier.padding(horizontal = 24.dp),
                        style = MaterialTheme.typography.displaySmall.copy(fontStyle = FontStyle.Italic),
                        color = PrimaryForest
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                }

                if (timeline.isEmpty()) {
                    item {
                        Text(
                            text = "No journal events recorded yet.",
                            modifier = Modifier.padding(horizontal = 24.dp),
                            style = MaterialTheme.typography.bodyMedium,
                            color = OnSurfaceVariant
                        )
                    }
                } else {
                    val cycleGroups = timeline.groupIntoCycles()
                    cycleGroups.forEachIndexed { groupIndex, group ->
                        item {
                            val layerColor = if (groupIndex % 2 == 0) Color.Transparent else SurfaceContainerLow.copy(alpha = 0.5f)
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(layerColor)
                                    .padding(horizontal = 24.dp, vertical = 16.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(20.dp)
                                            .clip(CircleShape)
                                            .background(PrimaryForest)
                                            .border(4.dp, if (groupIndex % 2 == 0) SurfaceBase else SurfaceContainerLow.copy(alpha = 0.5f), CircleShape)
                                    )
                                    Spacer(modifier = Modifier.width(32.dp))
                                    Text(
                                        text = group.label.uppercase(),
                                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = 2.sp),
                                        color = SecondaryTerracotta
                                    )
                                }
                            }
                        }

                        itemsIndexed(group.entries) { _, log ->
                            val layerColor = if (groupIndex % 2 == 0) Color.Transparent else SurfaceContainerLow.copy(alpha = 0.5f)
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(layerColor)
                                    .padding(horizontal = 24.dp)
                            ) {
                                Row(modifier = Modifier.height(IntrinsicSize.Min)) {
                                    Box(
                                        modifier = Modifier
                                            .padding(start = 9.dp)
                                            .width(2.dp)
                                            .fillMaxHeight()
                                            .background(PrimaryForest.copy(alpha = 0.1f))
                                    )
                                    Spacer(modifier = Modifier.width(42.dp))
                                    GeologicalEntryCard(log = log)
                                }
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(100.dp)) }
            }
        }

        if (showLogDialog) {
            LogMomentDialog(
                recordKind = currentTree.recordKind,
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
    } ?: run {
        // Loading / error state when the tree hasn't loaded yet
        Scaffold(
            containerColor = SurfaceBase,
            topBar = {
                TopAppBar(
                    title = { Text("Loading record", color = PrimaryForest) },
                    navigationIcon = {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.Default.ArrowBack, null, tint = PrimaryForest)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceBase)
                )
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                if (error != null) {
                    Text(
                        text = error ?: "",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.error
                    )
                } else {
                    CircularProgressIndicator(color = PrimaryForest)
                }
            }
        }
    }
}

@Composable
private fun ExpandableSection(
    title: String,
    subtitle: String? = null,
    initiallyExpanded: Boolean = false,
    content: @Composable () -> Unit
) {
    var expanded by remember { mutableStateOf(initiallyExpanded) }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 8.dp)
            .clip(RoundedCornerShape(28.dp))
            .background(SurfaceContainerLow)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { expanded = !expanded }
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = PrimaryForest
                )
                subtitle?.takeIf { it.isNotBlank() }?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.labelMedium,
                        color = SecondaryTerracotta
                    )
                }
            }
            Icon(
                imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                contentDescription = if (expanded) "Collapse" else "Expand",
                tint = PrimaryForest
            )
        }
        AnimatedVisibility(visible = expanded) {
            Box(modifier = Modifier.padding(bottom = 16.dp)) {
                content()
            }
        }
    }
}

@Composable
private fun SeasonalGuidanceContent(state: SeasonalState) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "Currently: ${state.currentPhase.toReadablePhase()}",
            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold),
            color = PrimaryForest
        )
        Text(
            text = "Up next: ${state.upcomingPhase.toReadablePhase()} · check in ${state.nextCheckpointDays} days",
            style = MaterialTheme.typography.bodyMedium,
            color = OnSurfaceVariant
        )
        GuidanceListBlock("Watch for", state.watchFor)
    }
}

@Composable
private fun GuidanceListBlock(title: String, items: List<String>) {
    if (items.isEmpty()) return
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            title.uppercase(),
            style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 1.sp),
            color = SecondaryTerracotta
        )
        items.forEach { item ->
            Text("• $item", style = MaterialTheme.typography.bodyMedium, color = OnSurfaceVariant)
        }
    }
}

@Composable
fun VitalityGlassPebble(health: String, stage: LifecycleStage) {
    Box(
        modifier = Modifier
            .size(110.dp)
            .clip(PebbleShape1)
            .background(Color.White.copy(alpha = 0.18f))
            .border(1.dp, Color.White.copy(alpha = 0.35f), PebbleShape1),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = Icons.Default.Eco,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(28.dp)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = stage.toShortLabel().uppercase(),
                style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 1.sp, fontWeight = FontWeight.Bold),
                color = Color.White.copy(alpha = 0.85f)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .clip(FullRounded)
                    .background(SecondaryTerracotta.copy(alpha = 0.85f))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text(
                    text = health.uppercase(),
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                    color = Color.White
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun HeroFactChips(tree: Plant) {
    val chips = buildList {
        add(tree.stage.toLongLabel())
        add(tree.growthHabit.name.lowercase().replaceFirstChar(Char::titlecase))
        add(tree.recordPattern.name.lowercase().replaceFirstChar(Char::titlecase).replace("_", "-"))
        tree.age.takeIf { it.isNotBlank() && it != "Age unknown" }?.let { add(it) }
        val planted = tree.plantingDateInput?.takeIf { it.isNotBlank() }
            ?: tree.plantingDate?.let { runCatching { OffsetDateTime.parse(it).year.toString() }.getOrNull() }
        planted?.let { add("Planted $it") }
    }
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        chips.forEach { HeroChip(it) }
    }
}

@Composable
private fun HeroChip(text: String) {
    Box(
        modifier = Modifier
            .clip(FullRounded)
            .background(Color.White.copy(alpha = 0.18f))
            .border(1.dp, Color.White.copy(alpha = 0.25f), FullRounded)
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.5.sp),
            color = Color.White
        )
    }
}

@Composable
private fun LifecycleStageWatermark(currentStage: LifecycleStage, modifier: Modifier = Modifier) {
    val activeIndex = LifecycleStage.entries.indexOf(currentStage)
    val shapes = listOf(PebbleShape1, PebbleShape2, PebbleShape3, PebbleShape4, PebbleShape5)
    val scales = listOf(1.0f, 0.85f, 0.7f, 0.55f, 0.4f)
    Box(modifier = modifier) {
        scales.forEachIndexed { index, scale ->
            val isActive = index == activeIndex
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .scale(scale)
                    .border(
                        width = if (isActive) 2.dp else 1.dp,
                        color = Color.White.copy(alpha = if (isActive) 0.4f else 0.18f),
                        shape = shapes[index]
                    )
            )
        }
    }
}

@Composable
fun GeologicalEntryCard(log: JournalEntry) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceBase),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column {
            if (log.photoUrl != null) {
                AsyncImage(
                    model = log.photoUrl,
                    contentDescription = null,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .padding(8.dp)
                        .clip(PebbleShape4),
                    contentScale = ContentScale.Crop
                )
            }
            Column(modifier = Modifier.padding(24.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(
                        text = log.type.displayLabel().uppercase(),
                        style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 1.sp),
                        color = OnSurfaceVariant
                    )
                    Text(
                        text = log.date.uppercase(),
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = PrimaryForestContainer
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = log.content,
                    style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp, fontWeight = FontWeight.Bold),
                    color = PrimaryForest
                )
            }
        }
    }
}

private fun String.formatHeroTitle(): String {
    return split(" ").joinToString("\n")
}

private fun String.toCycleYearLabel(): String {
    return try {
        OffsetDateTime.parse(this).year.toString()
    } catch (_: Exception) {
        "History"
    }
}

private fun List<JournalEntry>.groupIntoCycles(): List<TimelineCycleGroup> {
    return groupBy { it.timestamp.toCycleYearLabel() }
        .entries
        .sortedByDescending { it.key }
        .map { (label, entries) ->
            TimelineCycleGroup(
                label = label,
                sublabel = "Cycle events",
                entries = entries.sortedByDescending { it.timestamp }
            )
        }
}

private fun List<PlantTask>.countOverdue(): Int {
    val now = OffsetDateTime.now()
    return count { task ->
        if (!task.status.equals("Pending", ignoreCase = true)) return@count false
        try {
            OffsetDateTime.parse(task.dueAt).isBefore(now)
        } catch (_: Exception) {
            false
        }
    }
}

@Composable
private fun NextUpTaskCard(tasks: List<PlantTask>, onOpen: () -> Unit) {
    val pending = tasks.filter { it.status.equals("Pending", ignoreCase = true) }
    val overdueCount = tasks.countOverdue()
    val next = pending.sortedBy {
        try { OffsetDateTime.parse(it.dueAt) } catch (_: Exception) { OffsetDateTime.MAX }
    }.firstOrNull()

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 8.dp)
            .clip(PebbleShape2)
            .background(SurfaceContainerLow)
            .clickable { onOpen() }
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "ACTION QUEUE",
                    style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                    color = SecondaryTerracotta
                )
                Text(
                    text = "${pending.size} open" + if (overdueCount > 0) " · $overdueCount overdue" else "",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = if (overdueCount > 0) SecondaryTerracotta else PrimaryForest
                )
            }
            Icon(Icons.Default.Checklist, contentDescription = null, tint = PrimaryForest)
        }

        next?.let { task ->
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = "NEXT UP",
                    style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 1.sp),
                    color = OnSurfaceMuted
                )
                Text(
                    text = task.title,
                    style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold),
                    color = PrimaryForest
                )
                Text(
                    text = "${task.priority} · due ${task.dueDate}",
                    style = MaterialTheme.typography.bodySmall,
                    color = OnSurfaceVariant
                )
            }
        }
    }
}

private fun String.toReadablePhase(): String {
    return replace('_', ' ').split(' ').joinToString(" ") { word ->
        word.lowercase().replaceFirstChar(Char::titlecase)
    }
}

private fun LifecycleStage.toShortLabel(): String {
    return when (this) {
        LifecycleStage.SAPLING -> "Sapling"
        LifecycleStage.JUVENILE -> "Juvenile"
        LifecycleStage.FLOWERING -> "Flowering"
        LifecycleStage.FIRST_HARVEST -> "1st Harvest"
        LifecycleStage.MATURE -> "Mature"
    }
}

private fun LifecycleStage.toLongLabel(): String {
    return when (this) {
        LifecycleStage.SAPLING -> "Sapling"
        LifecycleStage.JUVENILE -> "Juvenile Growth"
        LifecycleStage.FLOWERING -> "First Flowering"
        LifecycleStage.FIRST_HARVEST -> "First Harvest"
        LifecycleStage.MATURE -> "Mature Canopy"
    }
}

private fun LogType.displayLabel(): String {
    return when (this) {
        LogType.PHOTO -> "Photo"
        LogType.NOTE -> "Observation"
        LogType.HARVEST -> "Harvest"
        LogType.PEST -> "Diagnosis"
        LogType.TREATMENT -> "Care"
        LogType.WATERING_STRESS -> "Water Stress"
        LogType.FLOWER_DROP -> "Flower Drop"
        LogType.FRUIT_SET -> "Fruit Set"
        LogType.FRUIT_DROP -> "Fruit Drop"
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
        else -> name.lowercase().replaceFirstChar(Char::titlecase)
    }
}

data class TimelineCycleGroup(
    val label: String,
    val sublabel: String,
    val entries: List<JournalEntry>
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun LogMomentDialog(
    recordKind: RecordKind,
    isSubmitting: Boolean,
    error: String?,
    onDismiss: () -> Unit,
    onSubmit: (LogDraft) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var type by remember(recordKind) { mutableStateOf(LogType.NOTE) }
    var content by remember { mutableStateOf("") }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = SurfaceBase,
        shape = RoundedCornerShape(topStart = 48.dp, topEnd = 48.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(24.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text(
                text = "Log a Moment",
                style = MaterialTheme.typography.headlineLarge.copy(fontSize = 32.sp),
                color = PrimaryForest
            )
            Spacer(modifier = Modifier.height(32.dp))

            Row(
                modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                LogType.entries.filter { it.allowedFor(recordKind) }.forEach { option ->
                    val isSelected = type == option
                    Box(
                        modifier = Modifier
                            .clip(FullRounded)
                            .background(if (isSelected) PrimaryForest else SurfaceContainerLow)
                            .clickable { type = option }
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = option.displayLabel(),
                            color = if (isSelected) Color.White else PrimaryForest,
                            style = MaterialTheme.typography.labelMedium
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            OutlinedTextField(
                value = content,
                onValueChange = { content = it },
                label = { Text("Observation") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PrimaryForest)
            )

            error?.let {
                Spacer(modifier = Modifier.height(12.dp))
                Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
            }

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = { onSubmit(LogDraft(type = type, content = content)) },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryForest),
                shape = FullRounded,
                enabled = content.isNotBlank() && !isSubmitting
            ) {
                Text(if (isSubmitting) "SAVING..." else "SAVE TO RECORD")
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
