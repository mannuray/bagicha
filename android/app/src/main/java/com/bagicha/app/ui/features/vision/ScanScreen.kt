package com.bagicha.app.ui.features.vision

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.bagicha.app.ui.navigation.Screen
import com.bagicha.app.ui.theme.*
import java.io.ByteArrayOutputStream
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScanScreen(
    viewModel: VisionViewModel,
    navController: NavController
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val scanMode by viewModel.scanMode.collectAsState()
    val scanStatus by viewModel.scanStatus.collectAsState()
    val trees by viewModel.trees.collectAsState()
    val selectedTreeId by viewModel.selectedTreeId.collectAsState()
    val diagnosisNote by viewModel.diagnosisNote.collectAsState()
    val diagnosisEventAt by viewModel.diagnosisEventAt.collectAsState()
    val error by viewModel.error.collectAsState()
    val pendingImageDataUri by viewModel.pendingImageDataUri.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    var treeMenuExpanded by remember { mutableStateOf(false) }
    var imageCapture by remember { mutableStateOf<ImageCapture?>(null) }
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        )
    }
    val selectedTree = trees.find { it.id == selectedTreeId }
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasCameraPermission = granted
    }
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            runCatching { context.contentResolver.readImageBase64(it) }
                .onSuccess { base64 -> viewModel.stageImage(base64) }
                .onFailure { viewModel.reportError("Failed to read the selected image") }
        }
    }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // 1. Camera Viewfinder Background
        if (pendingImageDataUri != null) {
            AsyncImage(
                model = pendingImageDataUri,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = androidx.compose.ui.layout.ContentScale.Crop
            )
        } else if (hasCameraPermission) {
            CameraPreview(
                onImageCaptureReady = { imageCapture = it }
            )
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(PrimaryForest.copy(alpha = 0.08f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "Camera permission is required for live capture. You can still pick from gallery.",
                    color = PrimaryForest,
                    style = MaterialTheme.typography.bodyLarge,
                    modifier = Modifier.padding(24.dp)
                )
            }
        }
        
        // Depth Vignette
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(PrimaryForest.copy(alpha = 0.2f), Color.Transparent, PrimaryForest.copy(alpha = 0.3f))
                    )
                )
        )

        // 2. Glassmorphic Top Bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 24.dp, vertical = 16.dp)
                .clip(FullRounded)
                .background(SurfaceBase.copy(alpha = 0.4f))
                .blur(30.dp)
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 24.dp, vertical = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { navController.popBackStack() }) {
                    Icon(Icons.Default.Close, null, tint = PrimaryForest)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "Bagicha Scan", 
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontStyle = FontStyle.Italic,
                        fontFamily = androidx.compose.ui.text.font.FontFamily.Serif,
                        fontSize = 20.sp
                    ),
                    color = PrimaryForest
                )
            }
            Icon(Icons.Default.Info, null, tint = PrimaryForest)
        }

        // 3. Smart Tip
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 120.dp)
                .background(SurfaceBase.copy(alpha = 0.8f), FullRounded)
                .padding(horizontal = 24.dp, vertical = 12.dp)
        ) {
            Text(
                "Focus on the leaf veins for better diagnosis.",
                style = MaterialTheme.typography.labelMedium,
                color = PrimaryForest
            )
        }

        // 4. Organic Pebble Reticle
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(48.dp),
            contentAlignment = Alignment.Center
        ) {
            if (pendingImageDataUri == null) {
                PebbleReticle(isScanning = scanStatus == ScanStatus.SCANNING)
            }
        }

        // 5. Bottom Controls
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 48.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(32.dp)
        ) {
            // Hybrid Mode Toggle
            Box(
                modifier = Modifier
                    .background(SurfaceBase.copy(alpha = 0.8f), FullRounded)
                    .padding(6.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ModeButton("IDENTIFY", scanMode == ScanMode.IDENTIFY) { viewModel.setScanMode(ScanMode.IDENTIFY) }
                    ModeButton("DIAGNOSE", scanMode == ScanMode.DIAGNOSE) { viewModel.setScanMode(ScanMode.DIAGNOSE) }
                }
            }

            if (scanMode == ScanMode.DIAGNOSE) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp)
                        .background(SurfaceBase.copy(alpha = 0.82f), Shapes.extraLarge)
                        .padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text(
                        "LINK THIS DIAGNOSIS",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                        color = SecondaryTerracotta
                    )
                    Box {
                        OutlinedTextField(
                            value = selectedTree?.title ?: "Choose a tree journal",
                            onValueChange = {},
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { treeMenuExpanded = true },
                            readOnly = true,
                            label = { Text("Plant context") },
                            trailingIcon = { Icon(Icons.Default.KeyboardArrowDown, null) }
                        )
                        DropdownMenu(
                            expanded = treeMenuExpanded,
                            onDismissRequest = { treeMenuExpanded = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("No tree selected") },
                                onClick = {
                                    viewModel.selectTree(null)
                                    treeMenuExpanded = false
                                }
                            )
                            trees.forEach { tree ->
                                DropdownMenuItem(
                                    text = {
                                        Column {
                                            Text(tree.title, color = PrimaryForest)
                                            if (tree.subtitle.isNotBlank()) {
                                                Text(tree.subtitle, style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                                            }
                                        }
                                    },
                                    onClick = {
                                        viewModel.selectTree(tree.id)
                                        treeMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }
                    OutlinedTextField(
                        value = diagnosisEventAt,
                        onValueChange = viewModel::updateDiagnosisEventAt,
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("When did this happen?") },
                        placeholder = { Text("YYYY-MM-DD, YYYY-MM, or YYYY") }
                    )
                    OutlinedTextField(
                        value = diagnosisNote,
                        onValueChange = viewModel::updateDiagnosisNote,
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Observed symptoms") },
                        placeholder = { Text("e.g. small fruits dropping after heat, white pests under leaves") },
                        minLines = 3
                    )
                }
            }

            if (pendingImageDataUri != null) {
                ReviewCard(
                    scanMode = scanMode,
                    isLoading = isLoading,
                    onRetake = { viewModel.clearStagedImage() },
                    onAnalyze = {
                        viewModel.submitStagedImage { mode ->
                            navController.navigate(
                                if (mode == ScanMode.IDENTIFY) Screen.IdentifyResult.route else Screen.DiagnoseResult.route
                            )
                        }
                    }
                )
            } else {
                CaptureHint(scanMode = scanMode)
            }

            error?.let {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp)
                        .background(MaterialTheme.colorScheme.errorContainer, Shapes.large)
                        .padding(14.dp)
                ) {
                    Text(it, color = MaterialTheme.colorScheme.onErrorContainer)
                }
            }

            // Main Interaction Row
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 48.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                GlassControlIcon(Icons.Default.PhotoLibrary) {
                    galleryLauncher.launch("image/*")
                }
                
                // The River Stone (Capture Button)
                Box(
                    modifier = Modifier
                        .size(92.dp)
                        .background(SurfaceBase.copy(alpha = 0.4f), CircleShape)
                        .padding(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(PrimaryGradient, CircleShape)
                            .clickable {
                                if (pendingImageDataUri != null) {
                                    viewModel.submitStagedImage { mode ->
                                        navController.navigate(
                                            if (mode == ScanMode.IDENTIFY) Screen.IdentifyResult.route else Screen.DiagnoseResult.route
                                        )
                                    }
                                    return@clickable
                                }
                                if (!hasCameraPermission) {
                                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                                } else {
                                    imageCapture?.let { capture ->
                                        val outputFile = File.createTempFile("bagicha-scan-", ".jpg", context.cacheDir)
                                        capture.takePicture(
                                            ImageCapture.OutputFileOptions.Builder(outputFile).build(),
                                            ContextCompat.getMainExecutor(context),
                                            object : ImageCapture.OnImageSavedCallback {
                                                override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                                                    val base64 = outputFile.takeIf { it.exists() }?.readBytes()?.let {
                                                        Base64.encodeToString(it, Base64.NO_WRAP)
                                                    }
                                                    outputFile.delete()
                                                    if (!base64.isNullOrBlank()) {
                                                        viewModel.stageImage(base64)
                                                    } else {
                                                        viewModel.reportError("Failed to capture image")
                                                    }
                                                }

                                                override fun onError(exception: ImageCaptureException) {
                                                    outputFile.delete()
                                                    viewModel.reportError(exception.message ?: "Failed to capture image")
                                                }
                                            }
                                        )
                                    } ?: viewModel.reportError("Camera is not ready yet")
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .border(2.dp, Color.White.copy(alpha = 0.3f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(
                                    color = Color.White,
                                    strokeWidth = 2.dp,
                                    modifier = Modifier.size(22.dp)
                                )
                            } else {
                                Box(modifier = Modifier.size(16.dp).background(Color.White, CircleShape))
                            }
                        }
                    }
                }

                GlassControlIcon(if (pendingImageDataUri != null) Icons.Default.Refresh else Icons.Default.FlashOn) {
                    if (pendingImageDataUri != null) viewModel.clearStagedImage()
                }
            }
        }
    }
}

@Composable
fun PebbleReticle(isScanning: Boolean) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(tween(1500), RepeatMode.Reverse),
        label = "alpha"
    )

    Box(modifier = Modifier.size(width = 280.dp, height = 320.dp)) {
        // Organic Pebble Border
        Box(
            modifier = Modifier
                .fillMaxSize()
                .border(2.dp, PrimaryForest.copy(alpha = alpha), PebbleShape6)
                .clip(PebbleShape6)
        )
        
        // Corner Accents
        Box(modifier = Modifier.align(Alignment.TopStart).size(32.dp).border(width = 3.dp, color = PrimaryFixedDim, shape = RoundedCornerShape(topStart = 24.dp)))
        Box(modifier = Modifier.align(Alignment.BottomEnd).size(32.dp).border(width = 3.dp, color = PrimaryFixedDim, shape = RoundedCornerShape(bottomEnd = 24.dp)))
    }
}

@Composable
private fun CaptureHint(scanMode: ScanMode) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp)
            .background(SurfaceBase.copy(alpha = 0.82f), Shapes.large)
            .padding(16.dp)
    ) {
        Text(
            text = if (scanMode == ScanMode.IDENTIFY) {
                "Capture or pick a clear plant image, then review it before Bagicha identifies it."
            } else {
                "Capture or pick a clear symptom image, then review it before Bagicha diagnoses and logs it."
            },
            style = MaterialTheme.typography.bodyMedium,
            color = PrimaryForest
        )
    }
}

@Composable
private fun ReviewCard(
    scanMode: ScanMode,
    isLoading: Boolean,
    onRetake: () -> Unit,
    onAnalyze: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp)
            .background(SurfaceBase.copy(alpha = 0.9f), Shapes.extraLarge)
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            "REVIEW CAPTURE",
            style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
            color = SecondaryTerracotta
        )
        Text(
            if (scanMode == ScanMode.IDENTIFY) {
                "The selected image is ready. Confirm it before Bagicha identifies the plant."
            } else {
                "The selected image is ready. Confirm it before Bagicha diagnoses and saves the outcome to the journal."
            },
            style = MaterialTheme.typography.bodyMedium,
            color = PrimaryForest
        )
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedButton(
                onClick = onRetake,
                modifier = Modifier.weight(1f),
                enabled = !isLoading
            ) {
                Text("Retake")
            }
            Button(
                onClick = onAnalyze,
                modifier = Modifier.weight(1f),
                enabled = !isLoading
            ) {
                Text(if (scanMode == ScanMode.IDENTIFY) "Identify" else "Diagnose")
            }
        }
    }
}

@Composable
fun ModeButton(text: String, isSelected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(FullRounded)
            .background(if (isSelected) PrimaryForest else Color.Transparent)
            .clickable { onClick() }
            .padding(horizontal = 24.dp, vertical = 10.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = if (isSelected) Color.White else PrimaryForest.copy(alpha = 0.6f)
        )
    }
}

@Composable
fun GlassControlIcon(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(56.dp)
            .background(SurfaceBase.copy(alpha = 0.8f), CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            icon,
            null,
            tint = PrimaryForest,
            modifier = Modifier
                .size(24.dp)
                .clickable { onClick() }
        )
    }
}

private fun android.content.ContentResolver.readImageBase64(uri: Uri): String {
    val bytes = openInputStream(uri)?.use { input ->
        val bitmap = BitmapFactory.decodeStream(input) ?: return@use ByteArray(0)
        val buffer = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 88, buffer)
        buffer.toByteArray()
    } ?: ByteArray(0)
    return Base64.encodeToString(bytes, Base64.NO_WRAP)
}
