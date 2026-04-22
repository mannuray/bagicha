package com.bagicha.app.ui.features.community
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.bagicha.app.R
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
                                        model = R.drawable.expert_dr_sharma,
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
                                    Text(
                                        "Dr. Silas Thorne",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Bold
                                    )
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
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                        .navigationBarsPadding()
                        .height(64.dp)
                        .clip(FullRounded)
                        .background(SurfaceBase.copy(alpha = 0.8f))
                        .blur(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxSize().padding(horizontal = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = { }) {
                            Icon(Icons.Default.AddCircle, null, tint = PrimaryForest)
                        }
                        OutlinedTextField(
                            value = messageText,
                            onValueChange = { messageText = it },
                            placeholder = { Text("Ask for expert advice...", fontSize = 14.sp) },
                            modifier = Modifier.weight(1f).padding(vertical = 4.dp),
                            shape = FullRounded,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color.Transparent,
                                unfocusedBorderColor = Color.Transparent
                            )
                        )
                        IconButton(
                            onClick = { 
                                if (messageText.isNotBlank()) {
                                    viewModel.sendMessage(messageText)
                                    messageText = ""
                                }
                            },
                            modifier = Modifier.background(PrimaryForest, CircleShape).size(40.dp)
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
                contentPadding = PaddingValues(top = 16.dp, bottom = 100.dp, start = 24.dp, end = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    SystemMessage(text = "Security: Messages are end-to-end encrypted within the Bagicha Sanctuary.")
                }

                items(messages) { message ->
                    ChatMessageBubble(message = message)
                }
            }
        }
    }
}

@Composable
fun SystemMessage(text: String) {
    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = OnSurfaceMuted.copy(alpha = 0.4f),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            modifier = Modifier.padding(horizontal = 32.dp)
        )
    }
}

@Composable
fun ChatMessageBubble(message: ChatMessage) {
    val isMe = message.isFromMe
    
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isMe) Alignment.End else Alignment.Start
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .background(
                    if (isMe) PrimaryForest else SurfaceContainerLow,
                    RoundedCornerShape(
                        topStart = 20.dp,
                        topEnd = 20.dp,
                        bottomStart = if (isMe) 20.dp else 4.dp,
                        bottomEnd = if (isMe) 4.dp else 20.dp
                    )
                )
                .padding(16.dp)
        ) {
            Text(
                text = message.content,
                color = if (isMe) Color.White else PrimaryForest,
                style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp)
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = message.timestamp,
            style = MaterialTheme.typography.labelMedium,
            color = OnSurfaceMuted.copy(alpha = 0.4f),
            fontSize = 10.sp,
            modifier = Modifier.padding(horizontal = 8.dp)
        )
    }
}
