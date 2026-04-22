package com.bagicha.app.ui.features.vision

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.bagicha.app.ui.navigation.Screen
import com.bagicha.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScanScreen(
    viewModel: VisionViewModel,
    navController: NavController
) {
    val scanMode by viewModel.scanMode.collectAsState()
    val scanStatus by viewModel.scanStatus.collectAsState()

    Box(modifier = Modifier.fillMaxSize()) {
        // 1. Camera Viewfinder Background
        CameraPreview()
        
        // Depth Vignette
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(PrimaryForest.copy(alpha = 0.2f), Color.Transparent, PrimaryForest.copy(alpha = 0.3f))
                    )
                )
        )

        // 2. Glassmorphic Top Bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 24.dp, vertical = 16.dp)
                .clip(FullRounded)
                .background(SurfaceBase.copy(alpha = 0.4f))
                .blur(30.dp)
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 24.dp, vertical = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { navController.popBackStack() }) {
                    Icon(Icons.Default.Close, null, tint = PrimaryForest)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "Bagicha Scan", 
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontStyle = FontStyle.Italic,
                        fontFamily = androidx.compose.ui.text.font.FontFamily.Serif,
                        fontSize = 20.sp
                    ),
                    color = PrimaryForest
                )
            }
            Icon(Icons.Default.Info, null, tint = PrimaryForest)
        }

        // 3. Smart Tip
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 120.dp)
                .background(SurfaceBase.copy(alpha = 0.8f), FullRounded)
                .padding(horizontal = 24.dp, vertical = 12.dp)
        ) {
            Text(
                "Focus on the leaf veins for better diagnosis.",
                style = MaterialTheme.typography.labelMedium,
                color = PrimaryForest
            )
        }

        // 4. Organic Pebble Reticle
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(48.dp),
            contentAlignment = Alignment.Center
        ) {
            PebbleReticle(isScanning = scanStatus == ScanStatus.SCANNING)
        }

        // 5. Bottom Controls
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 48.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(32.dp)
        ) {
            // Hybrid Mode Toggle
            Box(
                modifier = Modifier
                    .background(SurfaceBase.copy(alpha = 0.8f), FullRounded)
                    .padding(6.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ModeButton("IDENTIFY", scanMode == ScanMode.IDENTIFY) { viewModel.setScanMode(ScanMode.IDENTIFY) }
                    ModeButton("DIAGNOSE", scanMode == ScanMode.DIAGNOSE) { viewModel.setScanMode(ScanMode.DIAGNOSE) }
                }
            }

            // Main Interaction Row
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 48.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                GlassControlIcon(Icons.Default.PhotoLibrary)
                
                // The River Stone (Capture Button)
                Box(
                    modifier = Modifier
                        .size(92.dp)
                        .background(SurfaceBase.copy(alpha = 0.4f), CircleShape)
                        .padding(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(PrimaryGradient, CircleShape)
                            .clickable {
                                viewModel.startScan()
                                if (scanMode == ScanMode.IDENTIFY) navController.navigate(Screen.IdentifyResult.route)
                                else navController.navigate(Screen.DiagnoseResult.route)
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .border(2.dp, Color.White.copy(alpha = 0.3f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Box(modifier = Modifier.size(16.dp).background(Color.White, CircleShape))
                        }
                    }
                }

                GlassControlIcon(Icons.Default.FlashOn)
            }
        }
    }
}

@Composable
fun PebbleReticle(isScanning: Boolean) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(tween(1500), RepeatMode.Reverse),
        label = "alpha"
    )

    Box(modifier = Modifier.size(width = 280.dp, height = 320.dp)) {
        // Organic Pebble Border
        Box(
            modifier = Modifier
                .fillMaxSize()
                .border(2.dp, PrimaryForest.copy(alpha = alpha), PebbleShape6)
                .clip(PebbleShape6)
        )
        
        // Corner Accents
        Box(modifier = Modifier.align(Alignment.TopStart).size(32.dp).border(width = 3.dp, color = PrimaryFixedDim, shape = RoundedCornerShape(topStart = 24.dp)))
        Box(modifier = Modifier.align(Alignment.BottomEnd).size(32.dp).border(width = 3.dp, color = PrimaryFixedDim, shape = RoundedCornerShape(bottomEnd = 24.dp)))
    }
}

@Composable
fun ModeButton(text: String, isSelected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(FullRounded)
            .background(if (isSelected) PrimaryForest else Color.Transparent)
            .clickable { onClick() }
            .padding(horizontal = 24.dp, vertical = 10.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = if (isSelected) Color.White else PrimaryForest.copy(alpha = 0.6f)
        )
    }
}

@Composable
fun GlassControlIcon(icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Box(
        modifier = Modifier
            .size(56.dp)
            .background(SurfaceBase.copy(alpha = 0.8f), CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, null, tint = PrimaryForest, modifier = Modifier.size(24.dp))
    }
}
