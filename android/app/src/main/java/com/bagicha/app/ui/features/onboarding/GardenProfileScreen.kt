package com.bagicha.app.ui.features.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.bagicha.app.R
import com.bagicha.app.ui.theme.*

data class GardenProfileOption(val id: String, val title: String, val label: String, val imageUrl: Any)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GardenProfileScreen(
    viewModel: OnboardingViewModel,
    onFinish: () -> Unit
) {
    val selectedTypes by viewModel.selectedGardenTypes.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val authError by viewModel.authError.collectAsState()
    val scrollState = rememberScrollState()

    val profileOptions = listOf(
        GardenProfileOption(
            id = "trees",
            title = "Fruit Trees",
            label = "Orchard",
            imageUrl = R.drawable.fruit_trees
        ),
        GardenProfileOption(
            id = "veggies",
            title = "Vegetables",
            label = "Harvest",
            imageUrl = R.drawable.vegetables
        ),
        GardenProfileOption(
            id = "flowers",
            title = "Flowers",
            label = "Pollinator",
            imageUrl = R.drawable.flowers
        )
    )

    Scaffold(
        containerColor = SurfaceBase,
        bottomBar = {
            Box(modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 16.dp)) {
                if (isLoading) {
                    CircularProgressIndicator(color = PrimaryForest, modifier = Modifier.align(Alignment.Center))
                } else {
                    Button(
                        onClick = onFinish,
                        modifier = Modifier.fillMaxWidth().height(60.dp).background(PrimaryGradient, FullRounded),
                        shape = FullRounded,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        enabled = selectedTypes.isNotEmpty()
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Start Gardening", style = MaterialTheme.typography.titleLarge, color = Color.White)
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(Icons.Default.ArrowForward, null, tint = Color.White)
                        }
                    }
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = paddingValues.calculateBottomPadding())
                .verticalScroll(scrollState),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Hero Header
            Box(modifier = Modifier.fillMaxWidth().fillMaxHeight(0.3f).height(240.dp)) {
                AsyncImage(
                    model = R.drawable.garden_profile_hero,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        // Custom Ring Branding
                        AsyncImage(
                            model = com.bagicha.app.R.drawable.bagicha_branding,
                            contentDescription = null,
                            modifier = Modifier.size(140.dp)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Bagicha", style = MaterialTheme.typography.headlineSmall.copy(fontStyle = FontStyle.Italic, color = Color.White, fontSize = 24.sp))
                    }
                }
            }

            // Overlapping Card
            Card(
                modifier = Modifier.fillMaxWidth().offset(y = (-48).dp),
                shape = RoundedCornerShape(topStart = 48.dp, topEnd = 48.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceBase),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 32.dp)) {
                    Text(text = "Your Green\nBlueprint", style = MaterialTheme.typography.headlineLarge.copy(fontSize = 32.sp), color = PrimaryForest)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "Select your focuses for curation.", style = MaterialTheme.typography.bodyLarge, color = OnSurfaceVariant)
                    
                    Spacer(modifier = Modifier.height(40.dp))

                    // Choice Pillars
                    profileOptions.forEach { option ->
                        BlueprintCardDense(
                            option = option,
                            isSelected = selectedTypes.contains(option.id),
                            onClick = { viewModel.toggleGardenType(option.id) }
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                    
                    Spacer(modifier = Modifier.height(48.dp))

                    authError?.let { error ->
                        Text(
                            text = error,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun BlueprintCardDense(
    option: GardenProfileOption,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val backgroundColor = if (isSelected) PrimaryForest else SurfaceContainerLow
    val contentColor = if (isSelected) Color.White else PrimaryForest

    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = backgroundColor)
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(48.dp).clip(PebbleShape6).background(SurfaceContainer)) {
                AsyncImage(model = option.imageUrl, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = option.title, style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp), color = contentColor)
                Text(text = option.label.uppercase(), style = MaterialTheme.typography.labelMedium.copy(fontSize = 9.sp), color = if (isSelected) Color.White.copy(alpha = 0.6f) else OnSurfaceVariant)
            }
            if (isSelected) {
                Box(modifier = Modifier.size(24.dp).background(Color.White, CircleShape), contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.Check, null, tint = PrimaryForest, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}
