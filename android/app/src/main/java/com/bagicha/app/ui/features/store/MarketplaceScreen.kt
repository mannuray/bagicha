package com.bagicha.app.ui.features.store

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Star
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
fun MarketplaceScreen(
    viewModel: StoreViewModel,
    navController: NavController
) {
    val products by viewModel.products.collectAsState()
    val categories = listOf("All", "Orchard", "Tools", "Seeds", "Care")
    var selectedCategory by remember { mutableStateOf("All") }

    Scaffold(
        containerColor = SurfaceBase,
        bottomBar = { BottomNavigationBar(navController = navController) }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 24.dp)
        ) {
            // 0. Status Bar Spacer
            item { Spacer(modifier = Modifier.height(24.dp)) }

            // 1. Editorial Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "MARKETPLACE",
                            style = MaterialTheme.typography.labelMedium,
                            color = SecondaryTerracotta
                        )
                        Text(
                            text = "The Store",
                            style = MaterialTheme.typography.headlineLarge.copy(fontSize = 48.sp),
                            color = PrimaryForest
                        )
                    }
                    IconButton(
                        onClick = { navController.navigate(Screen.SeedBoxBuilder.route) },
                        modifier = Modifier.background(SurfaceContainerLow, CircleShape)
                    ) {
                        Icon(Icons.Default.ShoppingCart, contentDescription = "Seed Box", tint = PrimaryForest)
                    }
                }
                Spacer(modifier = Modifier.height(32.dp))
            }

            // 2. Filter Row
            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(bottom = 24.dp)
                ) {
                    items(categories) { category ->
                        val isSelected = selectedCategory == category
                        Box(
                            modifier = Modifier
                                .clip(FullRounded)
                                .background(if (isSelected) PrimaryForest else SurfaceContainerLow)
                                .clickable { selectedCategory = category }
                                .padding(horizontal = 20.dp, vertical = 10.dp)
                        ) {
                            Text(
                                text = category.uppercase(),
                                style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp),
                                color = if (isSelected) Color.White else PrimaryForest
                            )
                        }
                    }
                }
            }

            // 3. Products
            items(products) { product ->
                ProductCard(
                    product = product,
                    onAction = { /* Razorpay Mock */ },
                    actionLabel = if (product.isSapling) "Buy & Add to Ledger" else "Buy Now"
                )
                Spacer(modifier = Modifier.height(24.dp))
            }
            
            // 4. Premium Upsell
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { navController.navigate(Screen.Paywall.route) },
                    colors = CardDefaults.cardColors(containerColor = SecondaryTerracottaContainer.copy(alpha = 0.1f)),
                    shape = Shapes.large
                ) {
                    Row(
                        modifier = Modifier.padding(24.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(SecondaryTerracotta.copy(alpha = 0.1f), PebbleShape1),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Star, null, tint = SecondaryTerracotta)
                        }
                        Spacer(modifier = Modifier.width(20.dp))
                        Column {
                            Text(
                                text = "Bagicha Premium",
                                style = MaterialTheme.typography.titleLarge.copy(fontFamily = androidx.compose.ui.text.font.FontFamily.Serif),
                                color = PrimaryForest
                            )
                            Text(
                                text = "UNLOCK UNLIMITED AI DIAGNOSIS",
                                style = MaterialTheme.typography.labelMedium.copy(fontSize = 9.sp),
                                color = OnSurfaceVariant
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(100.dp))
            }
        }
    }
}
