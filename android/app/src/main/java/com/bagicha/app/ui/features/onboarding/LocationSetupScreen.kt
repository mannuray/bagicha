package com.bagicha.app.ui.features.onboarding

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EnergySavingsLeaf
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.bagicha.app.R
import com.bagicha.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LocationSetupScreen(
    viewModel: OnboardingViewModel,
    onNext: () -> Unit
) {
    val isLoading by viewModel.isLoading.collectAsState()
    val authError by viewModel.authError.collectAsState()

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val granted = permissions.entries.all { it.value }
        if (granted) {
            viewModel.detectLocation(onNext)
        } else {
            viewModel.onLocationPermissionDenied()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceBase),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 1. Fixed Hero Header (33%)
        Box(
            modifier = Modifier.fillMaxWidth().fillMaxHeight(0.33f)
        ) {
            AsyncImage(
                model = R.drawable.login_hero,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
            Box(modifier = Modifier.fillMaxSize().background(PrimaryForest.copy(alpha = 0.1f)))
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Custom Ring Branding
                AsyncImage(
                    model = com.bagicha.app.R.drawable.bagicha_branding,
                    contentDescription = null,
                    modifier = Modifier.size(120.dp)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Bagicha",
                    style = MaterialTheme.typography.titleLarge.copy(
                        color = Color.White, fontStyle = FontStyle.Italic, fontSize = 32.sp
                    )
                )
            }
        }

        // 2. Content Card (Fixed & Proportional)
        Card(
            modifier = Modifier.fillMaxWidth().weight(1f).offset(y = (-48).dp),
            shape = RoundedCornerShape(topStart = 48.dp, topEnd = 48.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceBase),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(text = "Locate Your\nSanctuary", style = MaterialTheme.typography.headlineLarge, color = PrimaryForest, textAlign = androidx.compose.ui.text.style.TextAlign.Center, lineHeight = 40.sp)
                Text(text = "We use high-precision GPS to monitor pest outbreaks and climate changes.", style = MaterialTheme.typography.bodyLarge, textAlign = androidx.compose.ui.text.style.TextAlign.Center, color = OnSurfaceVariant, modifier = Modifier.fillMaxWidth(0.85f))
                
                Spacer(modifier = Modifier.weight(1f))

                Box(
                    modifier = Modifier.size(140.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(modifier = Modifier.fillMaxSize().rotate(-6f).scale(1.1f).clip(PebbleShape6).background(PrimaryForest.copy(alpha = 0.05f)))
                    Box(modifier = Modifier.fillMaxSize().clip(PebbleShape6).background(SurfaceContainerLow), contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.LocationOn, null, tint = SecondaryTerracotta, modifier = Modifier.size(48.dp))
                        Icon(Icons.Default.EnergySavingsLeaf, null, tint = PrimaryForest, modifier = Modifier.size(24.dp).align(Alignment.BottomEnd).offset(x = (-8).dp, y = (-8).dp).background(SurfaceContainer, CircleShape).padding(4.dp))
                    }
                }

                Spacer(modifier = Modifier.weight(1.5f))

                authError?.let { error ->
                    Text(
                        text = error,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                }

                if (isLoading) {
                    CircularProgressIndicator(color = PrimaryForest)
                } else {
                    Button(
                        onClick = {
                            permissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
                        },
                        modifier = Modifier.fillMaxWidth().height(56.dp).background(PrimaryGradient, FullRounded),
                        shape = FullRounded,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.MyLocation, null, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("Detect My Location", style = MaterialTheme.typography.titleLarge, color = Color.White)
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "We use your current location for local weather and pest alerts.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = OnSurfaceVariant,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        modifier = Modifier.fillMaxWidth(0.85f)
                    )
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}
