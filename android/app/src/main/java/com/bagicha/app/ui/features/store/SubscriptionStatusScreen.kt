package com.bagicha.app.ui.features.store

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubscriptionStatusScreen(
    viewModel: StoreViewModel,
    navController: NavController
) {
    val subscriptions by viewModel.activeSubscriptions.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Subscriptions") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 24.dp)
        ) {
            item {
                Text(
                    text = "Active Deliveries",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(vertical = 16.dp),
                    fontWeight = FontWeight.Bold
                )
            }

            items(subscriptions) { sub ->
                SubscriptionItem(sub = sub)
                Spacer(modifier = Modifier.height(16.dp))
            }

            item {
                Spacer(modifier = Modifier.height(32.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text(text = "Premium Digital Member", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        Text(text = "Next billing on May 20, 2026", fontSize = 12.sp)
                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedButton(onClick = { /* TODO */ }, modifier = Modifier.fillMaxWidth()) {
                            Text("Manage Digital Plan")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SubscriptionItem(sub: Subscription) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = sub.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(text = "Next Kit: ${sub.nextDelivery}", fontSize = 14.sp, color = Color.Gray)
            }
            Switch(
                checked = sub.status == "Active",
                onCheckedChange = { /* TODO */ }
            )
        }
    }
}
