package com.bagicha.app.ui.features.vision

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import com.bagicha.app.ui.theme.FullRounded
import com.bagicha.app.ui.theme.OnSurfaceMuted
import com.bagicha.app.ui.theme.PrimaryForest
import com.bagicha.app.ui.theme.PrimaryGradient
import com.bagicha.app.ui.theme.SecondaryTerracotta
import com.bagicha.app.ui.theme.SecondaryTerracottaContainer
import com.bagicha.app.ui.theme.Shapes
import com.bagicha.app.ui.theme.SurfaceBase
import com.bagicha.app.ui.theme.SurfaceContainerLow

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IdentifyResultScreen(
    viewModel: VisionViewModel,
    navController: NavController
) {
    val result by viewModel.identifyResult.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val imageDataUri by viewModel.latestImageDataUri.collectAsState()

    Scaffold(
        containerColor = SurfaceBase,
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    Box(
                        modifier = Modifier
                            .padding(8.dp)
                            .clip(CircleShape)
                            .background(SurfaceBase.copy(alpha = 0.8f))
                    ) {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.Default.ArrowBack, null, tint = PrimaryForest)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        }
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(420.dp)
            ) {
                AsyncImage(
                    model = imageDataUri ?: R.drawable.leaf_detail,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = 0.7f))))
                )
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(24.dp)
                ) {
                    Text("PLANT IDENTIFIED", style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp), color = SecondaryTerracotta)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(result?.commonName ?: "Working on identification", style = MaterialTheme.typography.headlineLarge.copy(fontSize = 40.sp, fontWeight = FontWeight.Black), color = Color.White)
                    result?.scientificName?.let {
                        Text(it, style = MaterialTheme.typography.bodyLarge.copy(fontStyle = FontStyle.Italic), color = Color.White.copy(alpha = 0.7f))
                    }
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                when {
                    isLoading -> CircularProgressIndicator(color = PrimaryForest)
                    error != null -> Text(error!!, color = MaterialTheme.colorScheme.error)
                    result != null -> {
                        Text("CARE SUMMARY", style = MaterialTheme.typography.labelMedium, color = OnSurfaceMuted)
                        Text(result!!.description, style = MaterialTheme.typography.bodyLarge, color = PrimaryForest.copy(alpha = 0.85f))
                        Text(result!!.careSummary, style = MaterialTheme.typography.bodyMedium, color = PrimaryForest.copy(alpha = 0.75f))
                    }
                }

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
                    Text("BACK TO SCAN", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = 2.sp), color = Color.White)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiagnoseResultScreen(
    viewModel: VisionViewModel,
    navController: NavController,
    onOpenTree: () -> Unit
) {
    val result by viewModel.diagnoseResult.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val imageDataUri by viewModel.latestImageDataUri.collectAsState()

    Scaffold(
        containerColor = SurfaceBase,
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    Box(
                        modifier = Modifier
                            .padding(8.dp)
                            .clip(CircleShape)
                            .background(SurfaceBase.copy(alpha = 0.8f))
                    ) {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.Default.ArrowBack, null, tint = PrimaryForest)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        }
    ) {
        LazyColumn(modifier = Modifier.fillMaxSize()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(300.dp)
                ) {
                    AsyncImage(
                        model = imageDataUri ?: R.drawable.leaf_detail,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                    Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, SurfaceBase))))
                }
            }

            item {
                Column(
                    modifier = Modifier.padding(horizontal = 24.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp)
                ) {
                    Text("DIAGNOSIS RESULT", style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
                    Text("Detection Log", style = MaterialTheme.typography.headlineLarge, color = PrimaryForest)

                    when {
                        isLoading -> CircularProgressIndicator(color = PrimaryForest)
                        error != null -> Text(error!!, color = MaterialTheme.colorScheme.error)
                        result != null -> {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = SecondaryTerracottaContainer.copy(alpha = 0.2f)),
                                shape = Shapes.large
                            ) {
                                Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    RowAlert(result!!)
                                    Text(
                                        result!!.reasoningSummary,
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = PrimaryForest
                                    )
                                    result!!.affectedPart?.takeIf { it.isNotBlank() }?.let {
                                        Text("Affected part: $it", style = MaterialTheme.typography.bodyMedium, color = PrimaryForest.copy(alpha = 0.75f))
                                    }
                                }
                            }

                            if (result!!.symptoms.isNotEmpty()) {
                                InfoBlock(
                                    title = "OBSERVED SYMPTOMS",
                                    description = result!!.symptoms.joinToString(", ")
                                )
                            }

                            if (result!!.recommendedActions.isNotEmpty()) {
                                Text(
                                    text = "ZERO-GUESSWORK ACTION PLAN",
                                    style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                                    color = OnSurfaceMuted
                                )
                                result!!.recommendedActions.forEachIndexed { index, action ->
                                    ActionItemEditorial(
                                        title = if (index == 0) "IMMEDIATE" else "FOLLOW-UP",
                                        description = action
                                    )
                                }
                            }

                            InfoBlock(
                                title = "PERSISTENCE",
                                description = if (result!!.persisted) {
                                    "This diagnosis was saved into the season journal, linked to a diagnosis session, and follow-up tasks were created when needed."
                                } else {
                                    "This diagnosis was analyzed, but it was not attached to a tree journal."
                                }
                            )

                            if (result!!.needsFollowUp && result!!.followUpDays != null) {
                                InfoBlock(
                                    title = "FOLLOW-UP WINDOW",
                                    description = "Recheck in ${result!!.followUpDays} day(s)."
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Button(
                        onClick = {
                            if (result?.persisted == true) onOpenTree() else navController.popBackStack()
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(64.dp)
                            .background(PrimaryGradient, FullRounded),
                        shape = FullRounded,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                    ) {
                        Text(
                            if (result?.persisted == true) "OPEN TREE JOURNAL" else "BACK TO SCAN",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = 2.sp),
                            color = Color.White
                        )
                    }
                    Spacer(modifier = Modifier.height(100.dp))
                }
            }
        }
    }
}

@Composable
private fun RowAlert(result: DiagnoseResultUi) {
    androidx.compose.foundation.layout.Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .background(SecondaryTerracotta.copy(alpha = 0.1f), Shapes.large)
                .padding(12.dp),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Warning, null, tint = SecondaryTerracotta)
        }
        Spacer(modifier = Modifier.padding(10.dp))
        Column {
            Text(
                result.primaryIssue.replace('_', ' '),
                style = MaterialTheme.typography.labelMedium,
                color = SecondaryTerracotta
            )
            Text(
                "CONFIDENCE: ${result.confidence} • SEVERITY: ${result.severity}",
                style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold),
                color = PrimaryForest
            )
        }
    }
}

@Composable
private fun InfoBlock(title: String, description: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceContainerLow, Shapes.large)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(title, style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 1.5.sp), color = SecondaryTerracotta)
        Text(description, style = MaterialTheme.typography.bodyMedium, color = PrimaryForest)
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
        androidx.compose.foundation.layout.Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.CheckCircle, null, tint = PrimaryForest)
            Spacer(modifier = Modifier.padding(8.dp))
            Column {
                Text(text = title, style = MaterialTheme.typography.labelMedium, color = SecondaryTerracotta)
                Text(text = description, style = MaterialTheme.typography.bodyMedium, color = PrimaryForest)
            }
        }
    }
}
