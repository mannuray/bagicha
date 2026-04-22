package com.bagicha.app.ui.features.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import com.bagicha.app.R
import com.bagicha.app.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(onTimeout: () -> Unit) {
    // Establishing peace for 3 seconds
    LaunchedEffect(Unit) {
        delay(3000) 
        onTimeout()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // 1. Full-screen Custom Sanctuary Image
        Image(
            painter = painterResource(id = R.drawable.bagicha_splash),
            contentDescription = "Bagicha Sanctuary",
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )

        // 2. Subtle ambient gradient for bottom text legibility
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.2f)
                .align(Alignment.BottomCenter)
                .background(
                    androidx.compose.ui.graphics.Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.2f))
                    )
                )
        )
    }
}
