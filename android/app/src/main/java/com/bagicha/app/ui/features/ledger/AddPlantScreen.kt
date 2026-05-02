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
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddPlantScreen(
    viewModel: LedgerViewModel,
    isEditMode: Boolean,
    navController: NavController
) {
    val draft = viewModel.currentDraft(isEditMode)
    var name by remember(draft, isEditMode) { mutableStateOf(draft.name) }
    var plantQuery by remember(draft, isEditMode) { mutableStateOf(draft.variety.ifBlank { draft.species }) }
    var species by remember(draft, isEditMode) { mutableStateOf(draft.species) }
    var variety by remember(draft, isEditMode) { mutableStateOf(draft.variety) }
    var plantingDate by remember(draft, isEditMode) { mutableStateOf(draft.plantingDate) }
    var selectedRecordKind by remember(draft, isEditMode) { mutableStateOf(draft.recordKind) }
    var selectedType by remember(draft, isEditMode) { mutableStateOf(draft.type) }
    var selectedGrowthHabit by remember(draft, isEditMode) { mutableStateOf(draft.growthHabit) }
    var selectedRecordPattern by remember(draft, isEditMode) { mutableStateOf(draft.recordPattern) }
    var selectedStage by remember(draft, isEditMode) { mutableStateOf(draft.stage) }
    val scrollState = rememberScrollState()
    val isSubmitting by viewModel.isSubmitting.collectAsState()
    val error by viewModel.error.collectAsState()
    val plantSuggestions by viewModel.plantSuggestions.collectAsState()
    val resolvedPlant by viewModel.resolvedPlant.collectAsState()

    LaunchedEffect(plantQuery) {
        val normalized = plantQuery.trim()
        if (normalized.isBlank()) {
            viewModel.clearPlantResolution()
            return@LaunchedEffect
        }
        delay(250)
        viewModel.searchPlantSuggestions(normalized)
    }

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
                        text = selectedRecordKind.heroTitle(),
                        style = MaterialTheme.typography.headlineLarge.copy(fontSize = 48.sp),
                        color = PrimaryForest,
                        lineHeight = 52.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = selectedRecordKind.heroSubtitle(),
                        style = MaterialTheme.typography.bodyLarge,
                        color = OnSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(40.dp))

                    Text(
                        text = "WHAT ARE YOU ADDING?",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(start = 16.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ClassificationPebble("TREE", selectedRecordKind == RecordKind.TREE) {
                            selectedRecordKind = RecordKind.TREE
                            val (habit, pattern) = RecordKind.TREE.defaultPositioning()
                            selectedGrowthHabit = habit
                            selectedRecordPattern = pattern
                        }
                        ClassificationPebble("FLOWER", selectedRecordKind == RecordKind.FLOWER) {
                            selectedRecordKind = RecordKind.FLOWER
                            val (habit, pattern) = RecordKind.FLOWER.defaultPositioning()
                            selectedGrowthHabit = habit
                            selectedRecordPattern = pattern
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    ClassificationPebble("CROP", selectedRecordKind == RecordKind.CROP) {
                        selectedRecordKind = RecordKind.CROP
                        val (habit, pattern) = RecordKind.CROP.defaultPositioning()
                        selectedGrowthHabit = habit
                        selectedRecordPattern = pattern
                    }

                    Spacer(modifier = Modifier.height(32.dp))

                    // 3. Biological Classification
                    Text(
                        text = "CLASSIFICATION",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(start = 16.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ClassificationPebble(selectedRecordKind.primaryTypeLabel(), selectedType == PlantCategory.FRUIT_BEARING) { selectedType = PlantCategory.FRUIT_BEARING }
                        ClassificationPebble(selectedRecordKind.secondaryTypeLabel(), selectedType == PlantCategory.NON_FRUIT_BEARING) { selectedType = PlantCategory.NON_FRUIT_BEARING }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    ClassificationPebble(selectedRecordKind.tertiaryTypeLabel(), selectedType == PlantCategory.ORNAMENTAL) { selectedType = PlantCategory.ORNAMENTAL }

                    Spacer(modifier = Modifier.height(32.dp))

                    // 4. Input Group
                    BagichaInput(
                        label = selectedRecordKind.displayNameLabel(),
                        placeholder = selectedRecordKind.displayNamePlaceholder(),
                        value = name,
                        onValueChange = { name = it }
                    )
                    BagichaInput(
                        label = selectedRecordKind.displaySubjectLabel(),
                        placeholder = selectedRecordKind.displaySubjectPlaceholder(),
                        value = plantQuery,
                        onValueChange = {
                            plantQuery = it
                            species = ""
                            variety = ""
                        },
                        isItalic = true
                    )
                    if (plantSuggestions.isNotEmpty()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(SurfaceContainerLow, Shapes.large)
                                .padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            plantSuggestions.take(4).forEach { suggestion ->
                                SuggestionRow(
                                    title = suggestion.displayName,
                                    subtitle = "${suggestion.species.replaceFirstChar(Char::titlecase)}${suggestion.variety?.let { " • ${it.replaceFirstChar(Char::titlecase)}" } ?: ""}",
                                    onClick = {
                                        plantQuery = suggestion.displayName
                                        species = suggestion.species
                                        variety = suggestion.variety.orEmpty()
                                        viewModel.choosePlantSuggestion(suggestion)
                                    }
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    if (resolvedPlant != null) {
                        ResolvedIdentityCard(
                            species = species,
                            variety = variety,
                            speciesFamily = resolvedPlant?.speciesFamily.orEmpty()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    BagichaInput(
                        label = "NORMALIZED SPECIES",
                        placeholder = "Auto-filled from plant, flower, or crop",
                        value = species,
                        onValueChange = { species = it }
                    )
                    BagichaInput(
                        label = "VARIETY",
                        placeholder = "Auto-filled when detected",
                        value = variety,
                        onValueChange = { variety = it }
                    )
                    
                    BagichaInput(
                        label = "PLANTING DATE",
                        placeholder = "YYYY, YYYY-MM, or YYYY-MM-DD (optional)",
                        value = plantingDate,
                        onValueChange = { plantingDate = it }
                    )

                    Text(
                        text = "GROWTH HABIT",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(start = 16.dp, top = 12.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        StagePebble("PERENNIAL", selectedGrowthHabit == GrowthHabit.PERENNIAL) {
                            selectedGrowthHabit = GrowthHabit.PERENNIAL
                        }
                        StagePebble("SEASONAL", selectedGrowthHabit == GrowthHabit.SEASONAL) {
                            selectedGrowthHabit = GrowthHabit.SEASONAL
                        }
                        StagePebble("ANNUAL", selectedGrowthHabit == GrowthHabit.ANNUAL) {
                            selectedGrowthHabit = GrowthHabit.ANNUAL
                        }
                        StagePebble("BIENNIAL", selectedGrowthHabit == GrowthHabit.BIENNIAL) {
                            selectedGrowthHabit = GrowthHabit.BIENNIAL
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    Text(
                        text = "RECORD PATTERN",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(start = 16.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        StagePebble("LONG LIVED", selectedRecordPattern == RecordPattern.LONG_LIVED) {
                            selectedRecordPattern = RecordPattern.LONG_LIVED
                        }
                        StagePebble("RECURRING SEASONAL", selectedRecordPattern == RecordPattern.RECURRING_SEASONAL) {
                            selectedRecordPattern = RecordPattern.RECURRING_SEASONAL
                        }
                        StagePebble("ONE OFF SEASON", selectedRecordPattern == RecordPattern.ONE_OFF_SEASON) {
                            selectedRecordPattern = RecordPattern.ONE_OFF_SEASON
                        }
                    }

                    Text(
                        text = "CURRENT STAGE",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(start = 16.dp, top = 12.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        selectedRecordKind.stageOptions().forEach { option ->
                            StagePebble(option.label, selectedStage == option.stage) {
                                selectedStage = option.stage
                            }
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
                            viewModel.resolvePlantIdentity(plantQuery) { resolved ->
                                val resolvedSpecies = resolved?.species ?: species
                                val resolvedVariety = resolved?.variety ?: variety
                                viewModel.saveTree(
                                    isEditMode = isEditMode,
                                    name = name,
                                    plantQuery = plantQuery,
                                    species = resolvedSpecies,
                                    variety = resolvedVariety,
                                    recordKind = selectedRecordKind,
                                    type = selectedType,
                                    growthHabit = selectedGrowthHabit,
                                    recordPattern = selectedRecordPattern,
                                    plantingDate = plantingDate,
                                    stage = selectedStage
                                ) {
                                    viewModel.stopEditingTree()
                                    navController.popBackStack()
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(64.dp)
                            .background(PrimaryGradient, FullRounded),
                        shape = FullRounded,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        enabled = name.isNotBlank() && plantQuery.isNotBlank() && !isSubmitting
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Text(
                                text = if (isEditMode) "UPDATE RECORD" else selectedRecordKind.saveCtaLabel(),
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

private data class StageOption(
    val stage: LifecycleStage,
    val label: String
)

private fun RecordKind.displayNameLabel(): String = when (this) {
    RecordKind.TREE -> "TREE NAME"
    RecordKind.FLOWER -> "FLOWER NAME"
    RecordKind.CROP -> "CROP NAME"
}

private fun RecordKind.displayNamePlaceholder(): String = when (this) {
    RecordKind.TREE -> "e.g. The Heritage Mango"
    RecordKind.FLOWER -> "e.g. Balcony Jasmine Pot"
    RecordKind.CROP -> "e.g. Winter Tomato Grow Bag"
}

private fun RecordKind.displaySubjectLabel(): String = when (this) {
    RecordKind.TREE -> "TREE OR FRUIT"
    RecordKind.FLOWER -> "FLOWER OR PLANT"
    RecordKind.CROP -> "CROP OR VEGETABLE"
}

private fun RecordKind.displaySubjectPlaceholder(): String = when (this) {
    RecordKind.TREE -> "e.g. Malda, Mango, Nimbu"
    RecordKind.FLOWER -> "e.g. Rose, Jasmine, Hibiscus"
    RecordKind.CROP -> "e.g. Tomato, Chilli, Spinach"
}

private fun RecordKind.primaryTypeLabel(): String = when (this) {
    RecordKind.TREE -> "FRUIT BEARING"
    RecordKind.FLOWER -> "FLOWERING"
    RecordKind.CROP -> "FRUITING"
}

private fun RecordKind.secondaryTypeLabel(): String = when (this) {
    RecordKind.TREE -> "NON-FRUIT"
    RecordKind.FLOWER -> "FOLIAGE"
    RecordKind.CROP -> "LEAFY / POD"
}

private fun RecordKind.tertiaryTypeLabel(): String = when (this) {
    RecordKind.TREE -> "ORNAMENTAL"
    RecordKind.FLOWER -> "ORNAMENTAL"
    RecordKind.CROP -> "HERB / OTHER"
}

private fun RecordKind.stageOptions(): List<StageOption> {
    return when (this) {
        RecordKind.TREE -> listOf(
            StageOption(LifecycleStage.SAPLING, "SAPLING"),
            StageOption(LifecycleStage.JUVENILE, "JUVENILE"),
            StageOption(LifecycleStage.FLOWERING, "FIRST FLOWERING"),
            StageOption(LifecycleStage.FIRST_HARVEST, "FIRST HARVEST"),
            StageOption(LifecycleStage.MATURE, "MATURE BEARING"),
        )
        RecordKind.FLOWER -> listOf(
            StageOption(LifecycleStage.SAPLING, "SEEDLING"),
            StageOption(LifecycleStage.JUVENILE, "VEGETATIVE"),
            StageOption(LifecycleStage.FLOWERING, "FLOWERING"),
            StageOption(LifecycleStage.MATURE, "ESTABLISHED"),
        )
        RecordKind.CROP -> listOf(
            StageOption(LifecycleStage.SAPLING, "SEEDLING"),
            StageOption(LifecycleStage.JUVENILE, "VEGETATIVE"),
            StageOption(LifecycleStage.FLOWERING, "FLOWERING"),
            StageOption(LifecycleStage.FIRST_HARVEST, "HARVEST WINDOW"),
        )
    }
}

private fun RecordKind.defaultPositioning(): Pair<GrowthHabit, RecordPattern> = when (this) {
    RecordKind.TREE -> GrowthHabit.PERENNIAL to RecordPattern.LONG_LIVED
    RecordKind.FLOWER -> GrowthHabit.PERENNIAL to RecordPattern.LONG_LIVED
    RecordKind.CROP -> GrowthHabit.ANNUAL to RecordPattern.RECURRING_SEASONAL
}

private fun RecordKind.heroTitle(): String = when (this) {
    RecordKind.TREE -> "Start a\nLegacy"
    RecordKind.FLOWER -> "Plant a\nBloom"
    RecordKind.CROP -> "Begin a\nSeason"
}

private fun RecordKind.heroSubtitle(): String = when (this) {
    RecordKind.TREE -> "Document your new tree to begin its biological history."
    RecordKind.FLOWER -> "Document your new flowering plant to begin its growing record."
    RecordKind.CROP -> "Document your new sowing to begin its growing record."
}

private fun RecordKind.saveCtaLabel(): String = when (this) {
    RecordKind.TREE -> "ADD TREE RECORD"
    RecordKind.FLOWER -> "ADD FLOWER RECORD"
    RecordKind.CROP -> "ADD CROP RECORD"
}

@Composable
fun SuggestionRow(title: String, subtitle: String, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(Shapes.medium)
            .clickable(onClick = onClick)
            .padding(horizontal = 8.dp, vertical = 10.dp)
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium, color = PrimaryForest)
        Spacer(modifier = Modifier.height(2.dp))
        Text(subtitle, style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
    }
}

@Composable
fun ResolvedIdentityCard(species: String, variety: String, speciesFamily: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(TertiaryContainer, Shapes.large)
            .padding(16.dp)
    ) {
        Text("DETECTED IDENTITY", style = MaterialTheme.typography.labelMedium, color = PrimaryForest)
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = buildString {
                append(species.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() })
                if (variety.isNotBlank()) append(" • ${variety.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }}")
            },
            style = MaterialTheme.typography.titleMedium,
            color = OnSurfaceNeutral
        )
        if (speciesFamily.isNotBlank()) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Family: ${speciesFamily.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }}",
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceVariant
            )
        }
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
