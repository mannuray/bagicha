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
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.bagicha.app.ui.theme.*

@Composable
fun DashboardHeader(weather: WeatherInfo) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "${weather.district.uppercase()} • ${weather.temp}°C ☀️",
                style = MaterialTheme.typography.labelMedium,
                color = OnSurfaceVariant
            )
            Text(
                text = "Good Morning, Arjun",
                style = MaterialTheme.typography.headlineMedium.copy(fontSize = 24.sp),
                color = PrimaryForest
            )
        }
        Box(
            modifier = Modifier.size(40.dp).background(SurfaceContainer, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Notifications, null, tint = PrimaryForest, modifier = Modifier.size(20.dp))
        }
    }
}

@Composable
fun UrgentAlertCardDense(alert: UrgentAlert, onDismiss: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SecondaryTerracottaContainer),
        shape = Shapes.large
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Warning, null, tint = SecondaryTerracotta, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = alert.message,
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.bodyLarge.copy(fontFamily = androidx.compose.ui.text.font.FontFamily.Serif, fontSize = 16.sp),
                color = SecondaryTerracotta
            )
            TextButton(onClick = onDismiss) {
                Text("DONE", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
            }
        }
    }
}

@Composable
fun RipeningInsightCardDense() {
    Card(
        modifier = Modifier.fillMaxWidth().height(180.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceContainerLow),
        shape = Shapes.large
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text("DAYS TO HARVEST", style = MaterialTheme.typography.labelMedium.copy(fontSize = 9.sp))
            Spacer(modifier = Modifier.height(12.dp))
            Box(
                modifier = Modifier.size(70.dp).background(SecondaryTerracottaContainer.copy(alpha = 0.15f), PebbleShape6),
                contentAlignment = Alignment.Center
            ) {
                Text("14", style = MaterialTheme.typography.headlineLarge, color = SecondaryTerracotta, fontSize = 32.sp)
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text("Dasheri Mango", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun VisualAssetBleedDense() {
    Box(
        modifier = Modifier.fillMaxWidth().height(180.dp).clip(Shapes.large)
    ) {
        AsyncImage(
            model = "https://lh3.googleusercontent.com/aida-public/AB6AXuAZ7d1a4JLDWgfwFnrK_NPvFGUoNcwR1p-pGdRGw1qhzQ3R0PkOAcVVKaa0_fUdmehcKOsgWHHmOPOmaJ9L-yQsGTQMjn88Tp8VYOraaZY9bx2NtK2aiF_8-MBLAaXjmIuToy-a9P3thyfMeputpQmMeBUUnY7bt-6uSKXpgP425jRxx48puiR_7LfHs-GOtTIudnG_THeezmu2C5sei0UJNM0xM4MfRGSpMG3EWK7vsH5dwNJXm3GTuSX8-bX6cFkO2HsbftDAGs8",
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, PrimaryForest.copy(alpha = 0.7f)))))
        Column(modifier = Modifier.align(Alignment.BottomStart).padding(16.dp)) {
            Text("The Morning Dew", style = MaterialTheme.typography.titleLarge.copy(fontSize = 16.sp), color = Color.White)
            Text("65% Humidity", style = MaterialTheme.typography.labelMedium.copy(fontSize = 9.sp), color = Color.White.copy(alpha = 0.7f))
        }
    }
}

@Composable
fun TaskItemDense(task: GardenTask, onToggle: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .background(if (task.isCompleted) PrimaryForest else PrimaryForest.copy(alpha = 0.05f), PebbleShape1)
                .clip(PebbleShape1)
                .clickable { onToggle() },
            contentAlignment = Alignment.Center
        ) {
            if (task.isCompleted) {
                Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.size(16.dp))
            }
        }
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = task.title,
                style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp, fontWeight = FontWeight.SemiBold),
                color = if (task.isCompleted) OnSurfaceMuted else PrimaryForest
            )
            Text("South Sector • Guava", style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp), color = OnSurfaceMuted.copy(alpha = 0.6f))
        }
        Text("08:00 AM", style = MaterialTheme.typography.labelMedium.copy(fontSize = 9.sp), color = OnSurfaceMuted.copy(alpha = 0.3f))
    }
}

@Composable
fun FirstLedgerEntryCard(onCreateEntry: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = PrimaryForestContainer),
        shape = Shapes.large
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "CREATE YOUR FIRST ENTRY",
                style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                color = PrimaryForest
            )
            Text(
                text = "Add your first tree or long-lived plant so Bagicha can track its history, care, and health.",
                style = MaterialTheme.typography.bodyLarge,
                color = PrimaryForest
            )
            Button(
                onClick = onCreateEntry,
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryForest),
                shape = FullRounded
            ) {
                Text("Add First Entry", color = Color.White)
            }
        }
    }
}
