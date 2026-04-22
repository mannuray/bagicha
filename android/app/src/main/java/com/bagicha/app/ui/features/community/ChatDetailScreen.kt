package com.bagicha.app.ui.features.community
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Videocam

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
fun ChatDetailScreen(
    viewModel: ChatViewModel,
    navController: NavController
) {
    val messages by viewModel.messages.collectAsState()
    var messageText by remember { mutableStateOf("") }

    Box(modifier = Modifier.fillMaxSize().background(SurfaceBase)) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                // Fixed Header with Rounded Bottom (30px blur)
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
                                Box(modifier = Modifier.size(48.dp)) {
                                    AsyncImage(
                                        model = "https://lh3.googleusercontent.com/aida-public/AB6AXuADqbvVLOU6ODPojsgwTN3R9LkSycP6-zzmerP1yS5h7G6SzuGgaFY1gFnmSooFdqsHAcptwN42MOym_rbOIhYcbFY4FdE4fuVrb_NP8GYrBhUQpnBLW5ynC4dFf5J0O8dqIbbw8jbjFfzGn38Wp5TT3SHNc3590EFGn5eicMJ_VStt6BROakHIgjNu7b4qx1bn4fjA7znDcOXllFJTdtEktluymIwqsISnAil_f537esK4uCANOLFwUAfVl5Q9Q_XlUGVCFe-NsGc",
                                        contentDescription = null,
                                        modifier = Modifier.fillMaxSize().clip(PebbleShape6),
                                        contentScale = ContentScale.Crop
                                    )
                                    Box(
                                        modifier = Modifier
                                            .align(Alignment.BottomEnd)
                                            .offset(x = 4.dp, y = 4.dp)
                                            .background(SecondaryTerracotta, CircleShape)
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text("Verified", color = Color.White, fontSize = 7.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text("Dr. Silas Thorne", style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp, fontFamily = androidx.compose.ui.text.font.FontFamily.Serif))
                                    Text("GARDENING EXPERT", style = MaterialTheme.typography.labelMedium, color = OnSurfaceVariant.copy(alpha = 0.6f), fontSize = 9.sp)
                                }
                            }
                        },
                        navigationIcon = {
                            IconButton(onClick = { navController.popBackStack() }) {
                                Icon(Icons.Default.ArrowBack, null, tint = PrimaryForest)
                            }
                        },
                        actions = {
                            IconButton(onClick = { }) {
                                Icon(Icons.Default.Videocam, null, tint = PrimaryForest)
                            }
                            IconButton(onClick = { }) {
                                Icon(Icons.Default.MoreVert, null, tint = PrimaryForest)
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
                    )
                }
            },
            bottomBar = {
                // Floating Input Bar (30px blur)
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
                        IconButton(onClick = { }) {
                            Icon(Icons.Default.PhotoCamera, null, tint = PrimaryForest.copy(alpha = 0.5f))
                        }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .background(SurfaceContainer, FullRounded)
                                .padding(horizontal = 16.dp),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            Text("Share an insight...", color = OnSurfaceNeutral.copy(alpha = 0.4f), fontSize = 14.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(PrimaryForest, PebbleShape1)
                                .clip(PebbleShape1)
                                .clickable { },
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
                            text = "TODAY'S CONSULTATION",
                            style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                            color = OnSurfaceMuted.copy(alpha = 0.4f),
                            fontSize = 9.sp,
                            modifier = Modifier.background(SurfaceContainer, FullRounded).padding(horizontal = 16.dp, vertical = 4.dp)
                        )
                    }
                }

                // Expert Bubble
                item {
                    SanctuaryBubble(
                        content = "Greetings. I've finished reviewing the latest snapshots of your orchard. How is the soil moisture levels today?",
                        time = "09:12 AM",
                        isMe = false
                    )
                }

                // User Bubble
                item {
                    SanctuaryBubble(
                        content = "The moisture feels consistent, but I'm worried about the primary mango tree. I've attached the latest entry.",
                        time = "09:15 AM",
                        isMe = true
                    )
                }

                // Shared Journal Clip
                item {
                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                        SharedJournalClip()
                    }
                }

                // Expert Response
                item {
                    SanctuaryBubble(
                        content = "The leaf luster is magnificent. That 'Excellent Health' status is well-earned. Increase the mulch layer slightly.",
                        time = "09:18 AM",
                        isMe = false
                    )
                }
                
                item { Spacer(modifier = Modifier.height(100.dp)) }
            }
        }
    }
}

@Composable
fun SanctuaryBubble(content: String, time: String, isMe: Boolean) {
    val alignment = if (isMe) Alignment.CenterEnd else Alignment.CenterStart
    val shape = if (isMe) BubbleUserShape else BubbleExpertShape
    val background = if (isMe) PrimaryForest else SurfaceContainerLow
    val textColor = if (isMe) Color.White else PrimaryForest

    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = alignment) {
        Column(horizontalAlignment = if (isMe) Alignment.End else Alignment.Start) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.85f)
                    .clip(shape)
                    .background(background)
                    .padding(20.dp)
            ) {
                Text(text = content, color = textColor, style = MaterialTheme.typography.bodyLarge, lineHeight = 24.sp)
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(text = time, style = MaterialTheme.typography.labelMedium, color = OnSurfaceMuted.copy(alpha = 0.5f), fontSize = 10.sp, modifier = Modifier.padding(horizontal = 8.dp))
        }
    }
}

@Composable
fun SharedJournalClip() {
    Card(
        modifier = Modifier.fillMaxWidth(0.85f),
        colors = CardDefaults.cardColors(containerColor = SurfaceContainerLowest),
        shape = Shapes.large,
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(64.dp).clip(PebbleShape6).background(SurfaceContainer)) {
                    AsyncImage(
                        model = "https://lh3.googleusercontent.com/aida-public/AB6AXuCTHqehLRFPcKWUhJPTCbFOiOgzWueP2GzSt7T2yZ20kPAvQGqWeez0vD8n4pM3ZEnGRGPNW85qBeDpJBs6TlsGf1YxZlf7C96hj8QFfepTjJVAWzwD29hTG7OhzvP-nQYTyTh4ZvY3WSgkTooV18uaSgSgANLr4QVd2fbxoxW7EO_-MeVbU-JUHjmzyjGR7LeVmDm0Cb7VVIaJgZD0yfIUNDR7j2t8VG46wq-qZKOZD_qjb2AqR36EZZ2mDxysOSpgVMEmPCH0GH0",
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text("Family Mango", style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp, fontFamily = androidx.compose.ui.text.font.FontFamily.Serif))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(8.dp).background(SecondaryTerracotta, CircleShape))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("EXCELLENT HEALTH", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth().background(SurfaceContainer, RoundedCornerShape(8.dp)).padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("LAST UPDATE", style = MaterialTheme.typography.labelMedium.copy(fontSize = 8.sp), color = OnSurfaceMuted.copy(alpha = 0.6f))
                    Text("2 hours ago", style = MaterialTheme.typography.labelMedium, color = PrimaryForest)
                }
                Icon(Icons.Default.OpenInNew, null, tint = SecondaryTerracotta, modifier = Modifier.size(20.dp))
            }
        }
    }
}

