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
import com.bagicha.app.ui.theme.*

data class GardenProfileOption(val id: String, val title: String, val label: String, val imageUrl: String)

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
            imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBtXBk2LGEzmzyeeUnZfBteww-TGhJIG4_3vx6ovNoN_nNJH_CAp0dz1d4DhqEqh_qPHL-3oMGTkAE5_F6NmhJapVH26oKgJqRUrZLIT6beyTmjbfpl3nSdeKbcFPUl5WlRNKEEZJlIwAdgJ6ft143INF8Zq1-XbQFcpliqZvcNzGWxB7qRlT8gUe2vgTWynE0gNtHV6PsFvbszYzMKR57EeuEihdMw2JyQLQScVENF7RmDUcCafpgY-AsQzCp6TuEGErrSsCuMOzQ"
        ),
        GardenProfileOption(
            id = "veggies",
            title = "Vegetables",
            label = "Harvest",
            imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuD-pxg5-uvAkJHjP_jgYMi4stE93nMo2P6y8G5X6x63fc98qw-szdO-ezm0NlV5aruVfa9f3BxtyXmk8NeiyW4EeC3WCRVavale661FthZKztYhhd6uVJ2qEp9mHcFZlRTfvxp5p_E44jHMLb4rMI3JtSCDlDu5IVkdH9ETCUVsvfJPzWEECQzc9IovmTc2QwLusddW7K4Fzfm_nT6BABjlzfKVta5kO6OCxf98SLc1pGyhPDR4iE7t1PQTTQ9G4f-g3bNCAMg4RvU"
        ),
        GardenProfileOption(
            id = "flowers",
            title = "Flowers",
            label = "Pollinator",
            imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAh0KD9YWIyb9uyr4Hvi2veeLp6IelhGOeRHSGdy9rJLyqNScxzsh54GSKJJcZiq9Ptb1XI8E-hqlfwguFG99py3hTS-6f0uWO4wiOJGI0d-WfhuLT7B63IN41W80sSyPtQsWhXVBLHb4bKvq2hy9NUKf7UtnlJnNtjYcdQAL86LQpsDyy0IhyIlTBl403K4B17vdHXjBTwKZhBu9nTV32cOTPHz4oJzADAwspir4okzB8huPo1BevzL_NOppwIQAlw-MZWOSbZ9LU"
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
                    model = "https://lh3.googleusercontent.com/aida-public/AB6AXuAw4eLea5zG-RXDot1Ckuig5KGi7TkbIHkzaazMNFzB8R7WIVv2qWNLOAUP23KFDt7qIpd-W0uXWOCe4VMNEyeaaFsS0TkmgJfJIzAFB84fmuGL0Be3IK7z7gqIIdwhb6K3Wo_IFvHUN4q7SnQzxRFlF7M9x4QUzuHMnkT9gZFII9iAIjHWIPz3Ko5y5mAJuLdHu-QmCzKwOH1HyQhu5rsCMpaLZH71_G6gXnPI5omu_H2xYGfyrNBx254on7NBxNWoo4IHUGJ_0Mg",
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
