package com.bagicha.app.ui.features.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.East
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.bagicha.app.R
import com.bagicha.app.ui.theme.*

data class Language(val code: String, val name: String, val nativeName: String)

val languages = listOf(
    Language("en", "English", "English"),
    Language("hi", "Hindi", "हिन्दी"),
    Language("bn", "Bengali", "বাংলা"),
    Language("te", "Telugu", "తెలుగు"),
    Language("mr", "Marathi", "मরাठी"),
    Language("ta", "Tamil", "தமிழ்")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LanguageSelectionScreen(
    viewModel: OnboardingViewModel,
    onNext: () -> Unit
) {
    val selectedLanguage by viewModel.selectedLanguage.collectAsState()
    val scrollState = rememberScrollState()

    Box(modifier = Modifier.fillMaxSize().background(SurfaceBase)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
        ) {
            // 1. Hero Section (Identical to Login & OTP)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(320.dp)
            ) {
                AsyncImage(
                    model = R.drawable.login_hero,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
                Box(modifier = Modifier.fillMaxSize().background(PrimaryForest.copy(alpha = 0.2f)))
                
                // Branding
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

            // 2. Content Canvas (Overlapping Card)
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .offset(y = (-48).dp),
                shape = RoundedCornerShape(topStart = 48.dp, topEnd = 48.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceBase),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 24.dp, vertical = 40.dp)
                ) {
                    Text(text = "Select Your Voice", style = MaterialTheme.typography.headlineLarge.copy(fontSize = 32.sp), color = PrimaryForest)
                    Text(text = "Our AI mentor speaks your language.", style = MaterialTheme.typography.bodyLarge, color = OnSurfaceVariant)
                    
                    Spacer(modifier = Modifier.height(32.dp))

                    // 3. Scrollable Pebble Grid
                    Box(modifier = Modifier.weight(1f)) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .verticalScroll(scrollState),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            val rows = languages.chunked(2)
                            rows.forEachIndexed { rowIndex, rowLanguages ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    rowLanguages.forEachIndexed { colIndex, lang ->
                                        val index = rowIndex * 2 + colIndex
                                        LanguagePebble(
                                            language = lang,
                                            shape = PebbleShapes[index % PebbleShapes.size],
                                            isSelected = selectedLanguage == lang.code,
                                            onClick = { viewModel.selectLanguage(lang.code) },
                                            modifier = Modifier.weight(1f)
                                        )
                                    }
                                    if (rowLanguages.size == 1) Spacer(modifier = Modifier.weight(1f))
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // 4. Fixed Bottom Action Button
                    Button(
                        onClick = onNext,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(64.dp)
                            .background(PrimaryGradient, FullRounded),
                        shape = FullRounded,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Continue", style = MaterialTheme.typography.titleLarge, color = Color.White)
                            Spacer(modifier = Modifier.width(12.dp))
                            Icon(Icons.Default.East, null, tint = Color.White)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun LanguagePebble(
    language: Language,
    shape: androidx.compose.ui.graphics.Shape,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val background = if (isSelected) PrimaryGradient else Brush.linearGradient(listOf(SurfaceContainerLow, SurfaceContainerLow))
    val textColor = if (isSelected) Color.White else PrimaryForest

    Card(
        modifier = modifier
            .aspectRatio(1.2f)
            .clip(shape)
            .clickable { onClick() },
        shape = shape,
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(
            modifier = Modifier.fillMaxSize().background(background),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = language.nativeName, style = MaterialTheme.typography.titleLarge, color = textColor, fontSize = 20.sp)
                Text(text = language.name.uppercase(), style = MaterialTheme.typography.labelMedium, color = if (isSelected) Color.White.copy(alpha = 0.7f) else OnSurfaceVariant, fontSize = 10.sp)
            }
            if (isSelected) {
                Box(
                    modifier = Modifier.align(Alignment.TopEnd).padding(12.dp).size(20.dp).background(Color.White.copy(alpha = 0.2f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.size(12.dp))
                }
            }
        }
    }
}
