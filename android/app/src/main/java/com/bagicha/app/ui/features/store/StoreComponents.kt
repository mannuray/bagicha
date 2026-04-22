package com.bagicha.app.ui.features.store

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.bagicha.app.ui.theme.*

@Composable
fun ProductCard(
    product: Product,
    onAction: () -> Unit,
    actionLabel: String = "Buy"
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceContainerLow),
        shape = Shapes.large
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .clip(PebbleShape6)
                    .background(SurfaceContainer)
            ) {
                // Placeholder for product image
                Box(modifier = Modifier.fillMaxSize().background(PrimaryForest.copy(alpha = 0.05f)), contentAlignment = Alignment.Center) {
                    Text(text = product.name.first().toString(), style = MaterialTheme.typography.headlineLarge, color = PrimaryForest.copy(alpha = 0.2f))
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = product.name, style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp), color = PrimaryForest)
                    Text(text = "₹${product.price}", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = product.description,
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceMuted.copy(alpha = 0.6f),
                maxLines = 2
            )
            Spacer(modifier = Modifier.height(20.dp))
            Button(
                onClick = onAction,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .background(PrimaryGradient, FullRounded),
                shape = FullRounded,
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
            ) {
                Text(
                    text = actionLabel.uppercase(),
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = 1.sp),
                    color = Color.White
                )
            }
        }
    }
}
