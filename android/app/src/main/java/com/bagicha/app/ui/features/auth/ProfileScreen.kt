package com.bagicha.app.ui.features.auth
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.bagicha.app.R
import com.bagicha.app.ui.navigation.BottomNavigationBar
import com.bagicha.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(navController: NavController) {
    Scaffold(
        containerColor = SurfaceBase,
        bottomBar = { BottomNavigationBar(navController = navController) }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 0. Top Padding Spacer
            item { Spacer(modifier = Modifier.height(24.dp)) }

            // 1. Profile Header
            item {
                Box(modifier = Modifier.size(160.dp)) {
                    AsyncImage(
                        model = R.drawable.avatar_arjun,
                        contentDescription = "Profile Photo",
                        modifier = Modifier.fillMaxSize().clip(PebbleShape6),
                        contentScale = ContentScale.Crop
                    )
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .size(40.dp)
                            .background(SecondaryTerracotta, CircleShape)
                            .padding(8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Edit, null, tint = Color.White, modifier = Modifier.size(20.dp))
                    }
                }
                Spacer(modifier = Modifier.height(24.dp))
                Text(text = "Arjun Sharma", style = MaterialTheme.typography.headlineLarge, color = PrimaryForest)
                Text(text = "SUSTAINABILITY ADVOCATE", style = MaterialTheme.typography.labelMedium, color = OnSurfaceVariant)
                
                Spacer(modifier = Modifier.height(32.dp))
                
                // Terracotta Status Card
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(SecondaryTerracottaContainer.copy(alpha = 0.15f), Shapes.large)
                        .padding(24.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("STATUS", style = MaterialTheme.typography.labelMedium.copy(fontSize = 9.sp))
                            Text("Master Orchardist", style = MaterialTheme.typography.titleLarge.copy(fontFamily = androidx.compose.ui.text.font.FontFamily.Serif), color = PrimaryForest)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("SUSTENANCE SCORE", style = MaterialTheme.typography.labelMedium.copy(fontSize = 9.sp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("850", style = MaterialTheme.typography.headlineSmall, color = SecondaryTerracotta)
                                Spacer(modifier = Modifier.width(8.dp))
                                Icon(Icons.Default.Eco, null, tint = SecondaryTerracotta, modifier = Modifier.size(20.dp))
                            }
                        }
                    }
                    // Vertical accent line
                    Box(modifier = Modifier.width(3.dp).height(48.dp).background(SecondaryTerracotta).align(Alignment.CenterStart))
                }
                Spacer(modifier = Modifier.height(48.dp))
            }

            // 2. Management Tiers
            item {
                SettingsGroup(title = "Journal Settings") {
                    SettingsItem(icon = Icons.Outlined.Language, label = "Language & Voice", value = "English")
                    SettingsItem(icon = Icons.Outlined.CloudOff, label = "Offline Mode", hasToggle = true)
                }
                Spacer(modifier = Modifier.height(24.dp))
                
                SettingsGroup(title = "Orchard Subscriptions") {
                    SettingsItem(icon = Icons.Outlined.Inventory2, label = "Kit Status")
                    SettingsItem(icon = Icons.Default.Star, label = "Bagicha Premium", value = "Active", valueColor = SecondaryTerracotta)
                }
                Spacer(modifier = Modifier.height(24.dp))

                SettingsGroup(title = "Sanctuary Logic") {
                    SettingsItem(icon = Icons.Outlined.VisibilityOff, label = "Location Privacy")
                    SettingsItem(icon = Icons.Outlined.Map, label = "GPS & Pincode Settings")
                }
            }

            // 3. Logout Section
            item {
                Spacer(modifier = Modifier.height(48.dp))
                Text(
                    text = "DISCONNECT FROM SANCTUARY",
                    modifier = Modifier.clickable { /* Logout */ }.padding(16.dp),
                    style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                    color = OnSurfaceVariant.copy(alpha = 0.5f)
                )
                Text(
                    text = "BAGICHA V2.4.0 • EARTH-BOUND EDITION",
                    style = MaterialTheme.typography.labelMedium.copy(fontSize = 9.sp),
                    color = OnSurfaceVariant.copy(alpha = 0.2f)
                )
                Spacer(modifier = Modifier.height(100.dp))
            }
        }
    }
}

@Composable
fun SettingsGroup(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceContainerLow, Shapes.large)
            .padding(8.dp)
    ) {
        Text(
            text = title, 
            style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp, fontFamily = androidx.compose.ui.text.font.FontFamily.Serif),
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            color = PrimaryForest.copy(alpha = 0.8f)
        )
        content()
    }
}

@Composable
fun SettingsItem(
    icon: ImageVector,
    label: String,
    value: String? = null,
    valueColor: Color = OnSurfaceVariant,
    hasToggle: Boolean = false
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable { }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = PrimaryForest.copy(alpha = 0.6f), modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.width(16.dp))
            Text(text = label, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }
        
        if (hasToggle) {
            Switch(
                checked = true, 
                onCheckedChange = { },
                colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = PrimaryForest)
            )
        } else {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (value != null) {
                    Text(text = value, style = MaterialTheme.typography.labelMedium, color = valueColor, fontSize = 12.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Icon(Icons.Default.ChevronRight, null, tint = OutlineVariant, modifier = Modifier.size(18.dp))
            }
        }
    }
}
