package com.bagicha.app.ui.features.community

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PestControl
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bagicha.app.ui.theme.*

@Composable
fun FeedToggle(selectedTab: String, onTabSelected: (String) -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            modifier = Modifier
                .background(SurfaceContainerLow.copy(alpha = 0.6f), FullRounded)
                .padding(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            ToggleOption("LOCAL FEED", selectedTab == "LOCAL") { onTabSelected("LOCAL") }
            ToggleOption("DIRECT CHAT", selectedTab == "DIRECT") { onTabSelected("DIRECT") }
        }
    }
}

@Composable
fun ToggleOption(text: String, isSelected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(FullRounded)
            .background(if (isSelected) PrimaryForest else Color.Transparent)
            .clickable { onClick() }
            .padding(horizontal = 24.dp, vertical = 10.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp),
            color = if (isSelected) Color.White else OnSurfaceNeutral.copy(alpha = 0.6f),
            fontSize = 10.sp
        )
    }
}

@Composable
fun PestRadarBanner(count: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SecondaryTerracottaContainer),
        shape = Shapes.large
    ) {
        Row(
            modifier = Modifier.padding(24.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .background(SurfaceContainerLowest, PebbleShape6),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.PestControl, null, tint = SecondaryTerracotta, modifier = Modifier.size(28.dp))
            }
            Spacer(modifier = Modifier.width(20.dp))
            Column {
                Text(
                    text = "$count neighbors near you reported Mealybugs this week.",
                    style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp),
                    color = SecondaryTerracotta
                )
                Text(
                    text = "CHECK YOUR CITRUS PLANTS IMMEDIATELY",
                    style = MaterialTheme.typography.labelMedium,
                    color = SecondaryTerracotta.copy(alpha = 0.7f)
                )
            }
        }
    }
}

@Composable
fun VerifiedAdviceLabel() {
    Box(
        modifier = Modifier
            .background(SurfaceContainer.copy(alpha = 0.3f), FullRounded)
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Verified, null, tint = PrimaryForest, modifier = Modifier.size(14.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                "SCIENTIFICALLY VERIFIED ADVICE",
                style = MaterialTheme.typography.labelMedium,
                color = PrimaryForest,
                fontSize = 9.sp
            )
        }
    }
}
