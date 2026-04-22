package com.bagicha.app.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.bagicha.app.ui.features.onboarding.*
import com.bagicha.app.ui.features.dashboard.*
import com.bagicha.app.ui.features.ledger.*
import com.bagicha.app.ui.features.vision.*
import com.bagicha.app.ui.features.community.*
import com.bagicha.app.ui.features.store.*
import com.bagicha.app.ui.features.auth.*
import com.bagicha.app.ui.theme.PrimaryForest

@Composable
fun NavGraph(navController: NavHostController) {
    val ledgerViewModel: LedgerViewModel = hiltViewModel()
    val visionViewModel: VisionViewModel = hiltViewModel()
    val communityViewModel: CommunityViewModel = hiltViewModel()
    val chatViewModel: ChatViewModel = hiltViewModel()
    val storeViewModel: StoreViewModel = hiltViewModel()
    val onboardingViewModel: OnboardingViewModel = hiltViewModel()

    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        // Auth & Onboarding
        composable(Screen.Splash.route) {
            SplashScreen(onTimeout = {
                val (isLoggedIn, isOnboarded) = onboardingViewModel.getSessionStatus()
                when {
                    isLoggedIn && isOnboarded -> {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Splash.route) { inclusive = true }
                        }
                    }
                    isLoggedIn -> {
                        navController.navigate(Screen.LanguageSelection.route) {
                            popUpTo(Screen.Splash.route) { inclusive = true }
                        }
                    }
                    else -> {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(Screen.Splash.route) { inclusive = true }
                        }
                    }
                }
            })
        }
        composable(Screen.Login.route) {
            LoginScreen(viewModel = onboardingViewModel, onOtpSent = { navController.navigate(Screen.Otp.route) })
        }
        composable(Screen.Otp.route) {
            OtpScreen(viewModel = onboardingViewModel, onVerified = { 
                val (_, isOnboarded) = onboardingViewModel.getSessionStatus()
                if (isOnboarded) {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                } else {
                    navController.navigate(Screen.LanguageSelection.route)
                }
            })
        }
        composable(Screen.LanguageSelection.route) {
            LanguageSelectionScreen(viewModel = onboardingViewModel, onNext = { navController.navigate(Screen.LocationSetup.route) })
        }
        composable(Screen.LocationSetup.route) {
            LocationSetupScreen(viewModel = onboardingViewModel, onNext = { navController.navigate(Screen.GardenProfile.route) })
        }
        composable(Screen.GardenProfile.route) {
            GardenProfileScreen(viewModel = onboardingViewModel, onFinish = { 
                onboardingViewModel.completeOnboarding {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            })
        }

        // Main App
        composable(Screen.Home.route) { 
            DashboardScreen(viewModel = hiltViewModel(), navController = navController)
        }
        composable(Screen.Ledger.route) { 
            TreeListScreen(viewModel = ledgerViewModel, navController = navController)
        }
        composable(Screen.TreeDetail.route) {
            TreeDetailScreen(viewModel = ledgerViewModel, navController = navController)
        }
        composable(Screen.AddTree.route) {
            AddTreeScreen(
                viewModel = ledgerViewModel,
                isEditMode = false,
                navController = navController
            )
        }
        composable(Screen.EditTree.route) {
            AddTreeScreen(
                viewModel = ledgerViewModel,
                isEditMode = true,
                navController = navController
            )
        }
        composable(Screen.Scan.route) { 
            ScanScreen(viewModel = visionViewModel, navController = navController)
        }
        composable(Screen.IdentifyResult.route) { IdentifyResultScreen(navController = navController) }
        composable(Screen.DiagnoseResult.route) { DiagnoseResultScreen(navController = navController) }
        composable(Screen.Community.route) { 
            CommunityFeedScreen(viewModel = communityViewModel, navController = navController)
        }
        composable(Screen.ChatInbox.route) { ChatInboxScreen(viewModel = chatViewModel, navController = navController) }
        composable(Screen.ChatDetail.route) { ChatDetailScreen(viewModel = chatViewModel, navController = navController) }
        composable(Screen.AiMentor.route) { AiMentorScreen(viewModel = communityViewModel, navController = navController) }

        // Profile & Settings
        composable(Screen.Profile.route) {
            ProfileScreen(navController = navController)
        }

        // Store
        composable(Screen.Marketplace.route) { MarketplaceScreen(viewModel = storeViewModel, navController = navController) }
        composable(Screen.Paywall.route) { PaywallScreen(navController = navController) }
        composable(Screen.SeedBoxBuilder.route) { SeedBoxBuilderScreen(viewModel = storeViewModel, navController = navController) }
        composable(Screen.SubscriptionStatus.route) { SubscriptionStatusScreen(viewModel = storeViewModel, navController = navController) }
    }
}

@Composable
fun PlaceholderWithNav(name: String, navController: NavHostController) {
    Scaffold(
        bottomBar = { BottomNavigationBar(navController = navController) }
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
            Text(text = name, style = MaterialTheme.typography.headlineMedium, color = PrimaryForest)
        }
    }
}
