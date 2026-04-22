package com.bagicha.app.ui.features.ledger

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.bagicha.app.ui.theme.*

@Composable
fun PebbleBadge(stage: LifecycleStage) {
    val (color, text) = when (stage) {
        LifecycleStage.SAPLING -> PrimaryForestContainer.copy(alpha = 0.8f) to "Sapling"
        LifecycleStage.JUVENILE -> PrimaryForestContainer.copy(alpha = 0.6f) to "Juvenile"
        LifecycleStage.FLOWERING -> SecondaryTerracottaContainer.copy(alpha = 0.8f) to "Flowering"
        LifecycleStage.MATURE -> PrimaryForest.copy(alpha = 0.9f) to "Mature"
    }

    Box(
        modifier = Modifier
            .background(color, PebbleShape2) // PebbleBadge shape from spec
            .clip(PebbleShape2)
            .padding(horizontal = 12.dp, vertical = 4.dp)
    ) {
        Text(
            text = text.uppercase(),
            color = Color.White,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp
        )
    }
}

@Composable
fun PebbleTreeImage(
    imageUrl: String?,
    shape: androidx.compose.ui.graphics.Shape,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(0.8f) // 4:5 ratio from design
            .clip(shape)
            .background(SurfaceContainer)
    ) {
        if (imageUrl != null) {
            AsyncImage(
                model = imageUrl,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        }
    }
}
