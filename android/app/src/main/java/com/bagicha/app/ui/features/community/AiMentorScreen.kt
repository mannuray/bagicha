package com.bagicha.app.ui.features.community
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.AddCircle

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.bagicha.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AiMentorScreen(
    viewModel: CommunityViewModel,
    navController: NavController
) {
    val messages by viewModel.aiMessages.collectAsState()
    var questionText by remember { mutableStateOf("") }

    Box(modifier = Modifier.fillMaxSize().background(SurfaceBase)) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                // Glassmorphic AI Header
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(110.dp)
                        .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
                ) {
                    Box(modifier = Modifier.fillMaxSize().blur(30.dp).background(SurfaceBase.copy(alpha = 0.6f)))
                    TopAppBar(
                        title = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .background(PrimaryGradient, PebbleShape6)
                                        .padding(8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.AutoAwesome, null, tint = Color.White)
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text("Bagicha AI", style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp, fontFamily = androidx.compose.ui.text.font.FontFamily.Serif))
                                    Text("MENTOR • ONLINE", style = MaterialTheme.typography.labelMedium, color = PrimaryForestContainer, fontSize = 9.sp)
                                }
                            }
                        },
                        navigationIcon = {
                            IconButton(onClick = { navController.popBackStack() }) {
                                Icon(Icons.Default.ArrowBack, null, tint = PrimaryForest)
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
                    )
                }
            },
            bottomBar = {
                // Glassmorphic Input Bar
                Box(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 24.dp).height(72.dp)) {
                    Box(modifier = Modifier.fillMaxSize().blur(30.dp).background(Color.White.copy(alpha = 0.7f), RoundedCornerShape(40.dp)))
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = { }) {
                            Icon(Icons.Default.AddCircle, null, tint = PrimaryForest.copy(alpha = 0.5f))
                        }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .background(SurfaceContainer, FullRounded)
                                .padding(horizontal = 16.dp),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            Text("Ask your mentor...", color = OnSurfaceNeutral.copy(alpha = 0.4f), fontSize = 14.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(PrimaryForest, PebbleShape1)
                                .clip(PebbleShape1)
                                .clickable {
                                    // Mock ask logic
                                    questionText = "Simulated query"
                                    viewModel.askAi(questionText)
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Send, null, tint = Color.White, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(horizontal = 24.dp, vertical = 24.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                item {
                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Text(
                            text = "AI SANCTUARY KNOWLEDGE",
                            style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                            color = OnSurfaceMuted.copy(alpha = 0.4f),
                            fontSize = 9.sp,
                            modifier = Modifier.background(SurfaceContainer, FullRounded).padding(horizontal = 16.dp, vertical = 4.dp)
                        )
                    }
                }

                items(messages) { msg ->
                    AiSanctuaryBubble(message = msg)
                }
                
                item { Spacer(modifier = Modifier.height(100.dp)) }
            }
        }
    }
}

@Composable
fun AiSanctuaryBubble(message: AiMessage) {
    val alignment = if (message.isFromUser) Alignment.CenterEnd else Alignment.CenterStart
    val shape = if (message.isFromUser) BubbleUserShape else BubbleExpertShape
    val background = if (message.isFromUser) PrimaryGradient else Brush.linearGradient(listOf(SurfaceContainerLow, SurfaceContainerLow))
    val textColor = if (message.isFromUser) Color.White else PrimaryForest

    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = alignment) {
        Column(horizontalAlignment = if (message.isFromUser) Alignment.End else Alignment.Start) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.85f)
                    .clip(shape)
                    .background(background)
                    .padding(20.dp)
            ) {
                Column {
                    Text(text = message.content, color = textColor, style = MaterialTheme.typography.bodyLarge, lineHeight = 24.sp)
                    if (message.citations.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(16.dp))
                        Divider(color = textColor.copy(alpha = 0.1f))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("COMMUNITY CITATIONS", style = MaterialTheme.typography.labelMedium, color = textColor.copy(alpha = 0.6f), fontSize = 8.sp)
                        message.citations.forEach { citation ->
                            Text("• $citation", style = MaterialTheme.typography.bodySmall, color = textColor.copy(alpha = 0.8f))
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(text = "Just now", style = MaterialTheme.typography.labelMedium, color = OnSurfaceMuted.copy(alpha = 0.4f), fontSize = 10.sp, modifier = Modifier.padding(horizontal = 8.dp))
        }
    }
}

