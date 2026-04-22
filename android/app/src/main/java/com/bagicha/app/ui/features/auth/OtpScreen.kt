package com.bagicha.app.ui.features.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import coil.compose.AsyncImage
import com.bagicha.app.ui.features.onboarding.OnboardingViewModel
import com.bagicha.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun OtpScreen(
    viewModel: OnboardingViewModel,
    onVerified: () -> Unit
) {
    val otp by viewModel.otp.collectAsState()
    val phoneNumber by viewModel.phoneNumber.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val authError by viewModel.authError.collectAsState()
    val focusRequester = remember { FocusRequester() }
    val focusManager = androidx.compose.ui.platform.LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current

    fun focusOtpInput() {
        focusRequester.requestFocus()
        keyboardController?.show()
    }

    LaunchedEffect(Unit) {
        focusOtpInput()
    }

    LaunchedEffect(otp) {
        if (otp.length == 6) {
            focusManager.clearFocus()
            viewModel.verifyOtp(onVerified)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceBase),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        BasicTextField(
            value = otp,
            onValueChange = { if (it.length <= 6) viewModel.setOtp(it) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            modifier = Modifier.focusRequester(focusRequester).size(1.dp).alpha(0f)
        )

        // 1. Fixed Hero Section (33%)
        Box(
            modifier = Modifier.fillMaxWidth().fillMaxHeight(0.33f)
        ) {
            AsyncImage(
                model = "https://lh3.googleusercontent.com/aida-public/AB6AXuAVUERQVZuYthi7ib4xy4TKnDxUkJZ-qUOWESmtKzUyUnOZYs5BWOP4ASHtq4VAO5pEdbK2El3YwdpsOotzaTUhS_CHBlWmsCd0685pvJ1sPZDaj16YTppBPE6gyr9V_R1Er_Qg_eMKge-ZJh-SdJtjrN2vxorESu5B7IhQ1XdKbPv1RXudwnLKmWSPSgHRePSRT5yYmzGfFE_31g0i-gF7CzyuRXjSqfAj1ldE-IIVZ6KYTFBDkehnyGqILjbz92lTdKQ74y_-iFI",
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
                horizontalAlignment = Alignment.Start
            ) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(text = "Enter the Code", style = MaterialTheme.typography.headlineLarge, color = PrimaryForest)
                Text(text = "Sent to +91 $phoneNumber", style = MaterialTheme.typography.bodyLarge, color = OnSurfaceVariant)
                
                Spacer(modifier = Modifier.weight(1f))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    repeat(6) { index ->
                        val char = otp.getOrNull(index)?.toString() ?: ""
                        OtpBox(
                            text = char,
                            isActive = (otp.length == index) && !isLoading,
                            modifier = Modifier
                                .weight(1f)
                                .padding(horizontal = 4.dp)
                                .clickable { focusOtpInput() }
                        )
                    }
                }

                Spacer(modifier = Modifier.weight(1f))

                authError?.let { error ->
                    Text(
                        text = error,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                }

                if (isLoading) {
                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = PrimaryForest)
                    }
                } else {
                    Button(
                        onClick = { viewModel.verifyOtp(onVerified) },
                        modifier = Modifier.fillMaxWidth().height(56.dp).background(PrimaryGradient, FullRounded),
                        shape = FullRounded,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        enabled = otp.length == 6
                    ) {
                        Text("Verify & Continue", style = MaterialTheme.typography.titleLarge, color = Color.White)
                    }
                }

                Spacer(modifier = Modifier.weight(1f))
                TextButton(onClick = { /* Resend */ }, modifier = Modifier.fillMaxWidth()) {
                    Text("Resend in 00:55", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold), color = SecondaryTerracotta)
                }
            }
        }
    }
}

@Composable
fun OtpBox(text: String, isActive: Boolean, modifier: Modifier = Modifier) {
    val backgroundColor = if (isActive) SurfaceContainer else SurfaceContainerLow

    Box(
        modifier = modifier
            .aspectRatio(0.8f)
            .clip(PebbleShape6)
            .background(backgroundColor),
        contentAlignment = Alignment.Center
    ) {
        if (isActive && text.isEmpty()) {
            Box(
                modifier = Modifier
                    .width(2.dp)
                    .height(28.dp)
                    .background(PrimaryForest.copy(alpha = 0.4f))
            )
        } else {
            Text(
                text = text,
                style = MaterialTheme.typography.headlineMedium,
                color = PrimaryForest,
                textAlign = TextAlign.Center
            )
        }
    }
}
