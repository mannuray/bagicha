package com.bagicha.app.ui.features.dashboard
import androidx.compose.foundation.clickable
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.rotate

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.WaterDrop
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.bagicha.app.R
import com.bagicha.app.ui.theme.*

@Composable
fun DashboardHeader(weather: WeatherInfo) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${weather.district.uppercase()} SANCTUARY",
                    style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                    color = SecondaryTerracotta
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${weather.temp}°C ☀️",
                        style = MaterialTheme.typography.headlineMedium.copy(fontSize = 28.sp),
                        color = PrimaryForest
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Icon(Icons.Default.WaterDrop, null, tint = PrimaryForest.copy(alpha = 0.4f), modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "65% HUMIDITY",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 1.sp),
                        color = OnSurfaceVariant
                    )
                }
            }
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(SurfaceContainerLow, PebbleShape3)
                    .clip(PebbleShape3),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Notifications, null, tint = PrimaryForest, modifier = Modifier.size(20.dp))
            }
        }
    }
}

@Composable
fun IntegratedObservationTag(alert: UrgentAlert, onDismiss: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(FullRounded)
            .background(SecondaryTerracottaContainer.copy(alpha = 0.2f))
            .clickable { onDismiss() }
            .padding(horizontal = 20.dp, vertical = 12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Warning, null, tint = SecondaryTerracotta, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = alert.message.uppercase(),
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 1.sp, fontWeight = FontWeight.Bold),
                color = SecondaryTerracotta
            )
        }
    }
}

@Composable
fun RipeningInsightPebble() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp)
            .clip(PebbleShape6)
            .background(SurfaceContainerLow),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text("DAYS TO HARVEST", style = MaterialTheme.typography.labelMedium.copy(fontSize = 9.sp, letterSpacing = 2.sp), color = OnSurfaceMuted)
            Spacer(modifier = Modifier.height(16.dp))
            Box(
                modifier = Modifier.size(80.dp).background(SecondaryTerracottaContainer.copy(alpha = 0.1f), PebbleShape1),
                contentAlignment = Alignment.Center
            ) {
                Text("14", style = MaterialTheme.typography.headlineLarge, color = SecondaryTerracotta, fontSize = 36.sp)
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text("Dasheri Mango", style = MaterialTheme.typography.titleMedium, color = PrimaryForest)
        }
    }
}

@Composable
fun JournalTaskItem(
    task: GardenTask,
    shape: androidx.compose.ui.graphics.Shape,
    onToggle: () -> Unit,
    onOpen: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(if (task.isCompleted) PrimaryForest else SurfaceContainer, shape)
                .clip(shape)
                .clickable { onToggle() },
            contentAlignment = Alignment.Center
        ) {
            if (task.isCompleted) {
                Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.size(20.dp))
            }
        }
        Spacer(modifier = Modifier.width(20.dp))
        Column(
            modifier = Modifier
                .weight(1f)
                .clickable { onOpen() }
        ) {
            Text(
                text = task.title,
                style = MaterialTheme.typography.titleLarge.copy(
                    fontSize = 18.sp, 
                    textDecoration = if (task.isCompleted) androidx.compose.ui.text.style.TextDecoration.LineThrough else null
                ),
                color = if (task.isCompleted) OnSurfaceMuted.copy(alpha = 0.5f) else PrimaryForest
            )
            Text(
                text = buildString {
                    task.recordKind?.let {
                        append(
                            when (it) {
                                com.bagicha.app.ui.features.ledger.RecordKind.TREE -> "Tree"
                                com.bagicha.app.ui.features.ledger.RecordKind.FLOWER -> "Flower"
                                com.bagicha.app.ui.features.ledger.RecordKind.CROP -> "Crop"
                            }
                        )
                    }
                    if (!task.treeName.isNullOrBlank()) {
                        if (isNotEmpty()) append(" • ")
                        append(task.treeName)
                    }
                    task.dueDate?.let {
                        if (isNotEmpty()) append(" • ")
                        append(it)
                    }
                    if (isEmpty()) append("Garden record")
                },
                style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp, letterSpacing = 1.sp), 
                color = OnSurfaceMuted.copy(alpha = 0.4f)
            )
        }
    }
}

@Composable
fun FirstLedgerEntryCard(onCreateEntry: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = PrimaryForestContainer.copy(alpha = 0.3f)),
        shape = Shapes.large
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "YOUR FIRST SPECIMEN",
                style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                color = PrimaryForest
            )
            Text(
                text = "Document your first permanent asset to begin the biological legacy timeline.",
                style = MaterialTheme.typography.bodyLarge,
                color = PrimaryForest,
                lineHeight = 24.sp
            )
            Button(
                onClick = onCreateEntry,
                modifier = Modifier.height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryForest),
                shape = FullRounded
            ) {
                Text("Start Registry", color = Color.White)
            }
        }
    }
}
