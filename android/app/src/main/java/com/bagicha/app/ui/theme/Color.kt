package com.bagicha.app.ui.theme

import androidx.compose.ui.graphics.Color

// The Curated Sanctuary - Full Palette
val PrimaryForest = Color(0xFF173124)
val PrimaryForestContainer = Color(0xFF2D4739)
val SecondaryTerracotta = Color(0xFF9B4425)
val SecondaryTerracottaContainer = Color(0xFFFD916B)

val SurfaceBase = Color(0xFFFCF9F4)
val SurfaceContainerLow = Color(0xFFF6F3EE)
val SurfaceContainer = Color(0xFFF0EDE8)
val SurfaceContainerLowest = Color(0xFFFFFFFF)

// Functional Tokens
val OnSurfaceNeutral = Color(0xFF1C1C19)
val OnSurfaceVariant = Color(0xFF424844)
val OnSurfaceMuted = Color(0xFF6B705C)
val OnBackground = Color(0xFF1C1C19)

// Borders & Elevation
val GhostBorderPrimary = PrimaryForest.copy(alpha = 0.2f)
val GhostBorderNeutral = OnSurfaceNeutral.copy(alpha = 0.15f)

// Extended Palette
val PrimaryFixed = Color(0xFFCCEAD6)
val PrimaryFixedDim = Color(0xFFB0CDBB)
val Tertiary = Color(0xFF292E09)
val TertiaryContainer = Color(0xFF40441E)
val TertiaryFixedDim = Color(0xFFC6CA98)
val Error = Color(0xFFBA1A1A)
val ErrorContainer = Color(0xFFFFDAD6)
val OutlineVariant = Color(0xFFC2C8C2).copy(alpha = 0.3f)
