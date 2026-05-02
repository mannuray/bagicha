package com.bagicha.app.ui.features.ledger

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.bagicha.app.ui.theme.OnSurfaceMuted
import com.bagicha.app.ui.theme.OnSurfaceVariant
import com.bagicha.app.ui.theme.PrimaryForest
import com.bagicha.app.ui.theme.PrimaryForestContainer
import com.bagicha.app.ui.theme.SecondaryTerracotta
import com.bagicha.app.ui.theme.SecondaryTerracottaContainer
import com.bagicha.app.ui.theme.SurfaceBase
import com.bagicha.app.ui.theme.SurfaceContainerLow

@Composable
fun TreeTasksSection(
    recordKind: RecordKind,
    tasks: List<PlantTask>,
    isSubmitting: Boolean,
    onSyncTasks: () -> Unit,
    onCompleteTask: (String) -> Unit,
    onSkipTask: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "${recordKind.displayName().uppercase()} TASKS",
                    style = MaterialTheme.typography.labelMedium,
                    color = SecondaryTerracotta
                )
                Text(
                    text = "Action Queue",
                    style = MaterialTheme.typography.headlineSmall,
                    color = PrimaryForest
                )
            }
            OutlinedButton(onClick = onSyncTasks, enabled = !isSubmitting) {
                Text(if (isSubmitting) "Syncing..." else "Sync")
            }
        }

        if (tasks.isEmpty()) {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceContainerLow),
                shape = RoundedCornerShape(24.dp)
            ) {
                Text(
                    text = "No tasks yet for this record.",
                    modifier = Modifier.padding(20.dp),
                    style = MaterialTheme.typography.bodyMedium,
                    color = OnSurfaceVariant
                )
            }
            return
        }

        tasks.forEach { task ->
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceContainerLow),
                shape = RoundedCornerShape(24.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = task.title,
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = PrimaryForest
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = buildTaskMeta(task),
                                style = MaterialTheme.typography.bodySmall,
                                color = OnSurfaceMuted
                            )
                        }
                        StatusPip(task.status)
                    }

                    task.reason?.takeIf { it.isNotBlank() }?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodyMedium,
                            color = OnSurfaceVariant
                        )
                    }

                    task.sourceSummary?.takeIf { it.isNotBlank() }?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodySmall,
                            color = OnSurfaceMuted
                        )
                    }

                    if (task.status.equals("Pending", ignoreCase = true)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Button(onClick = { onCompleteTask(task.id) }) {
                                Text("Done")
                            }
                            OutlinedButton(onClick = { onSkipTask(task.id) }) {
                                Text("Skip")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SeasonReviewSection(plan: MitigationPlan) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceContainerLow),
        shape = RoundedCornerShape(28.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("Season Review", style = MaterialTheme.typography.headlineSmall, color = PrimaryForest)
            plan.cycleYear?.let {
                Text("$it cycle", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
            }
            Text(plan.summary, style = MaterialTheme.typography.bodyLarge, color = OnSurfaceVariant)
            Text(
                text = "Tasks: ${plan.completedTasks} done • ${plan.pendingTasks} pending • ${plan.skippedTasks} skipped",
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceMuted
            )
        }
    }
}

@Composable
fun NextCycleMitigationSection(plan: MitigationPlan) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceBase),
        shape = RoundedCornerShape(28.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            Text("Next Cycle Plan", style = MaterialTheme.typography.headlineSmall, color = PrimaryForest)
            PlanListBlock("Likely issues", plan.likelyIssues)
            PlanListBlock("What to change", plan.whatToChange)
            PlanListBlock("Watch early", plan.watchEarly)
            PlanListBlock("Priority actions", plan.priorityActions)
        }
    }
}

@Composable
fun CycleSummarySection(cycles: List<CycleSummary>) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Cycle History", style = MaterialTheme.typography.headlineSmall, color = PrimaryForest)
        cycles.forEach { cycle ->
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceContainerLow),
                shape = RoundedCornerShape(24.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("${cycle.year} cycle", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = PrimaryForest)
                    Text(cycle.summary, style = MaterialTheme.typography.bodyMedium, color = OnSurfaceVariant)
                    cycle.yieldSummary?.let {
                        Text("Yield: $it", style = MaterialTheme.typography.bodySmall, color = OnSurfaceMuted)
                    }
                    val events = cycle.recentEventLabels.takeIf { it.isNotEmpty() }?.joinToString(" • ")
                    if (events != null) {
                        Text(events, style = MaterialTheme.typography.bodySmall, color = SecondaryTerracotta)
                    }
                }
            }
        }
    }
}

@Composable
private fun PlanListBlock(title: String, items: List<String>) {
    if (items.isEmpty()) return
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(title.uppercase(), style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
        items.forEach { item ->
            Text("• $item", style = MaterialTheme.typography.bodyMedium, color = OnSurfaceVariant)
        }
    }
}

@Composable
private fun StatusPip(status: String) {
    val background = when {
        status.equals("Completed", ignoreCase = true) -> PrimaryForestContainer
        status.equals("Skipped", ignoreCase = true) -> SecondaryTerracottaContainer
        else -> Color(0xFFE8EFEA)
    }
    val foreground = when {
        status.equals("Completed", ignoreCase = true) -> Color.White
        status.equals("Skipped", ignoreCase = true) -> PrimaryForest
        else -> PrimaryForest
    }
    Row(
        modifier = Modifier
            .background(background, RoundedCornerShape(999.dp))
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        androidx.compose.foundation.layout.Box(
            modifier = Modifier
                .size(6.dp)
                .background(foreground, CircleShape)
        )
        Text(status.uppercase(), style = MaterialTheme.typography.labelSmall, color = foreground)
    }
}

private fun buildTaskMeta(task: PlantTask): String {
    return listOfNotNull(
        task.priority.takeIf { it.isNotBlank() },
        task.dueDate.takeIf { it.isNotBlank() },
        task.cycleLabel?.takeIf { it.isNotBlank() },
        task.source.takeIf { it.isNotBlank() }
    ).joinToString(" • ")
}

