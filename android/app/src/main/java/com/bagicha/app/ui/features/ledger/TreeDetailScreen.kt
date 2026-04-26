package com.bagicha.app.ui.features.ledger

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.filled.PlayArrow
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
import com.bagicha.app.ui.navigation.Screen
import com.bagicha.app.ui.theme.*
import java.time.LocalDate
import java.time.OffsetDateTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TreeDetailScreen(
    viewModel: LedgerViewModel,
    navController: NavController
) {
    val tree by viewModel.selectedTree.collectAsState()
    val timeline by viewModel.timeline.collectAsState()
    val cycles by viewModel.cycles.collectAsState()
    val tasks by viewModel.tasks.collectAsState()
    val mitigationPlan by viewModel.mitigationPlan.collectAsState()
    val seasonalState by viewModel.seasonalState.collectAsState()
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
                        Row {
                            Box(
                                modifier = Modifier
                                    .padding(8.dp)
                                    .background(SurfaceBase.copy(alpha = 0.8f), FullRounded)
                                    .clip(FullRounded)
                            ) {
                                TextButton(
                                    onClick = { navController.navigate(Screen.RecordTasks.route) }
                                ) {
                                    Text("TASKS", style = MaterialTheme.typography.labelMedium, color = PrimaryForest)
                                }
                            }
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
                    .fillMaxSize(),
                contentPadding = PaddingValues(bottom = paddingValues.calculateBottomPadding())
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
                                text = currentTree.toHeroLabel(),
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
                        Text("Mapping the biological evolution of this record.", style = MaterialTheme.typography.bodyMedium)
                        Spacer(modifier = Modifier.height(32.dp))
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            currentTree.lifecycleSteps().forEach { step ->
                                LifecycleStep(
                                    label = step.label,
                                    icon = step.icon,
                                    isActive = currentTree.stage == step.stage
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(48.dp))
                }

                item {
                    MilestoneSection(tree = currentTree)
                    Spacer(modifier = Modifier.height(48.dp))
                }

                if (cycles.isNotEmpty()) {
                    item {
                        CycleSummarySection(cycles = cycles)
                        Spacer(modifier = Modifier.height(48.dp))
                    }

                    item {
                        CycleComparisonSection(cycles = cycles)
                        Spacer(modifier = Modifier.height(48.dp))
                    }
                }

                mitigationPlan?.let { plan ->
                    item {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp),
                            horizontalArrangement = Arrangement.End
                        ) {
                            TextButton(onClick = { navController.navigate(Screen.SeasonReview.route) }) {
                                Text("OPEN REVIEW", color = PrimaryForest)
                            }
                        }
                    }

                    item {
                        SeasonReviewSection(plan = plan)
                        Spacer(modifier = Modifier.height(32.dp))
                    }

                    item {
                        NextCycleMitigationSection(plan = plan)
                        Spacer(modifier = Modifier.height(48.dp))
                    }
                }

                item {
                    RecordTaskSummaryCard(
                        recordKind = currentTree.recordKind,
                        tasks = tasks,
                        onOpenTasks = { navController.navigate(Screen.RecordTasks.route) }
                    )
                    Spacer(modifier = Modifier.height(48.dp))
                }

                seasonalState?.let { state ->
                    item {
                        SeasonalGuidanceSection(state = state)
                        Spacer(modifier = Modifier.height(48.dp))
                    }
                }

                // 3. Growth Moments grouped by cycle
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
                            text = "No journal events recorded yet.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = OnSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 24.dp)
                        )
                    } else {
                        val cycleGroups = timeline.groupIntoCycles()
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp),
                            verticalArrangement = Arrangement.spacedBy(24.dp)
                        ) {
                            cycleGroups.forEach { group ->
                                TimelineCycleSection(group = group)
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
                                val healthLogs = timeline.filter {
                                    it.type == LogType.PEST || it.type == LogType.TREATMENT || it.type == LogType.DIAGNOSIS
                                }
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
    }
}

data class TimelineCycleGroup(
    val label: String,
    val sublabel: String,
    val entries: List<TreeLog>
)

private data class LifecycleStepDefinition(
    val label: String,
    val icon: ImageVector,
    val stage: LifecycleStage
)

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
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceContainerLowest),
        shape = Shapes.large
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        log.type.displayLabel().uppercase(),
                        style = MaterialTheme.typography.labelMedium,
                        color = SecondaryTerracotta
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = log.content,
                        style = MaterialTheme.typography.titleMedium,
                        color = PrimaryForest
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    log.date.uppercase(),
                    style = MaterialTheme.typography.labelMedium,
                    color = PrimaryForest.copy(alpha = 0.6f)
                )
            }

            if (log.metadata.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                FlowMetadataChips(metadata = log.metadata)
            }

            if (log.photoUrl != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp)
                        .clip(PebbleShape6)
                        .background(SurfaceContainerLow)
                ) {
                    AsyncImage(
                        model = log.photoUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
            }
        }
    }
}

@Composable
fun TimelineCycleSection(group: TimelineCycleGroup) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom
        ) {
            Column {
                Text(
                    text = group.label,
                    style = MaterialTheme.typography.titleLarge,
                    color = PrimaryForest
                )
                Text(
                    text = group.sublabel,
                    style = MaterialTheme.typography.labelMedium,
                    color = OnSurfaceVariant
                )
            }
            Text(
                text = "${group.entries.size} events",
                style = MaterialTheme.typography.labelMedium,
                color = SecondaryTerracotta
            )
        }
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            group.entries.forEach { log ->
                TimelineMomentCard(log)
            }
        }
    }
}

@Composable
private fun FlowMetadataChips(metadata: Map<String, String>) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        metadata.entries.chunked(2).forEach { rowEntries ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                rowEntries.forEach { (key, value) ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(FullRounded)
                            .border(1.dp, PrimaryForest.copy(alpha = 0.12f), FullRounded)
                            .background(SurfaceBase)
                            .padding(horizontal = 12.dp, vertical = 10.dp)
                    ) {
                        Column {
                            Text(
                                text = key.toMetadataLabel(),
                                style = MaterialTheme.typography.labelSmall,
                                color = OnSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = value.replace('_', ' '),
                                style = MaterialTheme.typography.labelMedium,
                                color = PrimaryForest,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
                if (rowEntries.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
fun MilestoneSection(tree: Tree) {
    Column(modifier = Modifier.padding(horizontal = 24.dp)) {
        Text("Milestones", style = MaterialTheme.typography.headlineMedium, color = PrimaryForest)
        Text("LIFETIME RECORD HISTORY", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
        Spacer(modifier = Modifier.height(16.dp))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(SurfaceContainerLow, Shapes.large)
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            MilestoneRow(tree.plantedLabel(), tree.plantingDateInput ?: tree.plantingDate.toDisplayDate())
            MilestoneRow(tree.firstFloweringLabel(), tree.firstFloweringAt.toDisplayDate())
            if (tree.supportsFruitingMilestones()) {
                MilestoneRow("First Fruit Set", tree.firstFruitSetAt.toDisplayDate())
            }
            if (tree.supportsHarvestMilestones()) {
                MilestoneRow("First Harvest", tree.firstHarvestAt.toDisplayDate())
                MilestoneRow("Latest Harvest", tree.latestHarvestAt.toDisplayDate())
            }
        }
    }
}

@Composable
private fun MilestoneRow(label: String, value: String?) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = OnSurfaceNeutral)
        Text(
            text = value ?: "Not recorded",
            style = MaterialTheme.typography.bodyMedium,
            color = if (value == null) OnSurfaceVariant else PrimaryForest,
            fontWeight = if (value == null) FontWeight.Normal else FontWeight.Medium
        )
    }
}

@Composable
fun SeasonalGuidanceSection(state: SeasonalState) {
    Column(modifier = Modifier.padding(horizontal = 24.dp)) {
        Text("Seasonal Intelligence", style = MaterialTheme.typography.headlineMedium, color = PrimaryForest)
        Text("WHAT THIS RECORD LIKELY NEEDS NOW", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
        Spacer(modifier = Modifier.height(16.dp))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(SurfaceContainerLow, Shapes.large)
                .padding(24.dp)
        ) {
            Text(
                text = state.currentPhase.readableToken(),
                style = MaterialTheme.typography.headlineSmall,
                color = PrimaryForest
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Next: ${state.upcomingPhase.readableToken()} in about ${state.nextCheckpointDays} days",
                style = MaterialTheme.typography.bodyMedium,
                color = OnSurfaceVariant
            )
            Spacer(modifier = Modifier.height(20.dp))
            GuidanceList("Do now", state.doNow)
            Spacer(modifier = Modifier.height(16.dp))
            GuidanceList("Avoid now", state.avoidNow)
            Spacer(modifier = Modifier.height(16.dp))
            GuidanceList("Watch for", state.watchFor)
        }
    }
}

@Composable
fun CycleSummarySection(cycles: List<TreeCycleSummary>) {
    Column(modifier = Modifier.padding(horizontal = 24.dp)) {
        Text("Cycle Summary", style = MaterialTheme.typography.headlineMedium, color = PrimaryForest)
        Text("BACKEND TRACKED SEASON OUTCOMES", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
        Spacer(modifier = Modifier.height(16.dp))

        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            cycles.forEach { cycle ->
                CycleSummaryCard(cycle = cycle)
            }
        }
    }
}

@Composable
fun CycleComparisonSection(cycles: List<TreeCycleSummary>) {
    val latest = cycles.firstOrNull() ?: return
    val previous = cycles.getOrNull(1)
    val changeNotes = latest.buildChangeNotes(previous)
    val mitigationSteps = latest.nextActions.ifEmpty {
        listOf("Keep logging flowering, fruit set, stress, and harvest so the next cycle has a stronger baseline.")
    }

    Column(modifier = Modifier.padding(horizontal = 24.dp)) {
        Text("Comparison & Mitigation", style = MaterialTheme.typography.headlineMedium, color = PrimaryForest)
        Text(
            if (previous != null) "WHAT CHANGED FROM ${previous.year} TO ${latest.year}"
            else "USE ${latest.year} AS THE BASELINE FOR NEXT CYCLE",
            style = MaterialTheme.typography.labelMedium,
            color = SecondaryTerracotta
        )
        Spacer(modifier = Modifier.height(16.dp))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(SurfaceContainerLow, Shapes.large)
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            if (previous != null) {
                ComparisonMetricRow("Harvest", latest.harvestOutcomeLabel(), previous.harvestOutcomeLabel())
                ComparisonMetricRow("Stress", latest.stressOutcomeLabel(), previous.stressOutcomeLabel())
                ComparisonMetricRow("Pests", latest.pestOutcomeLabel(), previous.pestOutcomeLabel())
                ComparisonMetricRow("Fruit Set", latest.fruitSetOutcomeLabel(), previous.fruitSetOutcomeLabel())
            } else {
                Text(
                    text = "There is only one recorded cycle so far. Keep logging key events to unlock stronger season-over-season diagnosis.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = OnSurfaceNeutral
                )
            }

            if (changeNotes.isNotEmpty()) {
                Divider(color = PrimaryForest.copy(alpha = 0.08f))
                Text("What changed", style = MaterialTheme.typography.titleMedium, color = PrimaryForest)
                changeNotes.forEach { note ->
                    ComparisonBullet(note)
                }
            }

            Divider(color = PrimaryForest.copy(alpha = 0.08f))
            Text("Mitigate next cycle", style = MaterialTheme.typography.titleMedium, color = PrimaryForest)
            mitigationSteps.forEach { step ->
                ComparisonBullet(step)
            }
        }
    }
}

@Composable
fun NextCycleMitigationSection(plan: MitigationPlan) {
    Column(modifier = Modifier.padding(horizontal = 24.dp)) {
        Text("Next Cycle Plan", style = MaterialTheme.typography.headlineMedium, color = PrimaryForest)
        Text(
            text = if (plan.cycleYear != null) "MITIGATION FOR WHAT CHANGED IN ${plan.cycleYear}" else "NEXT-CYCLE MITIGATION",
            style = MaterialTheme.typography.labelMedium,
            color = SecondaryTerracotta
        )
        Spacer(modifier = Modifier.height(16.dp))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(SurfaceContainerLow, Shapes.large)
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            Text(plan.summary, style = MaterialTheme.typography.bodyLarge, color = OnSurfaceNeutral)

            MitigationListSection("Likely issues", plan.likelyIssues)
            MitigationListSection("What to change", plan.whatToChange)
            MitigationListSection("Watch early", plan.watchEarly)
            MitigationListSection("Priority actions", plan.priorityActions)
        }
    }
}

@Composable
fun SeasonReviewSection(plan: MitigationPlan) {
    Column(modifier = Modifier.padding(horizontal = 24.dp)) {
        Text("Season Review", style = MaterialTheme.typography.headlineMedium, color = PrimaryForest)
        Text(
            text = if (plan.cycleYear != null) "HOW THE ${plan.cycleYear} CYCLE ACTUALLY RAN" else "CURRENT CYCLE REVIEW",
            style = MaterialTheme.typography.labelMedium,
            color = SecondaryTerracotta
        )
        Spacer(modifier = Modifier.height(16.dp))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(SurfaceContainerLow, Shapes.large)
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(plan.summary, style = MaterialTheme.typography.bodyLarge, color = OnSurfaceNeutral)
            Divider(color = PrimaryForest.copy(alpha = 0.08f))
            CycleMetaRow("Completed Tasks", plan.completedTasks.toString())
            CycleMetaRow("Skipped Tasks", plan.skippedTasks.toString())
            CycleMetaRow("Pending Tasks", plan.pendingTasks.toString())
        }
    }
}

@Composable
private fun MitigationListSection(title: String, items: List<String>) {
    if (items.isEmpty()) return
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title.uppercase(), style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
        items.forEach { item ->
            Row(verticalAlignment = Alignment.Top) {
                Text("•", color = PrimaryForest, modifier = Modifier.padding(end = 8.dp))
                Text(item, style = MaterialTheme.typography.bodyMedium, color = OnSurfaceNeutral)
            }
        }
    }
}

@Composable
fun TreeTasksSection(
    recordKind: RecordKind,
    tasks: List<TreeTask>,
    isSubmitting: Boolean,
    onSyncTasks: () -> Unit,
    onCompleteTask: (String) -> Unit,
    onSkipTask: (String) -> Unit
) {
    val groupedTasks = tasks.groupForDisplay()

    Column(modifier = Modifier.padding(horizontal = 24.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom
        ) {
            Column {
                Text("${recordKind.displayName()} Moments", style = MaterialTheme.typography.headlineMedium, color = PrimaryForest)
                Text("REQUIRED CARE ACTIONS", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
            }
            TextButton(
                onClick = onSyncTasks,
                enabled = !isSubmitting,
                modifier = Modifier.background(SurfaceContainerLow, FullRounded)
            ) {
                Text(if (isSubmitting) "SYNCING..." else "SYNC PLAN", color = PrimaryForest, style = MaterialTheme.typography.labelMedium)
            }
        }
        Spacer(modifier = Modifier.height(32.dp))

        if (tasks.isEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceContainerLow, Shapes.large)
                    .padding(32.dp)
            ) {
                Text(
                    text = "The cycle is clear.",
                    style = MaterialTheme.typography.titleLarge,
                    color = PrimaryForest
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "No ${recordKind.displayName().lowercase()} tasks are pending. Sync with the seasonal engine to generate new care plans.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = OnSurfaceMuted.copy(alpha = 0.6f),
                    lineHeight = 24.sp
                )
            }
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(48.dp)) {
                TaskBucketSection(
                    title = "OVERDUE ACTIONS",
                    tasks = groupedTasks.overdue,
                    isSubmitting = isSubmitting,
                    onCompleteTask = onCompleteTask,
                    onSkipTask = onSkipTask
                )
                TaskBucketSection(
                    title = "CURRENT PLAN",
                    tasks = groupedTasks.upcoming,
                    isSubmitting = isSubmitting,
                    onCompleteTask = onCompleteTask,
                    onSkipTask = onSkipTask
                )
                TaskBucketSection(
                    title = "CLOSED HISTORY",
                    tasks = groupedTasks.closed,
                    isSubmitting = isSubmitting,
                    onCompleteTask = onCompleteTask,
                    onSkipTask = onSkipTask
                )
            }
        }
    }
}

@Composable
fun RecordTaskSummaryCard(
    recordKind: RecordKind,
    tasks: List<TreeTask>,
    onOpenTasks: () -> Unit
) {
    val openTasks = tasks.count { it.status.equals("Pending", ignoreCase = true) }
    val overdueTasks = tasks.count {
        it.status.equals("Pending", ignoreCase = true) && it.dueAt.toLocalDateOrNull()?.isBefore(LocalDate.now()) == true
    }
    val nextTask = tasks
        .filter { it.status.equals("Pending", ignoreCase = true) }
        .sortedBy { it.dueAt }
        .firstOrNull()

    Column(modifier = Modifier.padding(horizontal = 24.dp)) {
        Text("${recordKind.displayName()} Path", style = MaterialTheme.typography.headlineMedium, color = PrimaryForest)
        Text("UPCOMING MILESTONES", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
        Spacer(modifier = Modifier.height(24.dp))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(SurfaceContainerLow, PebbleShape6)
                .padding(28.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("PENDING", style = MaterialTheme.typography.labelMedium, color = OnSurfaceMuted)
                Text(openTasks.toString(), style = MaterialTheme.typography.titleLarge, color = PrimaryForest)
            }
            if (overdueTasks > 0) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("OVERDUE", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
                    Text(overdueTasks.toString(), style = MaterialTheme.typography.titleLarge, color = SecondaryTerracotta)
                }
            }
            nextTask?.let {
                Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(PrimaryForest.copy(alpha = 0.05f)))
                Text("NEXT ACTION", style = MaterialTheme.typography.labelMedium, color = OnSurfaceMuted)
                Text(it.title, style = MaterialTheme.typography.titleLarge.copy(fontFamily = androidx.compose.ui.text.font.FontFamily.Serif), color = PrimaryForest)
                Text("DUE ${it.dueDate}", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
            }

            Spacer(modifier = Modifier.height(8.dp))
            Button(
                onClick = onOpenTasks,
                modifier = Modifier.fillMaxWidth().height(56.dp).background(PrimaryGradient, FullRounded),
                shape = FullRounded,
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
            ) {
                Text("VIEW FULL PATH", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = 1.sp), color = Color.White)
            }
        }
    }
}

@Composable
private fun TaskBucketSection(
    title: String,
    tasks: List<TreeTask>,
    isSubmitting: Boolean,
    onCompleteTask: (String) -> Unit,
    onSkipTask: (String) -> Unit
) {
    if (tasks.isEmpty()) return

    Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
        Text(title, style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp), color = OnSurfaceMuted)
        tasks.forEachIndexed { index, task ->
            TreeTaskCard(
                task = task,
                shape = PebbleShapes[index % PebbleShapes.size],
                isSubmitting = isSubmitting,
                onCompleteTask = onCompleteTask,
                onSkipTask = onSkipTask
            )
        }
    }
}

@Composable
private fun TreeTaskCard(
    task: TreeTask,
    shape: androidx.compose.ui.graphics.Shape,
    isSubmitting: Boolean,
    onCompleteTask: (String) -> Unit,
    onSkipTask: (String) -> Unit
) {
    val isPending = task.status.equals("Pending", ignoreCase = true)
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (isPending) SurfaceContainerLow else SurfaceBase, shape)
            .padding(24.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = task.title, 
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontFamily = androidx.compose.ui.text.font.FontFamily.Serif,
                        textDecoration = if (!isPending) androidx.compose.ui.text.style.TextDecoration.LineThrough else null
                    ), 
                    color = if (isPending) PrimaryForest else OnSurfaceMuted.copy(alpha = 0.4f)
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "DUE ${task.dueDate}",
                    style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp),
                    color = if (isPending) SecondaryTerracotta else OnSurfaceMuted.copy(alpha = 0.3f)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            if (isPending) {
                Box(
                    modifier = Modifier
                        .clip(FullRounded)
                        .background(task.priorityColor().copy(alpha = 0.1f))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(task.priority.uppercase(), style = MaterialTheme.typography.labelMedium.copy(fontSize = 9.sp), color = task.priorityColor())
                }
            }
        }

        if (isPending) {
            Spacer(modifier = Modifier.height(16.dp))
            task.explanationText()?.let { explanation ->
                Text(
                    text = explanation,
                    style = MaterialTheme.typography.bodyMedium,
                    color = PrimaryForest.copy(alpha = 0.7f),
                    lineHeight = 22.sp
                )
                Spacer(modifier = Modifier.height(20.dp))
            }

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                TextButton(
                    onClick = { onSkipTask(task.id) },
                    enabled = !isSubmitting,
                    modifier = Modifier.weight(1f).height(48.dp).background(SurfaceBase, FullRounded)
                ) {
                    Text("SKIP", style = MaterialTheme.typography.labelMedium, color = OnSurfaceMuted)
                }
                Button(
                    onClick = { onCompleteTask(task.id) },
                    enabled = !isSubmitting,
                    modifier = Modifier.weight(1.5f).height(48.dp).background(PrimaryGradient, FullRounded),
                    shape = FullRounded,
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                ) {
                    Text("MARK DONE", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold), color = Color.White)
                }
            }
        }
    }
}

@Composable
private fun ComparisonMetricRow(label: String, current: String, previous: String) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label.uppercase(), style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Current: $current", style = MaterialTheme.typography.bodyMedium, color = PrimaryForest)
            Text("Previous: $previous", style = MaterialTheme.typography.bodyMedium, color = OnSurfaceVariant)
        }
    }
}

@Composable
private fun ComparisonBullet(text: String) {
    Row(verticalAlignment = Alignment.Top) {
        Text("•", color = PrimaryForest, modifier = Modifier.padding(end = 8.dp))
        Text(text, style = MaterialTheme.typography.bodyMedium, color = OnSurfaceNeutral)
    }
}

@Composable
private fun CycleSummaryCard(cycle: TreeCycleSummary) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceContainerLow, Shapes.large)
            .padding(24.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${cycle.year} Cycle",
                    style = MaterialTheme.typography.titleLarge,
                    color = PrimaryForest
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = cycle.summary,
                    style = MaterialTheme.typography.bodyMedium,
                    color = OnSurfaceNeutral
                )
            }
            if (cycle.yieldSummary != null) {
                Spacer(modifier = Modifier.width(12.dp))
                Box(
                    modifier = Modifier
                        .clip(FullRounded)
                        .background(PrimaryForest)
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = cycle.yieldSummary.uppercase(),
                        style = MaterialTheme.typography.labelMedium,
                        color = Color.White
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            CycleMetaRow("Flowering", cycle.floweringDate)
            CycleMetaRow("Fruit Set", cycle.fruitSetDate)
            CycleMetaRow("Harvest", cycle.harvestWindow)
            CycleMetaRow("Flower Drop", cycle.flowerDropLevel?.readableToken())
            CycleMetaRow("Fruit Drop", cycle.fruitDropLevel?.readableToken())
            CycleMetaRow("Stress Signals", cycle.stressScore.takeIf { it > 0 }?.toString())
            CycleMetaRow("Pest Signals", cycle.pestPressureScore.takeIf { it > 0 }?.toString())
            CycleMetaRow("Treatments", cycle.treatmentCount.takeIf { it > 0 }?.toString())
        }

        if (cycle.recentEventLabels.isNotEmpty()) {
            Spacer(modifier = Modifier.height(16.dp))
            Text("RECENT EVENTS", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
            Spacer(modifier = Modifier.height(8.dp))
            FlowMetadataChips(
                metadata = cycle.recentEventLabels.distinct().take(4).associateWith { "Logged" }
            )
        }

        if (cycle.nextActions.isNotEmpty()) {
            Spacer(modifier = Modifier.height(16.dp))
            Text("NEXT CYCLE ACTIONS", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
            Spacer(modifier = Modifier.height(8.dp))
            cycle.nextActions.forEach { action ->
                Row(verticalAlignment = Alignment.Top) {
                    Text("•", color = PrimaryForest, modifier = Modifier.padding(end = 8.dp))
                    Text(action, style = MaterialTheme.typography.bodyMedium, color = OnSurfaceNeutral)
                }
                Spacer(modifier = Modifier.height(6.dp))
            }
        }
    }
}

@Composable
private fun CycleMetaRow(label: String, value: String?) {
    if (value == null) return
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = OnSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodyMedium, color = PrimaryForest, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun GuidanceList(title: String, items: List<String>) {
    Column {
        Text(title.uppercase(), style = MaterialTheme.typography.labelMedium, color = PrimaryForest)
        Spacer(modifier = Modifier.height(8.dp))
        items.forEach { item ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top
            ) {
                Text("•", color = SecondaryTerracotta, modifier = Modifier.padding(end = 8.dp))
                Text(item, style = MaterialTheme.typography.bodyMedium, color = OnSurfaceNeutral)
            }
            Spacer(modifier = Modifier.height(6.dp))
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
    recordKind: RecordKind,
    isSubmitting: Boolean,
    error: String?,
    onDismiss: () -> Unit,
    onSubmit: (LogDraft) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var selectedType by remember { mutableStateOf(LogType.NOTE) }
    var eventAt by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }
    var severity by remember { mutableStateOf("MEDIUM") }
    var harvestQuantityValue by remember { mutableStateOf("") }
    var harvestQuantityUnit by remember { mutableStateOf("kg") }
    var quality by remember { mutableStateOf("GOOD") }
    var harvestLossCategory by remember { mutableStateOf("OTHER") }
    var harvestLossNote by remember { mutableStateOf("") }
    var fruitSetStrength by remember { mutableStateOf("MEDIUM") }
    var pruningType by remember { mutableStateOf("") }
    var feedingType by remember { mutableStateOf("") }

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
                items(
                    recordKind.availableLogTypes()
                ) { type ->
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

            Text(
                text = selectedType.promptText(),
                style = MaterialTheme.typography.bodyMedium,
                color = OnSurfaceVariant
            )

            Spacer(modifier = Modifier.height(20.dp))
            BagichaInput(
                label = "WHEN DID THIS HAPPEN?",
                placeholder = "YYYY-MM-DD, YYYY-MM, or YYYY",
                value = eventAt,
                onValueChange = { eventAt = it }
            )

            if (selectedType.requiresSeverity()) {
                Spacer(modifier = Modifier.height(20.dp))
                Text(text = "SEVERITY", style = MaterialTheme.typography.labelMedium, color = OnSurfaceVariant)
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("LOW", "MEDIUM", "HIGH").forEach { option ->
                        StagePebble(option, severity == option) { severity = option }
                    }
                }
            }

            if (selectedType == LogType.HARVEST) {
                Spacer(modifier = Modifier.height(20.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(modifier = Modifier.weight(1f)) {
                        BagichaInput(
                            label = "HARVEST QUANTITY",
                            placeholder = "e.g. 12",
                            value = harvestQuantityValue,
                            onValueChange = { harvestQuantityValue = it }
                        )
                    }
                    Box(modifier = Modifier.weight(1f)) {
                        BagichaInput(
                            label = "UNIT",
                            placeholder = "kg / fruits",
                            value = harvestQuantityUnit,
                            onValueChange = { harvestQuantityUnit = it }
                        )
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "HARVEST QUALITY", style = MaterialTheme.typography.labelMedium, color = OnSurfaceVariant)
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("POOR", "FAIR", "GOOD", "EXCELLENT").forEach { option ->
                        StagePebble(option, quality == option) { quality = option }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text(text = "LOSS CATEGORY", style = MaterialTheme.typography.labelMedium, color = OnSurfaceVariant)
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("CRACKING", "PEST_DAMAGE", "BIRD_DAMAGE", "ROT", "WEATHER_DAMAGE", "OTHER").forEach { option ->
                        StagePebble(option.replace('_', ' '), harvestLossCategory == option) { harvestLossCategory = option }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
                BagichaInput(
                    label = "LOSS / DAMAGE NOTE",
                    placeholder = "e.g. 15 fruits cracked after rain",
                    value = harvestLossNote,
                    onValueChange = { harvestLossNote = it }
                )
            }

            if (selectedType == LogType.FRUIT_SET) {
                Spacer(modifier = Modifier.height(20.dp))
                Text(text = "FRUIT SET STRENGTH", style = MaterialTheme.typography.labelMedium, color = OnSurfaceVariant)
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("LOW", "MEDIUM", "HIGH").forEach { option ->
                        StagePebble(option, fruitSetStrength == option) { fruitSetStrength = option }
                    }
                }
            }

            if (selectedType == LogType.PRUNING) {
                Spacer(modifier = Modifier.height(20.dp))
                BagichaInput(
                    label = "PRUNING TYPE",
                    placeholder = "e.g. light structural pruning",
                    value = pruningType,
                    onValueChange = { pruningType = it }
                )
            }

            if (selectedType == LogType.FEEDING) {
                Spacer(modifier = Modifier.height(20.dp))
                BagichaInput(
                    label = "FEEDING TYPE",
                    placeholder = "e.g. compost + micronutrients",
                    value = feedingType,
                    onValueChange = { feedingType = it }
                )
            }

            // 2. Input Zone
            Spacer(modifier = Modifier.height(24.dp))
            OutlinedTextField(
                value = content,
                onValueChange = { content = it },
                placeholder = { Text(selectedType.placeholderText(), color = OnSurfaceVariant.copy(alpha = 0.4f)) },
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
                onClick = {
                    onSubmit(
                        LogDraft(
                            type = selectedType,
                            eventAt = eventAt.takeIf { it.isNotBlank() },
                            content = content,
                            severity = severity.takeIf { selectedType.requiresSeverity() },
                            harvestQuantityValue = harvestQuantityValue.takeIf { selectedType == LogType.HARVEST },
                            harvestQuantityUnit = harvestQuantityUnit.takeIf { selectedType == LogType.HARVEST },
                            quality = quality.takeIf { selectedType == LogType.HARVEST },
                            harvestLossCategory = harvestLossCategory.takeIf { selectedType == LogType.HARVEST },
                            harvestLossNote = harvestLossNote.takeIf { selectedType == LogType.HARVEST },
                            fruitSetStrength = fruitSetStrength.takeIf { selectedType == LogType.FRUIT_SET },
                            pruningType = pruningType.takeIf { selectedType == LogType.PRUNING },
                            feedingType = feedingType.takeIf { selectedType == LogType.FEEDING }
                        )
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp)
                    .background(PrimaryGradient, FullRounded),
                shape = FullRounded,
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                enabled = selectedType.canSubmitMoment(
                    content = content,
                    harvestQuantityValue = harvestQuantityValue,
                    pruningType = pruningType,
                    feedingType = feedingType
                ) && !isSubmitting
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

private fun Tree.buildSummary(): String {
    val varietyText = variety?.let { "Variety: $it." } ?: ""
    val familyText = speciesFamily?.let { " Family: $it." } ?: ""
    val habitText = " Growth habit: ${growthHabit.displayLabel()}."
    val patternText = " Record pattern: ${recordPattern.displayLabel()}."
    val plantingText = plantingDateInput?.let { " Planted: $it." } ?: plantingDate?.let { " Planted on ${it.take(10)}." } ?: ""
    return "${species} in ${stage.displayLabel(recordKind).lowercase()} stage.$familyText $varietyText$habitText$patternText Health status: $health.$plantingText".trim()
}

private fun String.formatHeroTitle(): String {
    return split(" ").joinToString("\n")
}

private fun Tree.toHeroLabel(): String {
    return when (recordKind) {
        RecordKind.TREE -> when (type) {
            TreeCategory.FRUIT_BEARING -> "FRUIT TREE RECORD"
            TreeCategory.NON_FRUIT_BEARING -> "TREE RECORD"
            TreeCategory.ORNAMENTAL -> "ORNAMENTAL TREE RECORD"
        }
        RecordKind.FLOWER -> "FLOWER RECORD"
        RecordKind.CROP -> "CROP RECORD"
    }
}

private fun Tree.lifecycleSteps(): List<LifecycleStepDefinition> {
    return when (recordKind) {
        RecordKind.TREE -> listOf(
            LifecycleStepDefinition("Sapling", Icons.Default.Yard, LifecycleStage.SAPLING),
            LifecycleStepDefinition("Juvenile", Icons.Default.Eco, LifecycleStage.JUVENILE),
            LifecycleStepDefinition("Flowering", Icons.Default.EnergySavingsLeaf, LifecycleStage.FLOWERING),
            LifecycleStepDefinition("Harvest", Icons.Default.VerifiedUser, LifecycleStage.FIRST_HARVEST),
            LifecycleStepDefinition("Mature", Icons.Default.Park, LifecycleStage.MATURE),
        )
        RecordKind.FLOWER -> listOf(
            LifecycleStepDefinition("Seedling", Icons.Default.Yard, LifecycleStage.SAPLING),
            LifecycleStepDefinition("Vegetative", Icons.Default.Eco, LifecycleStage.JUVENILE),
            LifecycleStepDefinition("Flowering", Icons.Default.EnergySavingsLeaf, LifecycleStage.FLOWERING),
            LifecycleStepDefinition("Established", Icons.Default.Park, LifecycleStage.MATURE),
        )
        RecordKind.CROP -> listOf(
            LifecycleStepDefinition("Seedling", Icons.Default.Yard, LifecycleStage.SAPLING),
            LifecycleStepDefinition("Vegetative", Icons.Default.Eco, LifecycleStage.JUVENILE),
            LifecycleStepDefinition("Flowering", Icons.Default.EnergySavingsLeaf, LifecycleStage.FLOWERING),
            LifecycleStepDefinition("Harvest", Icons.Default.VerifiedUser, LifecycleStage.FIRST_HARVEST),
        )
    }
}

private fun Tree.plantedLabel(): String = when (recordKind) {
    RecordKind.CROP -> "Started"
    else -> "Planted"
}

private fun Tree.firstFloweringLabel(): String = when (recordKind) {
    RecordKind.FLOWER -> "First Bloom"
    else -> "First Flowering"
}

private fun Tree.supportsHarvestMilestones(): Boolean = recordKind != RecordKind.FLOWER

private fun Tree.supportsFruitingMilestones(): Boolean = recordKind != RecordKind.FLOWER

private fun LifecycleStage.displayLabel(recordKind: RecordKind): String {
    return when (recordKind) {
        RecordKind.TREE -> when (this) {
            LifecycleStage.SAPLING -> "Sapling"
            LifecycleStage.JUVENILE -> "Juvenile"
            LifecycleStage.FLOWERING -> "First Flowering"
            LifecycleStage.FIRST_HARVEST -> "First Harvest"
            LifecycleStage.MATURE -> "Mature Bearing"
        }
        RecordKind.FLOWER -> when (this) {
            LifecycleStage.SAPLING -> "Seedling"
            LifecycleStage.JUVENILE -> "Vegetative"
            LifecycleStage.FLOWERING -> "Flowering"
            LifecycleStage.FIRST_HARVEST -> "Peak Bloom"
            LifecycleStage.MATURE -> "Established"
        }
        RecordKind.CROP -> when (this) {
            LifecycleStage.SAPLING -> "Seedling"
            LifecycleStage.JUVENILE -> "Vegetative"
            LifecycleStage.FLOWERING -> "Flowering"
            LifecycleStage.FIRST_HARVEST -> "Harvest Window"
            LifecycleStage.MATURE -> "Established"
        }
    }
}

private fun GrowthHabit.displayLabel(): String {
    return when (this) {
        GrowthHabit.PERENNIAL -> "Perennial"
        GrowthHabit.ANNUAL -> "Annual"
        GrowthHabit.BIENNIAL -> "Biennial"
        GrowthHabit.SEASONAL -> "Seasonal"
        GrowthHabit.UNKNOWN -> "Unknown"
    }
}

private fun RecordPattern.displayLabel(): String {
    return when (this) {
        RecordPattern.LONG_LIVED -> "Long lived"
        RecordPattern.RECURRING_SEASONAL -> "Recurring seasonal"
        RecordPattern.ONE_OFF_SEASON -> "One off season"
    }
}

private fun RecordKind.displayName(): String {
    return when (this) {
        RecordKind.TREE -> "Tree"
        RecordKind.FLOWER -> "Flower"
        RecordKind.CROP -> "Crop"
    }
}

private fun LogType.displayLabel(): String {
    return when (this) {
        LogType.PLANTING -> "Planting"
        LogType.PHOTO -> "Photo"
        LogType.NOTE -> "Note"
        LogType.WATERING -> "Watering"
        LogType.WATERING_STRESS -> "Water Stress"
        LogType.PRUNING -> "Pruning"
        LogType.FEEDING -> "Feeding"
        LogType.FLOWERING -> "Flowering"
        LogType.FLOWER_DROP -> "Flower Drop"
        LogType.FRUIT_SET -> "Fruit Set"
        LogType.FRUIT_DROP -> "Fruit Drop"
        LogType.HARVEST -> "Harvest"
        LogType.PEST -> "Pest Diagnosis"
        LogType.TREATMENT -> "Treatment"
        LogType.DIAGNOSIS -> "Diagnosis"
        LogType.WEATHER_DAMAGE -> "Weather Damage"
    }
}

private fun LogType.promptText(): String {
    return when (this) {
        LogType.FLOWERING -> "Record when flowering started and any useful context."
        LogType.FLOWER_DROP -> "Capture how much flower drop you saw and what may have triggered it."
        LogType.FRUIT_SET -> "Record first visible fruit set or how strong the set looks."
        LogType.FRUIT_DROP -> "Record fruit drop so the next cycle can be compared properly."
        LogType.HARVEST -> "Record quantity, quality, or any harvest outcome you observed."
        LogType.WATERING_STRESS -> "Log drought or irrigation stress to improve future mitigation."
        LogType.PRUNING -> "Record pruning work done on this record."
        LogType.FEEDING -> "Record feeding or nutrient support applied."
        LogType.PEST -> "Record pest symptoms or confirmed pest presence."
        LogType.TREATMENT -> "Record what treatment was applied and on which part was affected."
        LogType.DIAGNOSIS -> "Record a diagnosis result or suspected issue."
        else -> "Add a structured event to this record's history."
    }
}

private fun LogType.canSubmitMoment(
    content: String,
    harvestQuantityValue: String,
    pruningType: String,
    feedingType: String
): Boolean {
    if (content.isNotBlank()) return true
    return when (this) {
        LogType.HARVEST -> harvestQuantityValue.isNotBlank()
        LogType.PRUNING -> pruningType.isNotBlank()
        LogType.FEEDING -> feedingType.isNotBlank()
        LogType.FLOWERING,
        LogType.FLOWER_DROP,
        LogType.FRUIT_SET,
        LogType.FRUIT_DROP,
        LogType.WATERING_STRESS,
        LogType.PEST,
        LogType.TREATMENT,
        LogType.DIAGNOSIS,
        LogType.WEATHER_DAMAGE -> true
        else -> false
    }
}

private fun LogType.placeholderText(): String {
    return when (this) {
        LogType.FLOWERING -> "Panicles visible across most outer branches..."
        LogType.FLOWER_DROP -> "Flower drop increased after two hot dry days..."
        LogType.FRUIT_SET -> "Small fruit set visible on the south side..."
        LogType.FRUIT_DROP -> "Young fruit dropped after sudden heat..."
        LogType.HARVEST -> "First harvest was light but fruit quality was good..."
        LogType.WATERING_STRESS -> "Leaves curled and soil was dry near roots..."
        LogType.PRUNING -> "Light structural pruning done after harvest..."
        LogType.FEEDING -> "Applied compost and micronutrient mix..."
        LogType.PEST -> "Saw hopper activity on new panicles..."
        LogType.TREATMENT -> "Neem spray applied to affected branches..."
        LogType.DIAGNOSIS -> "Likely anthracnose on inflorescences..."
        else -> "What happened with this record?"
    }
}

private fun LogType.requiresSeverity(): Boolean {
    return this == LogType.FLOWER_DROP || this == LogType.FRUIT_DROP || this == LogType.WATERING_STRESS
}

private fun String.readableToken(): String {
    return split("_").joinToString(" ") { token ->
        token.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
    }
}

private fun String?.toDisplayDate(): String? {
    val value = this?.takeUnless { it.isBlank() } ?: return null
    return when {
        value.length >= 10 && value[4] == '-' && value[7] == '-' -> value.take(10)
        value.length >= 7 && value[4] == '-' -> value.take(7)
        else -> value
    }
}

private fun List<TreeLog>.groupIntoCycles(): List<TimelineCycleGroup> {
    return groupBy { it.timestamp.toCycleYearLabel() }
        .entries
        .sortedByDescending { it.key.cycleSortKey() }
        .map { (label, entries) ->
            TimelineCycleGroup(
                label = label,
                sublabel = entries.buildCycleSublabel(),
                entries = entries.sortedByDescending { it.timestamp }
            )
        }
}

private fun String.toCycleYearLabel(): String {
    return try {
        "${OffsetDateTime.parse(this).year} cycle"
    } catch (_: Exception) {
        "Earlier records"
    }
}

private fun String.cycleSortKey(): Int {
    return substringBefore(' ').toIntOrNull() ?: Int.MIN_VALUE
}

private fun List<TreeLog>.buildCycleSublabel(): String {
    val primaryTypes = map { it.type }
    return when {
        primaryTypes.any { it == LogType.HARVEST } -> "Harvest history and care events"
        primaryTypes.any { it == LogType.FLOWERING || it == LogType.FRUIT_SET } -> "Flowering and fruiting observations"
        else -> "Care and observation history"
    }
}

private fun RecordKind.availableLogTypes(): List<LogType> {
    return when (this) {
        RecordKind.TREE -> listOf(
            LogType.FLOWERING,
            LogType.FLOWER_DROP,
            LogType.FRUIT_SET,
            LogType.FRUIT_DROP,
            LogType.HARVEST,
            LogType.WATERING_STRESS,
            LogType.PRUNING,
            LogType.FEEDING,
            LogType.PEST,
            LogType.TREATMENT,
            LogType.DIAGNOSIS,
            LogType.NOTE,
        )
        RecordKind.FLOWER -> listOf(
            LogType.FLOWERING,
            LogType.FLOWER_DROP,
            LogType.WATERING_STRESS,
            LogType.PRUNING,
            LogType.FEEDING,
            LogType.PEST,
            LogType.TREATMENT,
            LogType.DIAGNOSIS,
            LogType.NOTE,
        )
        RecordKind.CROP -> listOf(
            LogType.FLOWERING,
            LogType.FLOWER_DROP,
            LogType.FRUIT_SET,
            LogType.FRUIT_DROP,
            LogType.HARVEST,
            LogType.WATERING_STRESS,
            LogType.PRUNING,
            LogType.FEEDING,
            LogType.PEST,
            LogType.TREATMENT,
            LogType.DIAGNOSIS,
            LogType.NOTE,
        )
    }
}

private fun String.toMetadataLabel(): String {
    return when (this) {
        "fruit_set_strength" -> "Fruit set"
        "pruning_type" -> "Pruning"
        "feeding_type" -> "Feeding"
        else -> replace('_', ' ')
            .split(' ')
            .joinToString(" ") { token -> token.replaceFirstChar { it.uppercase() } }
    }
}

private fun TreeTask.priorityColor(): Color {
    return when (priority.uppercase()) {
        "HIGH" -> SecondaryTerracotta
        "LOW" -> PrimaryForest.copy(alpha = 0.7f)
        else -> PrimaryForest
    }
}

private data class GroupedTreeTasks(
    val overdue: List<TreeTask>,
    val upcoming: List<TreeTask>,
    val closed: List<TreeTask>
)

private fun List<TreeTask>.groupForDisplay(): GroupedTreeTasks {
    val today = LocalDate.now()
    val overdue = mutableListOf<TreeTask>()
    val upcoming = mutableListOf<TreeTask>()
    val closed = mutableListOf<TreeTask>()

    for (task in this) {
        when {
            task.status.equals("Completed", ignoreCase = true) ||
                task.status.equals("Skipped", ignoreCase = true) -> {
                closed += task
            }

            task.dueAt.toLocalDateOrNull()?.isBefore(today) == true -> {
                overdue += task
            }

            else -> {
                upcoming += task
            }
        }
    }

    return GroupedTreeTasks(
        overdue = overdue.sortedBy { it.dueAt },
        upcoming = upcoming.sortedBy { it.dueAt },
        closed = closed.sortedByDescending { it.dueAt }
    )
}

private fun String.toLocalDateOrNull(): LocalDate? {
    return try {
        OffsetDateTime.parse(this).toLocalDate()
    } catch (_: Exception) {
        null
    }
}

private fun TreeTask.explanationText(): String? {
    val specific = reason?.takeIf { it.isNotBlank() }
    val sourceContext = sourceSummary?.takeIf { it.isNotBlank() }
    return listOfNotNull(specific, sourceContext).joinToString(" ").takeIf { it.isNotBlank() }
}

private fun TreeCycleSummary.harvestOutcomeLabel(): String {
    return when {
        yieldSummary != null -> yieldSummary
        harvestWindow != null -> "Harvest logged"
        else -> "No harvest logged"
    }
}

private fun TreeCycleSummary.stressOutcomeLabel(): String {
    return when {
        stressScore <= 0 -> "No stress logs"
        stressScore == 1 -> "1 stress signal"
        else -> "$stressScore stress signals"
    }
}

private fun TreeCycleSummary.pestOutcomeLabel(): String {
    return when {
        pestPressureScore <= 0 -> "No pest logs"
        pestPressureScore == 1 -> "1 pest signal"
        else -> "$pestPressureScore pest signals"
    }
}

private fun TreeCycleSummary.fruitSetOutcomeLabel(): String {
    return when {
        fruitSetDate != null -> "Confirmed"
        floweringDate != null -> "Not confirmed"
        else -> "No flowering log"
    }
}

private fun TreeCycleSummary.buildChangeNotes(previous: TreeCycleSummary?): List<String> {
    if (previous == null) {
        val notes = mutableListOf<String>()
        if (floweringDate != null && fruitSetDate == null) {
            notes += "Flowering was recorded, but fruit set was not confirmed in this cycle."
        }
        if (stressScore > 0) {
            notes += "Stress signals were recorded, so moisture or weather stability should be watched more closely next cycle."
        }
        if (pestPressureScore > 0) {
            notes += "Pest pressure appeared in this cycle and should be tracked earlier next time."
        }
        return notes
    }

    val notes = mutableListOf<String>()

    if (harvestWindow == null && previous.harvestWindow != null) {
        notes += "The latest cycle has not reached harvest yet, while the previous cycle did."
    } else if (harvestWindow != null && previous.harvestWindow == null) {
        notes += "The latest cycle recorded a harvest where the previous cycle did not."
    } else if (yieldSummary != null && previous.yieldSummary != null && yieldSummary != previous.yieldSummary) {
        notes += "Harvest outcome changed from ${previous.yieldSummary.lowercase()} to ${yieldSummary.lowercase()}."
    }

    if (stressScore > previous.stressScore) {
        notes += "Stress signals increased from ${previous.stressScore} to $stressScore."
    } else if (stressScore < previous.stressScore) {
        notes += "Stress signals dropped from ${previous.stressScore} to $stressScore."
    }

    if (pestPressureScore > previous.pestPressureScore) {
        notes += "Pest pressure increased compared with the previous cycle."
    } else if (pestPressureScore < previous.pestPressureScore) {
        notes += "Pest pressure eased compared with the previous cycle."
    }

    if (floweringDate != null && fruitSetDate == null && previous.fruitSetDate != null) {
        notes += "This cycle has flowering recorded but no confirmed fruit set yet, unlike the previous cycle."
    } else if (fruitSetDate != null && previous.fruitSetDate == null) {
        notes += "Fruit set was confirmed this cycle after being absent in the previous one."
    }

    if (notes.isEmpty()) {
        notes += "The current and previous cycles look broadly similar from the recorded data so far."
    }

    return notes
}
