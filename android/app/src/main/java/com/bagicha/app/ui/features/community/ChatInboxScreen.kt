package com.bagicha.app.ui.features.community

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import com.bagicha.app.ui.navigation.Screen
import com.bagicha.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatInboxScreen(
    viewModel: ChatViewModel,
    navController: NavController
) {
    val conversations by viewModel.conversations.collectAsState()
    val unread = conversations.filter { it.isUnread }
    val earlier = conversations.filter { !it.isUnread }

    Box(modifier = Modifier.fillMaxSize().background(SurfaceBase)) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                // Glassmorphic Header
                Box(modifier = Modifier.fillMaxWidth().height(100.dp)) {
                    Box(modifier = Modifier.fillMaxSize().blur(30.dp).background(SurfaceBase.copy(alpha = 0.7f)))
                    TopAppBar(
                        title = { 
                            Text(
                                "Correspondence", 
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontFamily = androidx.compose.ui.text.font.FontFamily.Serif,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 24.sp
                                )
                            ) 
                        },
                        navigationIcon = {
                            IconButton(onClick = { navController.popBackStack() }) {
                                Icon(Icons.Default.Menu, null, tint = PrimaryForest)
                            }
                        },
                        actions = {
                            Box(modifier = Modifier.size(40.dp).clip(PebbleShape3).background(SurfaceContainer))
                        },
                        colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
                    )
                }
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { /* New Chat */ },
                    containerColor = PrimaryForest,
                    contentColor = Color.White,
                    shape = RoundedCornerShape(24.dp),
                    modifier = Modifier.padding(bottom = 16.dp).size(64.dp)
                ) {
                    Icon(Icons.Default.Edit, null, modifier = Modifier.size(32.dp))
                }
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(horizontal = 24.dp, vertical = 24.dp)
            ) {
                // 1. Unread Section
                if (unread.isNotEmpty()) {
                    item {
                        Text(
                            text = "Unread Whispers",
                            style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp),
                            color = PrimaryForest,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                    }
                    items(unread) { conv ->
                        SanctuaryInboxItem(conv = conv) {
                            navController.navigate(Screen.ChatDetail.route)
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }

                // 2. Earlier Section
                if (earlier.isNotEmpty()) {
                    item {
                        Spacer(modifier = Modifier.height(32.dp))
                        Text(
                            text = "Earlier",
                            style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp),
                            color = OnSurfaceVariant,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                    }
                    items(earlier) { conv ->
                        SanctuaryInboxItem(conv = conv) {
                            navController.navigate(Screen.ChatDetail.route)
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }
                
                item { Spacer(modifier = Modifier.height(100.dp)) }
            }
        }
    }
}

@Composable
fun SanctuaryInboxItem(conv: Conversation, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = SurfaceContainerLow),
        shape = Shapes.large
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            // Pebble Avatar
            Box(modifier = Modifier.size(56.dp).clip(PebbleShape6).background(SurfaceContainer)) {
                // Placeholder Image
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = conv.otherUser, style = MaterialTheme.typography.titleLarge.copy(fontSize = 17.sp), color = OnSurfaceNeutral)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(text = conv.time.uppercase(), style = MaterialTheme.typography.labelMedium, color = OnSurfaceVariant.copy(alpha = 0.6f), fontSize = 9.sp)
                        if (conv.isUnread) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Box(modifier = Modifier.size(8.dp).background(PrimaryForest, CircleShape))
                        }
                    }
                }
                
                if (conv.badge != null) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Box(modifier = Modifier.background(SecondaryTerracottaContainer.copy(alpha = 0.15f), FullRounded).padding(horizontal = 8.dp, vertical = 2.dp)) {
                        Text(conv.badge.uppercase(), color = SecondaryTerracotta, fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = conv.lastMessage,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (conv.isUnread) OnSurfaceNeutral else OnSurfaceMuted,
                    maxLines = 1,
                    fontWeight = if (conv.isUnread) FontWeight.SemiBold else FontWeight.Normal
                )
            }
        }
    }
}
