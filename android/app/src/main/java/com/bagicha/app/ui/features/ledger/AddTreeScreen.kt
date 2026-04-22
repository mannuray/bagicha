package com.bagicha.app.ui.features.ledger

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.Spa
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
fun AddTreeScreen(
    viewModel: LedgerViewModel,
    isEditMode: Boolean,
    navController: NavController
) {
    val draft = viewModel.currentDraft(isEditMode)
    var name by remember(draft, isEditMode) { mutableStateOf(draft.name) }
    var species by remember(draft, isEditMode) { mutableStateOf(draft.species) }
    var variety by remember(draft, isEditMode) { mutableStateOf(draft.variety) }
    var plantingDate by remember(draft, isEditMode) { mutableStateOf(draft.plantingDate) }
    var selectedType by remember(draft, isEditMode) { mutableStateOf(draft.type) }
    var selectedStage by remember(draft, isEditMode) { mutableStateOf(draft.stage) }
    val scrollState = rememberScrollState()
    val isSubmitting by viewModel.isSubmitting.collectAsState()
    val error by viewModel.error.collectAsState()

    Box(modifier = Modifier.fillMaxSize().background(SurfaceBase)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
        ) {
            // Hero Header Section
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(380.dp)
            ) {
                AsyncImage(
                    model = R.drawable.login_hero, // Using login_hero as a temporary local replacement
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
                // Top Navigation overlay
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { navController.popBackStack() },
                        modifier = Modifier.background(SurfaceBase.copy(alpha = 0.4f), CircleShape)
                    ) {
                        Icon(Icons.Default.ArrowBack, null, tint = PrimaryForest)
                    }
                }
                
                // Branding Overlay
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(
                        modifier = Modifier
                            .size(128.dp)
                            .background(Color.White.copy(alpha = 0.1f), CircleShape)
                            .clip(CircleShape)
                            .blur(16.dp)
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Default.Spa, null, tint = Color.White, modifier = Modifier.size(32.dp))
                        Text("Bagicha", style = MaterialTheme.typography.titleLarge.copy(fontStyle = FontStyle.Italic, color = Color.White))
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Spa, null, tint = Color.White, modifier = Modifier.size(32.dp))
                        Text("Bagicha", style = MaterialTheme.typography.titleLarge.copy(fontStyle = FontStyle.Italic, color = Color.White))
                    }
                }
            }

            // 2. Content Card (Overlapping)
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-48).dp),
                shape = RoundedCornerShape(topStart = 48.dp, topEnd = 48.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceBase),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 48.dp)
                ) {
                    Text(
                        text = "Start a\nLegacy",
                        style = MaterialTheme.typography.headlineLarge.copy(fontSize = 48.sp),
                        color = PrimaryForest,
                        lineHeight = 52.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Document your new planting to begin its biological history.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = OnSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(40.dp))

                    // 3. Biological Classification
                    Text(
                        text = "BIOLOGICAL CLASSIFICATION",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(start = 16.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ClassificationPebble("FRUIT BEARING", selectedType == TreeCategory.FRUIT_BEARING) { selectedType = TreeCategory.FRUIT_BEARING }
                        ClassificationPebble("NON-FRUIT", selectedType == TreeCategory.NON_FRUIT_BEARING) { selectedType = TreeCategory.NON_FRUIT_BEARING }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    ClassificationPebble("ORNAMENTAL", selectedType == TreeCategory.ORNAMENTAL) { selectedType = TreeCategory.ORNAMENTAL }

                    Spacer(modifier = Modifier.height(32.dp))

                    // 4. Input Group
                    BagichaInput(label = "TREE NAME", placeholder = "e.g. The Heritage Oak", value = name, onValueChange = { name = it })
                    BagichaInput(label = "SPECIES", placeholder = "e.g. Quercus Robur", value = species, onValueChange = { species = it }, isItalic = true)
                    BagichaInput(label = "VARIETY", placeholder = "e.g. English Oak", value = variety, onValueChange = { variety = it })
                    
                    BagichaInput(
                        label = "PLANTING DATE",
                        placeholder = "YYYY-MM-DD (optional)",
                        value = plantingDate,
                        onValueChange = { plantingDate = it }
                    )

                    Text(
                        text = "CURRENT STAGE",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(start = 16.dp, top = 12.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        StagePebble("SAPLING", selectedStage == LifecycleStage.SAPLING) {
                            selectedStage = LifecycleStage.SAPLING
                        }
                        StagePebble("JUVENILE", selectedStage == LifecycleStage.JUVENILE) {
                            selectedStage = LifecycleStage.JUVENILE
                        }
                        StagePebble("FIRST FLOWERING", selectedStage == LifecycleStage.FLOWERING) {
                            selectedStage = LifecycleStage.FLOWERING
                        }
                        StagePebble("MATURE BEARING", selectedStage == LifecycleStage.MATURE) {
                            selectedStage = LifecycleStage.MATURE
                        }
                    }

                    Spacer(modifier = Modifier.height(32.dp))

                    // 5. Initial Portrait zone
                    Text("INITIAL PORTRAIT", style = MaterialTheme.typography.labelMedium, color = OnSurfaceVariant, modifier = Modifier.padding(start = 16.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp)
                            .clip(PebbleShape6)
                            .background(SurfaceContainerLow)
                            .border(2.dp, PrimaryForest.copy(alpha = 0.1f), PebbleShape6)
                            .clickable { /* Camera */ },
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.PhotoCamera, null, tint = PrimaryForest.copy(alpha = 0.4f), modifier = Modifier.size(40.dp))
                            Text("Capture its first moment", style = MaterialTheme.typography.labelMedium, color = OnSurfaceVariant.copy(alpha = 0.6f))
                        }
                    }

                    Spacer(modifier = Modifier.height(48.dp))

                    error?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // 6. Primary Action
                    Button(
                        onClick = {
                            viewModel.saveTree(
                                isEditMode = isEditMode,
                                name = name,
                                species = species,
                                variety = variety,
                                type = selectedType,
                                plantingDate = plantingDate,
                                stage = selectedStage
                            ) {
                                viewModel.stopEditingTree()
                                navController.popBackStack()
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(64.dp)
                            .background(PrimaryGradient, FullRounded),
                        shape = FullRounded,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        enabled = name.isNotBlank() && species.isNotBlank() && !isSubmitting
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Text(
                                text = if (isEditMode) "UPDATE REGISTRY" else "ADD TO SANCTUARY",
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = 2.sp),
                                color = Color.White
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(32.dp))
                }
            }
        }
    }
}

@Composable
fun StagePebble(text: String, isSelected: Boolean, onClick: () -> Unit) {
    ClassificationPebble(text = text, isSelected = isSelected, onClick = onClick)
}

@Composable
fun ClassificationPebble(text: String, isSelected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(FullRounded)
            .background(if (isSelected) PrimaryForest else SurfaceContainerLow)
            .clickable { onClick() }
            .padding(horizontal = 20.dp, vertical = 10.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp),
            color = if (isSelected) Color.White else OnSurfaceVariant
        )
    }
}

@Composable
fun BagichaInput(
    label: String,
    placeholder: String,
    value: String,
    onValueChange: (String) -> Unit,
    isItalic: Boolean = false
) {
    Column(modifier = Modifier.padding(vertical = 12.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = OnSurfaceVariant, modifier = Modifier.padding(start = 16.dp))
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, color = OnSurfaceVariant.copy(alpha = 0.3f), fontStyle = if (isItalic) FontStyle.Italic else FontStyle.Normal) },
            modifier = Modifier.fillMaxWidth().background(SurfaceContainer, Shapes.large),
            shape = Shapes.large,
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.Transparent,
                unfocusedContainerColor = Color.Transparent,
                focusedIndicatorColor = GhostBorderPrimary,
                unfocusedIndicatorColor = Color.Transparent
            ),
            singleLine = true
        )
    }
}
