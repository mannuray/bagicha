package com.bagicha.app.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val Shapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(24.dp)
)

val FullRounded = RoundedCornerShape(9999.dp)

// Pebble Shapes
val PebbleShape1 = RoundedCornerShape(topStartPercent = 42, topEndPercent = 58, bottomEndPercent = 70, bottomStartPercent = 30)
val PebbleShape2 = RoundedCornerShape(topStartPercent = 50, topEndPercent = 50, bottomEndPercent = 33, bottomStartPercent = 67)
val PebbleShape3 = RoundedCornerShape(topStartPercent = 60, topEndPercent = 40, bottomEndPercent = 55, bottomStartPercent = 45)
val PebbleShape4 = RoundedCornerShape(topStartPercent = 30, topEndPercent = 70, bottomEndPercent = 40, bottomStartPercent = 60)
val PebbleShape5 = RoundedCornerShape(topStartPercent = 50, topEndPercent = 50, bottomEndPercent = 50, bottomStartPercent = 50)
val PebbleShape6 = RoundedCornerShape(topStartPercent = 40, topEndPercent = 60, bottomEndPercent = 70, bottomStartPercent = 30)

val PebbleShapes = listOf(PebbleShape1, PebbleShape2, PebbleShape3, PebbleShape4, PebbleShape5, PebbleShape6)

// Chat Bubble Shapes from the New Design
val BubbleExpertShape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp, bottomEnd = 32.dp, bottomStart = 8.dp)
val BubbleUserShape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp, bottomEnd = 8.dp, bottomStart = 32.dp)
