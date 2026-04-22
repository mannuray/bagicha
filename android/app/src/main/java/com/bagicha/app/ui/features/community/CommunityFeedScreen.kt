package com.bagicha.app.ui.features.community

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.filled.QuestionAnswer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.bagicha.app.ui.navigation.BottomNavigationBar
import com.bagicha.app.ui.navigation.Screen
import com.bagicha.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommunityFeedScreen(
    viewModel: CommunityViewModel,
    navController: NavController
) {
    val posts by viewModel.posts.collectAsState()
    var selectedTab by remember { mutableStateOf("LOCAL") }

    Scaffold(
        containerColor = SurfaceBase,
        bottomBar = { BottomNavigationBar(navController = navController) },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate(Screen.AiMentor.route) },
                containerColor = PrimaryForest,
                contentColor = Color.White,
                shape = FullRounded,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Icon(Icons.Default.Psychology, null, modifier = Modifier.size(32.dp))
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 24.dp)
        ) {
            // 0. Top Padding Spacer
            item { Spacer(modifier = Modifier.height(24.dp)) }

            // 1. Navigation Toggle
            item {
                FeedToggle(
                    selectedTab = selectedTab, 
                    onTabSelected = { 
                        if (it == "DIRECT") {
                            navController.navigate(Screen.ChatInbox.route)
                        } else {
                            selectedTab = it 
                        }
                    }
                )
            }

            // 2. Pest Radar
            item {
                PestRadarBanner(count = 5)
                Spacer(modifier = Modifier.height(32.dp))
            }

            // 3. Editorial Header
            item {
                Text(
                    text = "COMMUNITY WISDOM",
                    style = MaterialTheme.typography.labelMedium,
                    color = SecondaryTerracotta
                )
                Text(
                    text = "The Collective Canvas",
                    style = MaterialTheme.typography.headlineMedium,
                    color = PrimaryForest
                )
                Spacer(modifier = Modifier.height(32.dp))
            }

            // 4. Wisdom Cards
            items(posts) { post ->
                EditorialWisdomCard(post = post)
                Spacer(modifier = Modifier.height(24.dp))
            }
            
            item { Spacer(modifier = Modifier.height(100.dp)) }
        }
    }
}

@Composable
fun EditorialWisdomCard(post: ForumPost) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceContainerLow),
        shape = Shapes.large
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            // Header
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .background(SurfaceContainer, PebbleShape6)
                        .clip(PebbleShape6)
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = post.author, style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp), color = OnSurfaceNeutral)
                    ExpertBadge(badge = post.badge)
                }
                Icon(Icons.Default.MoreHoriz, null, tint = OnSurfaceMuted.copy(alpha = 0.4f))
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Content
            Text(
                text = "\"${post.content}\"",
                style = MaterialTheme.typography.bodyLarge.copy(fontSize = 18.sp, lineHeight = 28.sp),
                color = OnSurfaceNeutral.copy(alpha = 0.8f)
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Verified Label
            if (post.badge.contains("Expert")) {
                VerifiedAdviceLabel()
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Footer Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.ThumbUpOffAlt, null, tint = PrimaryForest.copy(alpha = 0.6f), modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = post.upvotes.toString(), style = MaterialTheme.typography.labelMedium)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.ChatBubbleOutline, null, tint = PrimaryForest.copy(alpha = 0.6f), modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = post.commentCount.toString(), style = MaterialTheme.typography.labelMedium)
                    }
                }
                Icon(Icons.Default.BookmarkBorder, null, tint = PrimaryForest.copy(alpha = 0.6f))
            }
        }
    }
}

@Composable
fun ExpertBadge(badge: String) {
    val color = if (badge.contains("Expert")) SecondaryTerracotta else PrimaryForestContainer
    Box(
        modifier = Modifier
            .background(color.copy(alpha = 0.1f), FullRounded)
            .padding(horizontal = 8.dp, vertical = 2.dp)
    ) {
        Text(
            text = badge.uppercase(),
            color = color,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp
        )
    }
}
