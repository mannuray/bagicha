package com.bagicha.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = PrimaryForest,
    primaryContainer = PrimaryForestContainer,
    secondary = SecondaryTerracotta,
    secondaryContainer = SecondaryTerracottaContainer,
    background = SurfaceBase,
    surface = SurfaceContainerLow,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = OnSurfaceNeutral,
    onSurface = OnSurfaceNeutral,
    surfaceVariant = SurfaceContainer,
    outlineVariant = GhostBorderNeutral
)

// Signature Primary Gradient (135 degrees)
val PrimaryGradient = Brush.linearGradient(
    colors = listOf(PrimaryForest, PrimaryForestContainer)
)

@Composable
fun BagichaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = LightColorScheme // System is light-mode first (Oat/Oat)
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = PrimaryForest.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}
