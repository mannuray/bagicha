package com.bagicha.app.ui.features.vision

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import com.bagicha.app.R
import com.bagicha.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IdentifyResultScreen(navController: NavController) {
    Scaffold(
        containerColor = SurfaceBase,
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    Box(
                        modifier = Modifier
                            .padding(8.dp)
                            .size(40.dp)
                            .background(SurfaceBase.copy(alpha = 0.8f), CircleShape)
                            .clip(CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.Default.ArrowBack, null, tint = PrimaryForest)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // 1. Hero Overlay Section
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(450.dp)
            ) {
                AsyncImage(
                    model = R.drawable.leaf_detail,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color.Transparent, Color.Black.copy(alpha = 0.7f))
                            )
                        )
                )
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(24.dp)
                ) {
                    Text(
                        text = "PLANT IDENTIFIED",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                        color = SecondaryTerracotta
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "MANGO (LANGRA)",
                        style = MaterialTheme.typography.headlineLarge.copy(fontSize = 42.sp, fontWeight = FontWeight.Black),
                        color = Color.White
                    )
                    Text(
                        text = "Mangifera indica",
                        style = MaterialTheme.typography.bodyLarge.copy(fontStyle = FontStyle.Italic),
                        color = Color.White.copy(alpha = 0.7f)
                    )
                }
            }

            // 2. Content
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
            ) {
                Text(
                    text = "CARE SUMMARY",
                    style = MaterialTheme.typography.labelMedium,
                    color = OnSurfaceMuted
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Requires full sun and well-draining soil. Deep water once a week during fruiting season. Thrives in sub-tropical climates with distinct seasons.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = PrimaryForest.copy(alpha = 0.8f),
                    lineHeight = 24.sp
                )
                
                Spacer(modifier = Modifier.weight(1f))
                
                Button(
                    onClick = { navController.popBackStack() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(64.dp)
                        .background(PrimaryGradient, FullRounded),
                    shape = FullRounded,
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                ) {
                    Text("ADD TO MY SANCTUARY", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = 2.sp), color = Color.White)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiagnoseResultScreen(navController: NavController) {
    Scaffold(
        containerColor = SurfaceBase,
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    Box(
                        modifier = Modifier
                            .padding(8.dp)
                            .size(40.dp)
                            .background(SurfaceBase.copy(alpha = 0.8f), CircleShape)
                            .clip(CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.Default.ArrowBack, null, tint = PrimaryForest)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier.fillMaxSize()
        ) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(300.dp)
                ) {
                    AsyncImage(
                        model = R.drawable.leaf_detail,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                    Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, SurfaceBase))))
                }
            }

            item {
                Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                    Text(
                        text = "DIAGNOSIS RESULT",
                        style = MaterialTheme.typography.labelMedium,
                        color = SecondaryTerracotta
                    )
                    Text(
                        text = "Detection Log",
                        style = MaterialTheme.typography.headlineLarge,
                        color = PrimaryForest
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // Alert Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = SecondaryTerracottaContainer.copy(alpha = 0.2f)),
                        shape = Shapes.large
                    ) {
                        Row(modifier = Modifier.padding(24.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .background(SecondaryTerracotta.copy(alpha = 0.1f), PebbleShape1),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Warning, null, tint = SecondaryTerracotta)
                            }
                            Spacer(modifier = Modifier.width(20.dp))
                            Column {
                                Text("MEALYBUGS DETECTED", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
                                Text("CONFIDENCE: 94%", style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold), color = PrimaryForest)
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    Text(
                        text = "ZERO-GUESSWORK ACTION PLAN",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                        color = OnSurfaceMuted
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    ActionItemEditorial(title = "IMMEDIATE", description = "Spray with Neem Oil solution tonight when temperatures drop.")
                    Spacer(modifier = Modifier.height(12.dp))
                    ActionItemEditorial(title = "LONG-TERM", description = "Prune affected branches to improve airflow and apply organic fertilizers.")
                    
                    Spacer(modifier = Modifier.height(48.dp))
                    
                    Button(
                        onClick = { navController.popBackStack() },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(64.dp)
                            .background(PrimaryGradient, FullRounded),
                        shape = FullRounded,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                    ) {
                        Text("LOG TO TREE LEDGER", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = 2.sp), color = Color.White)
                    }
                    Spacer(modifier = Modifier.height(100.dp))
                }
            }
        }
    }
}

@Composable
fun ActionItemEditorial(title: String, description: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceContainerLow, Shapes.large)
            .padding(20.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.CheckCircle, null, tint = PrimaryForest, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(text = title, style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
                Text(text = description, style = MaterialTheme.typography.bodyMedium, color = PrimaryForest)
            }
        }
    }
}
