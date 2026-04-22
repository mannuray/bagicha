package com.bagicha.app.ui.features.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material.icons.filled.Smartphone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.bagicha.app.R
import com.bagicha.app.ui.features.onboarding.OnboardingViewModel
import com.bagicha.app.ui.theme.*

@Composable
fun LoginScreen(
    viewModel: OnboardingViewModel,
    onOtpSent: () -> Unit
) {
    val phoneNumber by viewModel.phoneNumber.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val authError by viewModel.authError.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceBase)
    ) {
        // 1. Fixed Hero Section (33%)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.33f)
        ) {
            AsyncImage(
                model = R.drawable.login_hero,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
            Box(modifier = Modifier.fillMaxSize().background(PrimaryForest.copy(alpha = 0.2f)))
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Custom Ring Branding
                AsyncImage(
                    model = com.bagicha.app.R.drawable.bagicha_branding,
                    contentDescription = null,
                    modifier = Modifier.size(140.dp)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Bagicha",
                    style = MaterialTheme.typography.headlineLarge.copy(
                        color = Color.White, fontStyle = FontStyle.Italic, fontSize = 40.sp
                    )
                )
            }
        }

        // 2. Content Canvas (Overlapping & Proportional)
        Card(
            modifier = Modifier.fillMaxWidth().weight(1f).offset(y = (-48).dp),
            shape = RoundedCornerShape(topStart = 48.dp, topEnd = 48.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceBase),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize().padding(horizontal = 32.dp, vertical = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(text = "Your Garden Awaits", style = MaterialTheme.typography.headlineMedium, color = PrimaryForest)
                Text(text = "ENTER YOUR PHONE NUMBER", style = MaterialTheme.typography.labelMedium, color = OnSurfaceVariant)
                
                Spacer(modifier = Modifier.weight(1f))

                OutlinedTextField(
                    value = phoneNumber,
                    onValueChange = { viewModel.setPhoneNumber(it) },
                    leadingIcon = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Spacer(modifier = Modifier.width(16.dp))
                            Text("+91", fontWeight = FontWeight.Bold, color = PrimaryForest.copy(alpha = 0.6f))
                            Spacer(modifier = Modifier.width(8.dp))
                            Box(modifier = Modifier.width(1.dp).height(20.dp).background(OutlineVariant))
                        }
                    },
                    modifier = Modifier.fillMaxWidth().background(SurfaceContainer, FullRounded),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true,
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedIndicatorColor = GhostBorderPrimary,
                        unfocusedIndicatorColor = Color.Transparent
                    ),
                    shape = FullRounded,
                    enabled = !isLoading
                )

                Spacer(modifier = Modifier.height(24.dp))

                authError?.let { error ->
                    Text(
                        text = error,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.error,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }

                Button(
                    onClick = { viewModel.requestOtp(onOtpSent) },
                    modifier = Modifier.fillMaxWidth().height(56.dp).background(PrimaryGradient, FullRounded),
                    shape = FullRounded,
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    enabled = phoneNumber.length >= 10 && !isLoading
                ) {
                    Text("Send OTP", style = MaterialTheme.typography.titleLarge, color = Color.White)
                }

                Spacer(modifier = Modifier.weight(1.5f))
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.weight(1f).height(1.dp).background(SurfaceContainerLow))
                    Text("  OR  ", style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp), color = OnSurfaceVariant.copy(alpha = 0.4f))
                    Box(modifier = Modifier.weight(1f).height(1.dp).background(SurfaceContainerLow))
                }
                Spacer(modifier = Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    AltLoginButton(icon = Icons.Default.Mail)
                    AltLoginButton(icon = Icons.Default.Fingerprint)
                }
                
                Spacer(modifier = Modifier.weight(1f))
                Text(
                    "© 2026 BAGICHA DIGITAL CONSERVATORY",
                    style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp),
                    color = OnSurfaceVariant.copy(alpha = 0.3f)
                )
            }
        }
    }
}

@Composable
fun AltLoginButton(icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Box(
        modifier = Modifier
            .background(SurfaceContainerLow, CircleShape)
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, null, tint = PrimaryForest, modifier = Modifier.size(24.dp))
    }
}
